"""Backend unit tests."""
import pandas as pd
import pytest

from backend.etl import normalize, extract_merchant, assign_category, detect_recurring
from backend.analysis import monthly_aggregate, category_breakdown, detect_anomalies


class TestETL:
    def test_extract_merchant(self):
        assert extract_merchant("Payment to Starbucks") == "Starbucks"
        assert extract_merchant("") == "Unknown"
        assert extract_merchant(None) == "Unknown"

    def test_assign_category(self):
        assert assign_category("Starbucks", "Coffee purchase") == "Dining"
        assert assign_category("Shell Petrol", "Fuel") == "Transport"
        assert assign_category("Unknown", "Random") == "Other"

    def test_normalize(self):
        df = pd.DataFrame({
            "Date": ["2024-01-01", "2024-01-02"],
            "Amount": ["100", "-50"],
            "Description": ["Salary", "Coffee"],
        })
        out = normalize(df, source_name="Test")
        assert list(out.columns) == [
            "date", "amount", "description", "merchant",
            "category", "account", "is_recurring", "tags",
        ]
        assert len(out) == 2
        assert out.iloc[0]["category"] == "Salary"
        assert out.iloc[1]["category"] == "Dining"

    def test_detect_recurring(self):
        df = pd.DataFrame({
            "date": pd.to_datetime(["2024-01-01", "2024-02-01", "2024-03-01", "2024-01-15"]),
            "amount": [-10, -10, -10, -20],
            "description": ["Netflix", "Netflix", "Netflix", "Coffee"],
            "merchant": ["Netflix", "Netflix", "Netflix", "Starbucks"],
            "category": ["Entertainment"] * 3 + ["Dining"],
            "account": ["CC"] * 4,
            "is_recurring": [False] * 4,
            "tags": [""] * 4,
        })
        out = detect_recurring(df, months_window=3)
        assert out["is_recurring"].tolist() == [True, True, True, False]


class TestAnalysis:
    def test_monthly_aggregate(self):
        df = pd.DataFrame({
            "date": pd.to_datetime(["2024-01-01", "2024-01-02", "2024-02-01"]),
            "amount": [-100, 500, -200],
        })
        out = monthly_aggregate(df)
        assert len(out) == 2
        assert out.iloc[0]["total_spend"] == 100
        assert out.iloc[0]["total_income"] == 500

    def test_category_breakdown(self):
        df = pd.DataFrame({
            "date": pd.to_datetime(["2024-01-01", "2024-01-02", "2024-02-01"]),
            "amount": [-100, -50, -30],
            "category": ["Food", "Food", "Travel"],
        })
        out = category_breakdown(df)
        assert out.iloc[0]["category"] == "Food"
        assert out.iloc[0]["spend"] == 150

    def test_detect_anomalies(self):
        df = pd.DataFrame({
            "date": pd.to_datetime(["2024-01-01"] * 10),
            "amount": [-10, -12, -11, -13, -10, -11, -12, -10, -11, -500],
            "merchant": ["A"] * 10,
            "description": ["x"] * 10,
        })
        out = detect_anomalies(df, z_thresh=2.0)
        assert len(out) == 1
        assert out.iloc[0]["amount"] == -500
