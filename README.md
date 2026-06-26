# 💰 Tally Spend — Track. Analyze. Optimize.

A full-stack personal finance analytics dashboard built with **FastAPI** (Python) and **React + Tailwind CSS**. Upload your bank statements (CSV or Excel) to instantly visualize spending patterns, detect anomalies, identify recurring payments, and break down expenses by category.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **File Upload** | Drag & drop CSV or Excel bank statements (max 10 MB) |
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

```text
tally-spend/
├── api/
│   ├── __init__.py
│   └── main.py                  ← FastAPI entry point
├── backend/
│   ├── __init__.py
│   ├── etl.py                   ← Load, normalize, categorize transactions
│   ├── analysis.py              ← Aggregate, breakdown, anomaly detection
│   └── utils.py                 ← Helpers & currency formatting
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Global state & API orchestration
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      ← Upload, filters, controls
│   │   │   ├── Dashboard.jsx    ← Layout composer
│   │   │   ├── KPICards.jsx     ← Stat cards
│   │   │   ├── Charts.jsx       ← Recharts visualizations
│   │   │   └── DataTable.jsx    ← Sortable, paginated tables
│   │   ├── main.jsx
│   │   └── index.css            ← Tailwind directives + design tokens
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── data/
│   └── sample_transactions.csv  ← 60 realistic demo rows
├── tests/
│   ├── test_backend.py          ← ETL/analysis unit tests
│   └── test_api.py              ← FastAPI endpoint integration tests
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

## 🛠️ Tech Stack

- **Backend:** FastAPI, Pandas, Uvicorn
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Testing:** pytest, FastAPI TestClient

## 📁 CSV Format

Your uploaded file should contain these columns (names are fuzzy-matched, case-insensitive):

| Canonical | Accepted Variants |
|---|---|
| `date` | `transaction_date`, `posted`, `posting_date`, `txn_date` |
| `amount` | `amt`, `transaction_amount`, `value`, `sum` — **or** separate `Debit` + `Credit` columns |
| `description` | `details`, `narration`, `memo`, `narrative`, `payee` |
| `account` | `account_name`, `source`, `wallet`, `bank`, `card` |

> Statements that use separate **Debit**/**Credit** columns (the most common format from banks like Chase, Bank of America, HSBC, and Barclays) are fully supported — debit values are read as outflows, credit values as inflows, and both are merged into a single signed `amount`.

Currency symbols (`$`, `£`, `€`), thousands separators, and accounting-style negative parentheses (e.g. `(123.45)`) are all parsed correctly. Rows with an unparseable date or amount are skipped, and the upload response reports exactly how many rows (if any) were skipped.

---

## 🚀 Quick Start (Local)

### Prerequisites

- Python 3.11+
- Node.js 20+

### 1. Clone & Setup

```bash
git clone https://github.com/ahmedabbas52233-a11y/Tally-Spend.git
cd Tally-Spend
```

### 2. Backend

```bash
# Create virtual environment
python -m venv venv

# Activate — macOS / Linux
source venv/bin/activate

# Activate — Windows PowerShell
.\venv\Scripts\Activate.ps1

# Install dependencies (add -dev for test tooling too)
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run dev server
uvicorn api.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at `/docs`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — the Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

### 4. Testing

```bash
# All backend + API tests
pytest tests/ -v

# Frontend production build check
cd frontend && npm run build
```

---

## ⚙️ Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `FRONTEND_URL` | backend | `http://localhost:5173` | Allowed CORS origin for the API |
| `VITE_API_URL` | frontend | unset (relative `/api`) | Override the API base URL, e.g. for a split deployment |

---

## 📦 Deployment

This repo includes a `vercel.json` that builds the frontend to `dist/` and routes `/api/*` to the FastAPI app via Vercel's Python runtime. Two things worth knowing before deploying real bank data this way:

- Vercel's Hobby tier caps serverless function execution at 10s and request bodies at ~4.5 MB — large multi-year statements may need a longer-running host (Railway, Render, Fly.io) instead.
- Set `FRONTEND_URL` in your Vercel project's environment variables to your deployed frontend origin so CORS reflects the real domain rather than `localhost`.

---

## License

MIT — see [LICENSE](./LICENSE).
