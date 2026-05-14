# 💰 Tally Spend — Track. Analyze. Optimize.

A full-stack personal finance analytics dashboard built with **FastAPI** (Python) and **React + Tailwind CSS**. Upload your bank statements (CSV or Excel) to instantly visualize spending patterns, detect anomalies, identify recurring payments, and break down expenses by category.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **File Upload** | Drag & drop CSV or Excel bank statements |
| **Sample Data** | One-click load of realistic demo transactions |
| **Monthly Trends** | Bar + line chart comparing spend vs income over time |
| **Category Breakdown** | Interactive donut chart with 10+ smart categories |
| **Anomaly Detection** | Z-score based outlier detection per merchant |
| **Recurring Detection** | Automatically flags subscriptions & recurring bills |
| **Filters** | Filter by account and month in real-time |
| **KPI Cards** | Total spend, total income, and net balance at a glance |
| **Responsive UI** | Dark-themed, mobile-friendly design |

---

## 🏗️ Architecture
tally-spend/
├── api/
│   ├── init.py
│   └── main.py              ← FastAPI entry point
├── backend/
│   ├── init.py
│   ├── etl.py               ← Load, normalize, categorize transactions
│   ├── analysis.py          ← Aggregate, breakdown, anomaly detection
│   └── utils.py             ← Helpers & currency formatting
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← Global state & API orchestration
│   │   ├── components/
│   │   │   ├── Sidebar.jsx  ← Upload, filters, controls
│   │   │   ├── Dashboard.jsx← Layout composer
│   │   │   ├── KPICards.jsx ← Stat cards
│   │   │   ├── Charts.jsx   ← Recharts visualizations
│   │   │   └── DataTable.jsx← Sortable, paginated tables
│   │   ├── main.jsx
│   │   └── index.css        ← Tailwind directives
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── data/
│   └── sample_transactions.csv  ← 739 realistic demo rows
├── tests/
│   └── test_backend.py      ← 7 unit tests
├── requirements.txt
└── README.md

---

🛠️ Tech Stack
Backend: FastAPI, Pandas, Uvicorn
Frontend: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
Testing: pytest

📁 CSV Format
Your uploaded file should contain these columns (names are fuzzy-matched):
Table
Canonical	Accepted Variants
date	transaction_date, posted, posting_date, txn_date
amount amt, debit, credit, transaction_amount, value
description	details, narration, memo, payee
account	account_name, source, wallet, bank, card


## 🚀 Quick Start (Local)

### Prerequisites

- Python 3.11+
- Node.js 20+

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/tally-spend.git
cd tally-spend

### 2. Backend

# Create virtual environment
python -m venv venv

# Activate (PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run dev server
uvicorn api.main:app --reload --port 8000

### 3. Frondend

cd frontend
npm install
npm run dev

4. Testing
# Backend tests
pytest tests/ -v
