"""FastAPI backend for Tally Spend."""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from typing import List, Optional

import pandas as pd
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from backend.analysis import monthly_aggregate, category_breakdown, detect_anomalies
from backend.etl import normalize, detect_recurring
from backend.utils import currency_fmt

app = FastAPI(title="Tally Spend API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FilterRequest(BaseModel):
    transactions: List[dict]
    account_filter: Optional[str] = "All"
    month_filter: Optional[str] = "All"
    months_window: int = 3
    z_thresh: float = 3.0


class ProcessResponse(BaseModel):
    transactions: List[dict]
    accounts: List[str]
    months: List[str]
    monthly: List[dict]
    categories: List[dict]
    anomalies: List[dict]
    kpis: dict
    status: str


def _df_from_records(records: List[dict]) -> pd.DataFrame:
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df["is_recurring"] = df["is_recurring"].astype(bool)
    return df


def _run_analysis(df, account_filter, month_filter, months_window, z_thresh):
    dff = df.copy()
    if account_filter and account_filter != "All" and "account" in dff.columns:
        dff = dff[dff["account"] == account_filter]
    if month_filter and month_filter != "All" and "date" in dff.columns:
        dff = dff[dff["date"].apply(
            lambda x: pd.to_datetime(x).to_period("M").strftime("%Y-%m") == month_filter
        )]
    if dff.empty:
        return [], [], [], {"totalSpend": "N/A", "totalIncome": "N/A", "net": "N/A"}

    dff = detect_recurring(dff, months_window=months_window)
    anomalies = detect_anomalies(dff, z_thresh=z_thresh)
    ma = monthly_aggregate(dff)
    cat = category_breakdown(
        dff,
        month=month_filter if month_filter and month_filter != "All" else None,
    )

    total_spend = (
        currency_fmt(abs(dff[dff["amount"] < 0]["amount"].sum()))
        if "amount" in dff.columns else "N/A"
    )
    total_income = (
        currency_fmt(dff[dff["amount"] > 0]["amount"].sum())
        if "amount" in dff.columns else "N/A"
    )
    net = (
        currency_fmt(dff["amount"].sum())
        if "amount" in dff.columns else "N/A"
    )

    return (
        ma.to_dict("records"),
        cat.to_dict("records"),
        anomalies.head(20).to_dict("records"),
        {"totalSpend": total_spend, "totalIncome": total_income, "net": net},
    )


@app.get("/")
def root():
    return RedirectResponse(url="/docs")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


@app.post("/api/upload", response_model=ProcessResponse)
def upload_file(
    file: UploadFile = File(...),
    months_window: int = Form(3),
    z_thresh: float = Form(3.0),
):
    try:
        content = file.file.read()
        filename = file.filename or "upload"
        if filename.lower().endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        else:
            df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False)
        df = normalize(df, source_name="upload")
        df = detect_recurring(df)
    except Exception as e:
        return ProcessResponse(
            transactions=[], accounts=[], months=[], monthly=[],
            categories=[], anomalies=[], kpis={}, status=f"Error: {e}",
        )

    accounts = (
        ["All"] + sorted(df["account"].dropna().unique().tolist())
        if "account" in df.columns else ["All"]
    )
    months = (
        ["All"] + sorted(
            pd.to_datetime(df["date"]).dt.to_period("M").astype(str).unique().tolist()
        )
        if "date" in df.columns else ["All"]
    )

    ma, cat, anomalies, kpis = _run_analysis(df, "All", "All", months_window, z_thresh)
    df["date"] = df["date"].astype(str)
    return ProcessResponse(
        transactions=df.to_dict("records"),
        accounts=accounts,
        months=months,
        monthly=ma,
        categories=cat,
        anomalies=anomalies,
        kpis=kpis,
        status=f"Loaded {filename} — {len(df)} transactions.",
    )


@app.post("/api/analyze")
def analyze(req: FilterRequest):
    try:
        df = _df_from_records(req.transactions)
    except Exception as e:
        return {"error": str(e)}

    accounts = (
        ["All"] + sorted(df["account"].dropna().unique().tolist())
        if "account" in df.columns else ["All"]
    )
    months = (
        ["All"] + sorted(
            pd.to_datetime(df["date"]).dt.to_period("M").astype(str).unique().tolist()
        )
        if "date" in df.columns else ["All"]
    )

    ma, cat, anomalies, kpis = _run_analysis(
        df,
        req.account_filter or "All",
        req.month_filter or "All",
        req.months_window,
        req.z_thresh,
    )
    df["date"] = df["date"].astype(str)
    return {
        "transactions": df.to_dict("records"),
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
        return {"error": "Sample data not found"}
    try:
        df = pd.read_csv(sample_path, dtype=str, keep_default_na=False)
        df = normalize(df, source_name="Sample")
        df = detect_recurring(df)
    except Exception as e:
        return {"error": str(e)}

    accounts = ["All"] + sorted(df["account"].dropna().unique().tolist())
    months = ["All"] + sorted(
        pd.to_datetime(df["date"]).dt.to_period("M").astype(str).unique().tolist()
    )

    ma, cat, anomalies, kpis = _run_analysis(df, "All", "All", 3, 3.0)
    df["date"] = df["date"].astype(str)
    return {
        "transactions": df.to_dict("records"),
        "accounts": accounts,
        "months": months,
        "monthly": ma,
        "categories": cat,
        "anomalies": anomalies,
        "kpis": kpis,
        "status": f"Sample data loaded — {len(df)} transactions.",
    }
