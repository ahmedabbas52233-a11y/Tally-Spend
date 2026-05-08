import React from "react";
import { KPICards } from "./KPICards";
import { MonthlyChart, CategoryChart, TopMerchantsChart, RecurringList } from "./Charts";
import { DataTable } from "./DataTable";
import { Loader2, TrendingUp } from "lucide-react";

export function Dashboard({ data, loading, topMerchants, recurringSummary, healthScore }) {
  if (loading && !data) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--cyan)" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}
          >
            <TrendingUp className="w-8 h-8" style={{ color: "var(--cyan)" }} />
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}
          >
            Ready to analyze
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Upload a CSV or Excel bank statement, or load the sample data to explore your spending patterns.
          </p>
        </div>
      </div>
    );
  }

  const txColumns = [
    { key: "date", label: "Date" },
    { key: "merchant", label: "Merchant" },
    { key: "category", label: "Category" },
    {
      key: "amount",
      label: "Amount",
      format: (v) =>
        typeof v === "number"
          ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : v,
    },
    { key: "account", label: "Account" },
    { key: "is_recurring", label: "Recurring", format: (v) => (v ? "Yes" : "No") },
  ];

  const anomalyColumns = [
    { key: "date", label: "Date" },
    { key: "merchant", label: "Merchant" },
    { key: "description", label: "Description" },
    {
      key: "amount",
      label: "Amount",
      format: (v) =>
        typeof v === "number"
          ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : v,
    },
    {
      key: "z",
      label: "Z-Score",
      format: (v) => (typeof v === "number" ? v.toFixed(2) : v),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}
          >
            Overview
          </h2>
          {data.status && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {data.status}
            </p>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--cyan)" }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Updating…
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <KPICards kpis={data.kpis} healthScore={healthScore} />

      {/* Row 2: Monthly + Category */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MonthlyChart data={data.monthly} />
        </div>
        <CategoryChart data={data.categories} />
      </div>

      {/* Row 3: Top Merchants + Recurring */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopMerchantsChart data={topMerchants} />
        <RecurringList data={recurringSummary} />
      </div>

      {/* Anomalies */}
      {data.anomalies?.length > 0 && (
        <DataTable
          title="Anomalies Detected"
          data={data.anomalies}
          columns={anomalyColumns}
          pageSize={8}
          exportable
          exportFilename="anomalies.csv"
        />
      )}

      {/* Transactions */}
      <DataTable
        title="All Transactions"
        data={data.transactions}
        columns={txColumns}
        pageSize={20}
        searchable
        exportable
        exportFilename="transactions.csv"
      />
    </div>
  );
}
