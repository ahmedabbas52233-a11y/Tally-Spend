# 💰 Tally Spend — Track. Analyze. Optimize.

A full-stack personal finance analytics dashboard. Upload a bank statement (CSV or Excel) and instantly get spending trends, category breakdowns, recurring-payment detection, and statistical anomaly flags — no signup, no stored data, everything runs in-memory per request.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-22%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start-local)
- [Configuration](#️-configuration)
- [CSV / Excel Format](#-csv--excel-format)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Known Limitations](#️-known-limitations)
- [Contributing](#-contributing)
- [License](#license)

---

## ✨ Features

| Feature | Description |
|---|---|
| **File Upload** | Drag & drop CSV or Excel bank statements, up to 10 MB |
| **Sample Data** | One-click load of 60 realistic demo transactions — no file needed |
| **Smart Column Detection** | Fuzzy-matches column names; handles single signed `amount` columns **or** separate `Debit`/`Credit` columns automatically |
| **Auto-Categorization** | Keyword-rule engine sorts transactions into 10 categories (Groceries, Transport, Utilities, Entertainment, Salary, Dining, Shopping, Health, Education, Travel) |
| **Monthly Trends** | Income vs. spend over time, charted month by month |
| **Category Breakdown** | Interactive donut chart of where money goes |
| **Anomaly Detection** | Per-merchant z-score outlier detection with an adjustable sensitivity threshold |
| **Recurring Detection** | Flags subscriptions/bills that repeat across an adjustable month window |
| **Live Filters** | Filter every chart, KPI, and table by account and month — consistently, everywhere |
| **KPI Cards** | Total spend, total income, and net balance at a glance |
| **Responsive UI** | Dark-themed, works on phone, tablet, and desktop |
| **CSV Export** | Export any table view back out as CSV |

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — async Python web framework
- [Pandas](https://pandas.pydata.org/) — all ETL, aggregation, and statistics
- [Uvicorn](https://www.uvicorn.org/) — ASGI server
- [Pydantic](https://docs.pydantic.dev/) — request/response validation

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [Recharts](https://recharts.org/) — charts
- [Lucide React](https://lucide.dev/) — icons

**Testing & CI**
- [pytest](https://docs.pytest.org/) + [FastAPI TestClient](https://fastapi.tiangolo.com/tutorial/testing/) — 22 tests across ETL, analysis, and the live API
- GitHub Actions — runs the full suite + a frontend production build on every push/PR

---

## 🏗️ Architecture

```text
tally-spend/
├── api/
│   ├── __init__.py
│   └── main.py                  # FastAPI app: routes, validation, CORS, error handling
├── backend/
│   ├── __init__.py
│   ├── etl.py                   # Column detection, normalization, merchant/category extraction,
│   │                             #   recurring-payment detection
│   ├── analysis.py               # Monthly aggregation, category breakdown, z-score anomalies
│   └── utils.py                  # Currency formatting helpers
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Top-level state, fetches, filter orchestration
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       # Upload zone, account/month filters, sensitivity sliders
│   │   │   ├── Dashboard.jsx     # Composes KPIs + charts + tables into the main layout
│   │   │   ├── KPICards.jsx      # Total spend / income / net / health-score cards
│   │   │   ├── Charts.jsx        # Monthly trend + category donut (Recharts)
│   │   │   └── DataTable.jsx     # Generic sortable/paginated/searchable/exportable table
│   │   ├── main.jsx
│   │   └── index.css             # Design tokens + Tailwind layers
│   ├── index.html
│   ├── vite.config.js            # Dev proxy: /api -> localhost:8000
│   ├── tailwind.config.js
│   └── package.json
├── data/
│   └── sample_transactions.csv   # 60-row demo dataset
├── tests/
│   ├── test_backend.py           # 11 tests — ETL & analysis pure functions
│   └── test_api.py               # 11 tests — live HTTP endpoints via TestClient
├── .github/workflows/ci.yml      # pytest + frontend build, on every push/PR
├── vercel.json                   # Vercel build + API rewrite config
├── requirements.txt               # Production Python deps
├── requirements-dev.txt           # + pytest/httpx for local dev & CI
└── LICENSE                        # MIT
```

**Request flow:** the frontend never touches a database — every filter change re-POSTs the in-memory transaction list (plus the new filter/window/threshold values) to `/api/analyze`, which re-runs the pandas pipeline and returns fresh, filtered aggregates. There is no persistence layer by design: nothing you upload is ever written to disk on the server.

---

## 🚀 Quick Start (Local)

### Prerequisites

- Python 3.11+
- Node.js 20+

### 1. Clone

```bash
git clone https://github.com/ahmedabbas52233-a11y/Tally-Spend.git
cd Tally-Spend
```

### 2. Backend

```bash
python -m venv venv

# macOS / Linux
source venv/bin/activate
# Windows PowerShell
.\venv\Scripts\Activate.ps1

pip install -r requirements-dev.txt   # includes pytest/httpx for local testing
uvicorn api.main:app --reload --port 8000
```

API is now live at `http://localhost:8000` — interactive docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to `localhost:8000` automatically — no extra config needed.

### 4. Try it

Click **Load Sample Data** in the sidebar for an instant demo, or drag in your own CSV/Excel statement.

---

## ⚙️ Configuration

No `.env` file is required to run locally — every variable below has a sensible default.

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `FRONTEND_URL` | backend | `http://localhost:5173` | The only origin allowed through CORS. Set this to your deployed frontend's URL in production. |
| `VITE_API_URL` | frontend | unset → relative `/api` | Override if the frontend and backend are deployed to different domains. |

---

## 📁 CSV / Excel Format

Column names are matched case-insensitively against a list of common aliases — your file doesn't need exact headers.

| Canonical field | Accepted variants |
|---|---|
| `date` | `transaction_date`, `posted`, `posting_date`, `txn_date` |
| `amount` | `amt`, `transaction_amount`, `value`, `sum` — **or** separate `Debit` + `Credit` columns |
| `description` | `details`, `narration`, `memo`, `narrative`, `payee` |
| `account` | `account_name`, `source`, `wallet`, `bank`, `card` |

**Amount parsing handles:**
- A single signed column (`-45.20`, `120.00`)
- Separate `Debit`/`Credit` columns — the most common real-world bank export format (Chase, Bank of America, HSBC, Barclays, etc.). Debits become negative, credits stay positive, and they're merged into one signed `amount`.
- Currency symbols: `$45.20`, `£99.99`, `€12.50`
- Thousands separators: `$1,200.50`
- Accounting-style negative parentheses: `(123.45)` → `-123.45`

Rows with an unparseable date or amount are skipped — the upload response tells you exactly how many rows (if any) were dropped and why, so nothing silently disappears.

**Minimal example (single amount column):**
```csv
date,amount,description,account
2024-01-01,-19.74,Purchase at Uber,Checking
2024-01-01,5000.00,Salary Credit,Checking
```

**Also supported (separate Debit/Credit columns):**
```csv
Date,Description,Debit,Credit
2024-01-01,Grocery Store,45.20,
2024-01-02,Salary Payment,,5000.00
```

---

## 📡 API Reference

Base URL: `http://localhost:8000` (or your deployed domain). Interactive Swagger docs at `/docs`.

### `GET /api/health`
Health check.
```json
{ "status": "ok", "version": "2.1.0" }
```

### `GET /api/sample`
Loads the bundled demo dataset and returns the full analysis (see shared response shape below).

### `POST /api/upload`
Upload and analyze a statement.

**Request:** `multipart/form-data`

| Field | Type | Default | Description |
|---|---|---|---|
| `file` | file | — | `.csv` or `.xlsx`, max 10 MB |
| `months_window` | int | `3` | Minimum number of distinct months a merchant+amount pair must repeat to be flagged recurring |
| `z_thresh` | float | `3.0` | Standard deviations from a merchant's mean spend to flag as an anomaly |
| `currency` | string | `"USD"` | Currency code used to format KPI values |

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@statement.csv" \
  -F "months_window=3" \
  -F "z_thresh=3.0"
```

### `POST /api/analyze`
Re-run analysis against an already-normalized transaction list with new filters — this is what the frontend calls every time you change the account/month filter or drag a slider, instead of re-uploading the file.

**Request body:**
```json
{
  "transactions": [ /* array of transaction objects, as returned by /upload or /sample */ ],
  "account_filter": "All",
  "month_filter": "All",
  "months_window": 3,
  "z_thresh": 3.0,
  "currency": "USD"
}
```

### Shared response shape (`/upload`, `/analyze`, `/sample`)

```json
{
  "transactions": [
    {
      "date": "2024-01-01",
      "amount": -19.74,
      "description": "Purchase at Uber",
      "merchant": "Uber",
      "category": "Transport",
      "account": "Checking",
      "is_recurring": false,
      "tags": ""
    }
  ],
  "accounts": ["All", "Checking", "Credit Card"],
  "months": ["All", "2024-01", "2024-02"],
  "monthly": [ { "month": "2024-01", "income": 5000.0, "spend": 1234.56 } ],
  "categories": [ { "category": "Transport", "total": 245.30 } ],
  "anomalies": [ { "date": "...", "merchant": "...", "amount": -500.0, "z_score": 4.2 } ],
  "kpis": { "totalSpend": "USD 1,234.56", "totalIncome": "USD 5,000.00", "net": "USD 3,765.44" },
  "status": "Loaded statement.csv — 42 transactions.",
  "rows_dropped": 0
}
```

`transactions`, `monthly`, `categories`, and `anomalies` all reflect the **currently active** account/month filter — they stay consistent with each other and with the KPI cards.

### Error responses

Errors return proper HTTP status codes with a `detail` message — never a `200 OK` with an error string buried in the body:

| Status | Meaning |
|---|---|
| `400` | Unsupported file type, empty file, or malformed transaction data |
| `413` | File exceeds the 10 MB limit |
| `422` | File parsed but contained no extractable transactions |

```json
{ "detail": "Unsupported file type '.pdf'. Please upload a .csv or .xlsx file." }
```

---

## 🧪 Testing

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

**22 tests, two files:**
- `tests/test_backend.py` (11) — pure pandas logic: column detection, Debit/Credit merging, currency-symbol/parenthesis parsing, dropped-row counting, recurring detection, monthly aggregation, category breakdown, anomaly z-scores.
- `tests/test_api.py` (11) — live HTTP behavior via FastAPI's `TestClient`: upload validation (file type/size/emptiness), the Debit/Credit data-integrity path end-to-end, recurring-window filter persistence, account/month filter consistency across endpoints, and CORS configuration.

Frontend build check (no unit tests yet — see [Known Limitations](#-known-limitations)):
```bash
cd frontend && npm run build
```

CI runs both on every push and pull request — see `.github/workflows/ci.yml`.

---

## 📦 Deployment

`vercel.json` is preconfigured to build the frontend and serve the FastAPI backend as a Python serverless function under `/api/*`.

```bash
npm install -g vercel
vercel
```

Then set `FRONTEND_URL` in your Vercel project's environment variables to your deployed frontend origin (so CORS reflects the real domain, not `localhost`).

**Before relying on this for real statements**, know that:
- Vercel's Hobby tier caps function execution at 10s and request bodies around ~4.5 MB. Large multi-year statements may need a longer-running host (Railway, Render, Fly.io) instead.
- There is no database — every deploy target needs nothing more than the Python + Node runtimes; there's no migration step.

---

## ⚠️ Known Limitations

Being upfront about what this project doesn't (yet) do:

- **No persistence.** Nothing uploaded is saved anywhere — refresh the page and you start over. This is intentional (no data-retention concerns) but means there's no transaction history across sessions.
- **No authentication.** There's no concept of a user account; anyone with access to the deployed URL can use the analyzer.
- **Recurring detection requires an exact amount match.** A subscription that changes price month to month (tax changes, usage-based billing) won't be grouped as recurring — only fixed-amount repeats are detected.
- **Merchant extraction is heuristic.** It pulls the most distinctive token out of the description string; for unusually formatted bank descriptions, the extracted "merchant" name may be rough.
- **No frontend test suite.** CI verifies the production build compiles, but there's no Vitest/Testing Library coverage of the React components yet.
- **Single currency per analysis run.** You can choose USD/etc. via the `currency` parameter, but a statement isn't split by multiple currencies within one upload.

---

## 🤝 Contributing

Issues and PRs welcome. Before opening a PR:

```bash
pytest tests/ -v                  # backend must stay green
cd frontend && npm run build      # frontend must build clean
```

If you're fixing a bug, a regression test that fails before your fix and passes after it is the fastest way to get a PR reviewed.

---

## License

MIT — see [LICENSE](./LICENSE).
