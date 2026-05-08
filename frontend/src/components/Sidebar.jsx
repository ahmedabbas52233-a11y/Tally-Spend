import React, { useRef, useState } from "react";
import {
  Upload,
  Database,
  Filter,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  BarChart3,
  X,
  ChevronDown,
} from "lucide-react";

export function Sidebar({
  filters,
  onFilterChange,
  onUpload,
  onLoadSample,
  accounts,
  months,
  status,
  loading,
}) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleFile = (file) => {
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      onUpload(file);
    }
  };

  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    onFilterChange(next);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #0891b2, #06b6d4)",
              boxShadow: "0 4px 12px rgba(6,182,212,0.3)",
            }}
          >
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className="text-lg font-bold text-white leading-none"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Tally Spend
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Finance Analytics
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Upload */}
        <section>
          <p className="label flex items-center gap-1.5">
            <Upload className="w-3 h-3" />
            Data Source
          </p>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
            className="relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200"
            style={{
              borderColor: dragOver ? "var(--cyan)" : "rgba(255,255,255,0.1)",
              background: dragOver ? "rgba(6,182,212,0.06)" : "rgba(255,255,255,0.02)",
            }}
          >
            <div
              className="w-10 h-10 mx-auto rounded-xl mb-2.5 flex items-center justify-center"
              style={{ background: "rgba(6,182,212,0.1)" }}
            >
              <Upload className="w-5 h-5" style={{ color: "var(--cyan)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Drop CSV or Excel
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Click to browse files
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          <button
            onClick={onLoadSample}
            disabled={loading}
            className="btn btn-secondary w-full mt-3"
          >
            <Database className="w-4 h-4" />
            Load Sample Data
          </button>
        </section>

        {/* Status */}
        {status && (
          <div
            className="flex items-start gap-2.5 text-xs rounded-xl p-3"
            style={{
              background: status.includes("Error")
                ? "rgba(244,63,94,0.08)"
                : "rgba(16,185,129,0.08)",
              border: `1px solid ${status.includes("Error") ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.2)"}`,
            }}
          >
            {status.includes("Error") ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            )}
            <span style={{ color: "var(--text-secondary)" }} className="leading-relaxed break-all">
              {status}
            </span>
          </div>
        )}

        {/* Filters */}
        <section className="space-y-4">
          <p className="label flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Filters
          </p>

          <div>
            <label className="label">Account</label>
            <div className="relative">
              <select
                className="input pr-8"
                value={filters.account_filter}
                onChange={(e) => update("account_filter", e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <ChevronDown
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>

          <div>
            <label className="label">Month</label>
            <div className="relative">
              <select
                className="input pr-8"
                value={filters.month_filter}
                onChange={(e) => update("month_filter", e.target.value)}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>
        </section>

        {/* Analysis Settings */}
        <section className="space-y-5">
          <p className="label flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3" />
            Analysis Settings
          </p>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Recurring Window</label>
              <span
                className="text-xs font-semibold num"
                style={{ color: "var(--cyan)" }}
              >
                {filters.months_window} mo
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={filters.months_window}
              className="accent-cyan"
              onChange={(e) => update("months_window", parseInt(e.target.value))}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>2</span>
              <span>6</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Anomaly Z-Threshold</label>
              <span
                className="text-xs font-semibold num"
                style={{ color: "var(--amber)" }}
              >
                {filters.z_thresh}σ
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={5}
              step={0.5}
              value={filters.z_thresh}
              className="accent-amber"
              onChange={(e) => update("z_thresh", parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>2</span>
              <span>5</span>
            </div>
          </div>
        </section>
      </div>

      {/* Loading footer */}
      {loading && (
        <div
          className="px-5 py-3 border-t border-white/[0.07] flex items-center justify-center gap-2 text-sm"
          style={{ color: "var(--cyan)" }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing…
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #0891b2, #06b6d4)",
          boxShadow: "0 4px 20px rgba(6,182,212,0.4)",
        }}
        onClick={() => setMobileOpen((o) => !o)}
      >
        {mobileOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <SlidersHorizontal className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0"
        style={{
          background: "rgba(6,13,31,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(6,13,31,0.98)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
