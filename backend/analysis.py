"""Analytics engine for personal finance data."""
from __future__ import annotations

import pandas as pd


def monthly_aggregate(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["month"] = pd.to_datetime(df["date"]).dt.to_period("M")
    agg = (
        df.groupby("month")
        .agg(
            total_spend=("amount", lambda x: x[x < 0].sum()),
            total_income=("amount", lambda x: x[x > 0].sum()),
            transactions=("amount", "count"),
        )
        .reset_index()
    )
    agg["month"] = agg["month"].astype(str)
    agg["total_spend"] = agg["total_spend"].fillna(0).abs()
    agg["total_income"] = agg["total_income"].fillna(0)
    return agg.sort_values("month")


def category_breakdown(df: pd.DataFrame, month: str | None = None) -> pd.DataFrame:
    df = df.copy()
    if month and month != "All":
        df = df[pd.to_datetime(df["date"]).dt.to_period("M").astype(str) == month]
    cat = (
        df.groupby("category")
        .agg(spend=("amount", lambda x: x[x < 0].sum()), count=("amount", "count"))
        .reset_index()
    )
    cat["spend"] = cat["spend"].fillna(0).abs()
    return cat[cat["spend"] > 0].sort_values("spend", ascending=False).reset_index(drop=True)


def detect_anomalies(df: pd.DataFrame, z_thresh: float = 3.0) -> pd.DataFrame:
    df = df.copy()
    df["abs_amount"] = df["amount"].abs()
    stats = df.groupby("merchant")["abs_amount"].agg(["mean", "std"]).reset_index()
    merged = df.merge(stats, on="merchant", how="left")
    merged["std"] = merged["std"].replace(0, 1).fillna(1)
    merged["z"] = (merged["abs_amount"] - merged["mean"]) / merged["std"]
    anomalies = merged[merged["z"].abs() >= z_thresh].sort_values("z", ascending=False)
    return anomalies[["date", "merchant", "description", "amount", "z"]].reset_index(drop=True)
