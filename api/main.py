"""FastAPI backend for Tally Spend."""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from backend.analysis import monthly_aggregate, category_breakdown, detect_anomalies
from backend.etl import normalize, detect_recurring
from backend.utils import currency_fmt

app = FastAPI(title="Tally Spend API", version="2.1.0")

# Explicit origin allowlist. Wildcard ("*") cannot be combined with
# allow_credentials=True per the Fetch/CORS spec — browsers reject it outright,
# and even where they didn't, "*" + credentials is a known security anti-pattern.
ALLOWED_ORIGINS = [
    os.environ.get("FRONTEND_URL", "http://localhost:5173"),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".csv", ".xlsx"}


class FilterRequest(BaseModel):
    transactions: List[dict]
    account_filter: Optional[str] = "All"
    month_filter: Optional[str] = "All"
    months_window: int = 3
    z_thresh: float = 3.0
    currency: str = "USD"


class ProcessResponse(BaseModel):
    transactions: List[dict]
    accounts: List[str]
    months: List[str]
    monthly: List[dict]
    categories: List[dict]
    anomalies: List[dict]
    kpis: dict
    status: str
    rows_dropped: int = 0


def _df_from_records(records: List[dict]) -> pd.DataFrame:
    df = pd.DataFrame(records)
    if "date" not in df.columns or "amount" not in df.columns:
        raise ValueError("Each transaction must include at least 'date' and 'amount'.")
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    # Optional columns: tolerate partial records (e.g. from a minimal API caller)
    # instead of throwing a KeyError that surfaces as an unhelpful 400.
    df["is_recurring"] = df["is_recurring"].astype(bool) if "is_recurring" in df.columns else False
    for col, default in (("account", "Unknown"), ("category", "Other"), ("merchant", "Unknown"), ("description", ""), ("tags", "")):
        if col not in df.columns:
            df[col] = default
    return df


def _run_analysis(df, account_filter, month_filter, months_window, z_thresh, currency="USD"):
    """Filters df, recalculates recurring flags against the user-supplied window,
    and returns the FILTERED + recalculated dataframe alongside the aggregates —
    so callers can serialize the same data the charts/KPIs were computed from,
    instead of silently falling back to a stale, unfiltered snapshot."""
    dff = df.copy()
    if account_filter and account_filter != "All" and "account" in dff.columns:
        dff = dff[dff["account"] == account_filter]
    if month_filter and month_filter != "All" and "date" in dff.columns:
        dff = dff[dff["date"].apply(
            lambda x: pd.to_datetime(x).to_period("M").strftime("%Y-%m") == month_filter
        )]
    if dff.empty:
        return dff, [], [], [], {"totalSpend": "N/A", "totalIncome": "N/A", "net": "N/A"}

    # Recompute is_recurring against the CURRENT months_window and keep the
    # result — previously this was calculated and then thrown away, so the
    # "Recurring Window" slider had no observable effect anywhere in the UI.
    dff = detect_recurring(dff, months_window=months_window)
    anomalies = detect_anomalies(dff, z_thresh=z_thresh)
    ma = monthly_aggregate(dff)
    cat = category_breakdown(
        dff,
        month=month_filter if month_filter and month_filter != "All" else None,
    )

    total_spend = (
        currency_fmt(abs(dff[dff["amount"] < 0]["amount"].sum()), currency)
        if "amount" in dff.columns else "N/A"
    )
    total_income = (
        currency_fmt(dff[dff["amount"] > 0]["amount"].sum(), currency)
        if "amount" in dff.columns else "N/A"
    )
    net = (
        currency_fmt(dff["amount"].sum(), currency)
        if "amount" in dff.columns else "N/A"
    )

    return (
        dff,
        ma.to_dict("records"),
        cat.to_dict("records"),
        anomalies.head(20).to_dict("records"),
        {"totalSpend": total_spend, "totalIncome": total_income, "net": net},
    )


def _validate_upload(file: UploadFile, content: bytes) -> None:
    filename = file.filename or ""
    ext = os.path.splitext(filename.lower())[-1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext or 'unknown'}'. Please upload a .csv or .xlsx file.",
        )
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(content) / 1_048_576:.1f} MB). Maximum allowed is "
                   f"{MAX_UPLOAD_BYTES / 1_048_576:.0f} MB.",
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")


@app.get("/")
def root():
    return RedirectResponse(url="/docs")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.1.0"}


@app.post("/api/upload", response_model=ProcessResponse)
def upload_file(
    file: UploadFile = File(...),
    months_window: int = Form(3),
    z_thresh: float = Form(3.0),
    currency: str = Form("USD"),
):
    content = file.file.read()
    _validate_upload(file, content)
    filename = file.filename or "upload"

    try:
        if filename.lower().endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        else:
            df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    if df.empty or len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="File contains no readable rows or columns.")

    df = normalize(df, source_name="upload")
    rows_dropped = df.attrs.get("rows_dropped", 0)

    if df.empty:
        raise HTTPException(
            status_code=422,
            detail="No valid transactions could be extracted. Check that the file has "
                   "recognizable date and amount columns (see README for accepted column names).",
        )

    accounts = ["All"] + sorted(df["account"].dropna().unique().tolist())
    months = ["All"] + sorted(
        pd.to_datetime(df["date"]).dt.to_period("M").astype(str).unique().tolist()
    )

    dff, ma, cat, anomalies, kpis = _run_analysis(df, "All", "All", months_window, z_thresh, currency)
    dff["date"] = dff["date"].astype(str)

    status = f"Loaded {filename} — {len(dff)} transactions."
    if rows_dropped:
        status += f" ({rows_dropped} row(s) skipped: missing or unparseable date/amount.)"

    return ProcessResponse(
        transactions=dff.to_dict("records"),
        accounts=accounts,
        months=months,
        monthly=ma,
        categories=cat,
        anomalies=anomalies,
        kpis=kpis,
        status=status,
        rows_dropped=rows_dropped,
    )


@app.post("/api/analyze")
def analyze(req: FilterRequest):
    try:
        df = _df_from_records(req.transactions)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read transaction data: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="No transactions to analyze.")

    accounts = ["All"] + sorted(df["account"].dropna().unique().tolist())
    months = ["All"] + sorted(
        pd.to_datetime(df["date"]).dt.to_period("M").astype(str).unique().tolist()
    )

    dff, ma, cat, anomalies, kpis = _run_analysis(
        df,
        req.account_filter or "All",
        req.month_filter or "All",
        req.months_window,
        req.z_thresh,
        req.currency,
    )
    dff["date"] = dff["date"].astype(str)
    return {
        "transactions": dff.to_dict("records"),
        "accounts": accounts,
        "months": months,
        "monthly": ma,
        "categories": cat,
        "anomalies": anomalies,
        "kpis": kpis,
        "status": "Analysis updated.",
    }


@app.get("/api/sample")
def sample_data():
    sample_path = os.path.join(
        os.path.dirname(__file__), "..", "data", "sample_transactions.csv"
    )
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample data not found")

    try:
        df = pd.read_csv(sample_path, dtype=str, keep_default_na=False)
        df = normalize(df, source_name="Sample")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load sample data: {e}")

    accounts = ["All"] + sorted(df["account"].dropna().unique().tolist())
    months = ["All"] + sorted(
        pd.to_datetime(df["date"]).dt.to_period("M").astype(str).unique().tolist()
    )

    dff, ma, cat, anomalies, kpis = _run_analysis(df, "All", "All", 3, 3.0, "USD")
    dff["date"] = dff["date"].astype(str)
    return {
        "transactions": dff.to_dict("records"),
        "accounts": accounts,
        "months": months,
        "monthly": ma,
        "categories": cat,
        "anomalies": anomalies,
        "kpis": kpis,
        "status": f"Sample data loaded — {len(dff)} transactions.",
    }
