import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    account_filter: "All",
    month_filter: "All",
    months_window: 3,
    z_thresh: 3,
  });

  useEffect(() => {
    loadSample();
  }, []);

  const loadSample = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet("/sample");
      setData(res);
      setFilters((f) => ({ ...f, account_filter: "All", month_filter: "All" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("months_window", filters.months_window);
      form.append("z_thresh", filters.z_thresh);
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setFilters((f) => ({ ...f, account_filter: "All", month_filter: "All" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback(
    async (newFilters) => {
      if (!data?.transactions) return;
      setLoading(true);
      setError("");
      try {
        const payload = { transactions: data.transactions, ...newFilters };
        const res = await apiPost("/analyze", payload);
        setData((prev) => ({ ...prev, ...res }));
        setFilters(newFilters);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [data]
  );

  // Derived: top merchants by spend
  const topMerchants = useMemo(() => {
    if (!data?.transactions) return [];
    const map = {};
    data.transactions.forEach((t) => {
      if (t.amount < 0) {
        map[t.merchant] = (map[t.merchant] || 0) + Math.abs(t.amount);
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, amount]) => ({ name, amount: parseFloat(amount.toFixed(2)) }));
  }, [data?.transactions]);

  // Derived: recurring summary
  const recurringSummary = useMemo(() => {
    if (!data?.transactions) return [];
    const map = {};
    data.transactions
      .filter((t) => t.is_recurring && t.amount < 0)
      .forEach((t) => {
        if (!map[t.merchant]) {
          map[t.merchant] = {
            merchant: t.merchant,
            total: 0,
            count: 0,
            category: t.category,
          };
        }
        map[t.merchant].total += Math.abs(t.amount);
        map[t.merchant].count++;
      });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
      .map((r) => ({ ...r, avgPerMonth: parseFloat((r.total / r.count).toFixed(2)) }));
  }, [data?.transactions]);

  // Derived: financial health score (0-100)
  const healthScore = useMemo(() => {
    if (!data?.kpis) return null;
    const income = parseFloat((data.kpis.totalIncome || "").replace(/[^0-9.]/g, "")) || 0;
    const spend = parseFloat((data.kpis.totalSpend || "").replace(/[^0-9.]/g, "")) || 0;
    if (income === 0) return null;
    return Math.max(0, Math.min(100, Math.round((1 - spend / income) * 100)));
  }, [data?.kpis]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar
        filters={filters}
        onFilterChange={handleFilterChange}
        onUpload={handleUpload}
        onLoadSample={loadSample}
        accounts={data?.accounts || ["All"]}
        months={data?.months || ["All"]}
        status={data?.status || ""}
        loading={loading}
      />
      <main className="flex-1 overflow-auto">
        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}
        <Dashboard
          data={data}
          loading={loading}
          topMerchants={topMerchants}
          recurringSummary={recurringSummary}
          healthScore={healthScore}
        />
      </main>
    </div>
  );
}
