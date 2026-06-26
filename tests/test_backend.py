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

    def test_normalize_separate_debit_credit_columns(self):
        """Regression test: real bank exports often use separate Debit/Credit
        columns instead of one signed Amount column. Previously, normalize()
        only ever read the Debit column (since 'debit' matched before 'credit'
        in the candidate list) and silently dropped every Credit/income row."""
        df = pd.DataFrame({
            "Date":        ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
            "Description": ["Grocery Store", "Salary Payment", "Electric Bill", "Client Invoice"],
            "Debit":       ["45.20", "", "120.00", ""],
            "Credit":      ["", "5000.00", "", "2300.00"],
        })
        out = normalize(df, source_name="test")
        assert len(out) == 4, "all 4 transactions should survive, not just the 2 debits"
        assert pytest.approx(out["amount"].sum()) == (5000.00 + 2300.00 - 45.20 - 120.00)
        assert (out["amount"] == 5000.00).any(), "salary credit must be present as +5000.00"
        assert (out["amount"] == 2300.00).any(), "invoice credit must be present as +2300.00"
        assert (out["amount"] == -45.20).any(), "grocery debit must be present as -45.20"

    def test_normalize_debit_only_ledger(self):
        df = pd.DataFrame({
            "Date": ["2024-01-01", "2024-01-02"],
            "Debit": ["10.00", "20.00"],
            "Description": ["A", "B"],
        })
        out = normalize(df)
        assert (out["amount"] < 0).all(), "debit-only ledger should treat every value as an outflow"

    def test_normalize_handles_currency_symbols_and_parentheses(self):
        """Accounting exports often format negatives as (123.45) and may
        include currency symbols / thousands separators."""
        df = pd.DataFrame({
            "Date":   ["2024-01-01", "2024-01-02", "2024-01-03"],
            "Amount": ["$1,200.50", "(45.00)", "£99.99"],
            "Description": ["Pay", "Refund reversal", "Purchase"],
        })
        out = normalize(df)
        assert len(out) == 3
        assert pytest.approx(out.iloc[0]["amount"]) == 1200.50
        assert pytest.approx(out.iloc[1]["amount"]) == -45.00
        assert pytest.approx(out.iloc[2]["amount"]) == 99.99

    def test_normalize_reports_dropped_row_count(self):
        df = pd.DataFrame({
            "Date":   ["2024-01-01", "not-a-date", "2024-01-03"],
            "Amount": ["10.00", "20.00", "not-a-number"],
        })
        out = normalize(df)
        assert len(out) == 1
        assert out.attrs.get("rows_dropped") == 2


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
