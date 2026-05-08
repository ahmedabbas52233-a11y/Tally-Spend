"""ETL pipeline: load, normalize, enrich transactions."""
from __future__ import annotations

import re
from typing import Dict, Iterable

import pandas as pd

DEFAULT_COLUMNS = {
    "date": ["date", "transaction_date", "posted", "posting_date", "txn_date"],
    "amount": ["amount", "amt", "debit", "credit", "transaction_amount", "value", "sum"],
    "description": ["description", "details", "narration", "memo", "narrative", "payee"],
    "account": ["account", "account_name", "source", "wallet", "bank", "card"],
}

CATEGORY_RULES = {
    "Groceries": [
        "supermarket", "grocery", "mart", "store", "hyper", "wal-mart", "walmart",
        "costco", "target", "whole foods", "aldi", "lidl",
    ],
    "Transport": [
        "uber", "lyft", "taxi", "metro", "bus", "rail", "petrol", "fuel",
        "gas station", "shell", "bp ", "exxon", "car wash", "parking", "toll",
    ],
    "Utilities": [
        "electric", "water", "gas bill", "utility", "k-electric", "ptcl",
        "internet", "broadband", "phone bill", "mobile",
    ],
    "Entertainment": [
        "netflix", "spotify", "cinema", "movie", "stadium", "theatre", "theater",
        "hbo", "disney", "prime video", "youtube", "gaming",
    ],
    "Salary": [
        "salary", "payroll", "payroll credit", "salary credit", "wage",
        "income deposit", "direct deposit",
    ],
    "Dining": [
        "restaurant", "cafe", "dining", "bistro", "kfc", "mcdonald", "burger",
        "pizza", "starbucks", "coffee", "eat", "grill", "kitchen", "food",
    ],
    "Shopping": [
        "amazon", "ebay", "shopify", "etsy", "fashion", "clothing",
        "apparel", "shoes", "mall", "retail",
    ],
    "Health": [
        "pharmacy", "hospital", "clinic", "medical", "dental",
        "health", "fitness", "gym", "wellness",
    ],
    "Education": [
        "tuition", "course", "university", "college", "school",
        "book", "library", "learning", "udemy",
    ],
    "Travel": [
        "airline", "flight", "hotel", "booking.com", "airbnb",
        "expedia", "travel", "vacation", "trip",
    ],
}

COMMON_WORDS = {
    "online", "payment", "transfer", "to", "from", "debit", "credit", "pos", "atm",
    "purchase", "transaction", "ref", "number", "id", "date", "thank", "you",
    "processed", "completed", "pending", "authorized", "recurring",
}


def _find_column(cols: Iterable[str], candidates: Dict[str, Iterable[str]]) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    lower = {c.lower().strip(): c for c in cols}
    for canon, names in candidates.items():
        for n in names:
            if n.lower().strip() in lower:
                mapping[canon] = lower[n.lower().strip()]
                break
    return mapping


def load_csv(path) -> pd.DataFrame:
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def extract_merchant(description: str) -> str:
    if not isinstance(description, str) or not description.strip():
        return "Unknown"
    s = re.sub(r"[^a-z\s]", " ", description.lower())
    tokens = [t for t in s.split() if len(t) > 2]
    for t in tokens:
        if t not in COMMON_WORDS:
            return t.title()
    return description.strip()[:30].title()


def assign_category(merchant: str, description: str = "") -> str:
    text = f"{merchant} {description}".lower()
    for cat, keywords in CATEGORY_RULES.items():
        for kw in keywords:
            if kw in text:
                return cat
    return "Other"


def normalize(df: pd.DataFrame, source_name: str = "import") -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    mapping = _find_column(df.columns, DEFAULT_COLUMNS)

    # Date
    date_col = mapping.get("date") or next(
        (c for c in df.columns if "date" in c.lower()), None
    )
    if date_col and date_col in df.columns:
        df["date"] = pd.to_datetime(df[date_col], errors="coerce").dt.date
    else:
        df["date"] = pd.NaT

    # Amount
    amt_col = mapping.get("amount")
    if not amt_col or amt_col not in df.columns:
        for c in df.columns:
            try:
                converted = pd.to_numeric(
                    df[c].replace("", "0"), errors="coerce"
                )
                if converted.notna().sum() > len(df) * 0.5:
                    amt_col = c
                    break
            except Exception:
                continue
    if amt_col and amt_col in df.columns:
        df["amount"] = pd.to_numeric(
            df[amt_col].astype(str).str.replace(",", ""), errors="coerce"
        )
    else:
        df["amount"] = pd.NA

    # Description
    desc_col = mapping.get("description") or next(
        (c for c in df.columns if any(k in c.lower() for k in ("desc", "memo", "narr"))),
        None,
    )
    df["description"] = df[desc_col].astype(str).str.strip() if desc_col and desc_col in df.columns else ""

    # Account
    acc_col = mapping.get("account")
    df["account"] = df[acc_col].astype(str).str.strip() if acc_col and acc_col in df.columns else source_name

    # Derived fields
    df["merchant"] = df["description"].apply(extract_merchant)
    df["category"] = df.apply(
        lambda r: assign_category(r["merchant"], r["description"]), axis=1
    )
    df["is_recurring"] = False
    df["tags"] = ""

    df = df.dropna(subset=["date", "amount"])
    cols = ["date", "amount", "description", "merchant", "category", "account", "is_recurring", "tags"]
    return df[cols].reset_index(drop=True)


def detect_recurring(df: pd.DataFrame, months_window: int = 3) -> pd.DataFrame:
    df = df.copy()
    df["month"] = pd.to_datetime(df["date"]).dt.to_period("M")
    grouped = df.groupby(["merchant", "amount"]).agg(
        months=("month", lambda x: sorted(set(x.astype(str))))
    )
    recurring = {
        (merchant, amount)
        for (merchant, amount), row in grouped.iterrows()
        if len(row["months"]) >= months_window
    }
    df["is_recurring"] = df.apply(
        lambda r: (r["merchant"], r["amount"]) in recurring, axis=1
    )
    return df.drop(columns=["month"])
