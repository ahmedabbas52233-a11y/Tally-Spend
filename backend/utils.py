"""Utility helpers for the finance dashboard."""
from __future__ import annotations

import pandas as pd


def currency_fmt(amount: float, currency: str = "PKR") -> str:
    try:
        return f"{currency} {amount:,.2f}"
    except Exception:
        return f"{currency} {amount}"


def load_and_prepare(path, source_name: str = "import") -> pd.DataFrame:
    import os
    from backend.etl import load_csv, normalize, detect_recurring

    ext = os.path.splitext(str(path))[-1].lower()
    if ext == ".xlsx":
        df = pd.read_excel(path, engine="openpyxl")
    else:
        df = load_csv(path)
    df = normalize(df, source_name=source_name)
    df = detect_recurring(df)
    return df
