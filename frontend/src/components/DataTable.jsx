import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  X,
} from "lucide-react";

function exportCSV(data, columns, filename) {
  const headers = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = c.format ? c.format(row[c.key]) : String(row[c.key] ?? "");
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataTable({
  data,
  columns,
  title,
  pageSize = 15,
  searchable = false,
  exportable = false,
  exportFilename = "export.csv",
}) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [search, setSearch] = useState("");

  const allCols = useMemo(
    () => columns || Object.keys(data?.[0] || {}).map((k) => ({ key: k, label: k })),
    [columns, data]
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      allCols.some((col) => {
        const val = col.format ? col.format(row[col.key]) : String(row[col.key] ?? "");
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, allCols]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return sortDesc ? bv - av : av - bv;
      return sortDesc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }, [filtered, sortKey, sortDesc]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = page * pageSize;
  const pageData = sorted.slice(start, start + pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDesc((d) => !d);
    else { setSortKey(key); setSortDesc(true); }
    setPage(0);
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col.key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDesc
      ? <ArrowDown className="w-3 h-3" style={{ color: "var(--cyan)" }} />
      : <ArrowUp className="w-3 h-3" style={{ color: "var(--cyan)" }} />;
  };

  if (!data?.length) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        {title && <h3 className="section-title text-center mb-2">{title}</h3>}
        <p style={{ color: "var(--text-muted)" }} className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Table header */}
      <div
        className="px-5 py-4 border-b flex flex-wrap items-center gap-3"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {title && (
            <h3 className="section-title mb-0 shrink-0">{title}</h3>
          )}
          <span className="badge badge-cyan shrink-0">{sorted.length}</span>
        </div>

        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="input pl-8 pr-8 py-2 text-xs w-44"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(0); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                </button>
              )}
            </div>
          )}

          {exportable && (
            <button
              onClick={() => exportCSV(sorted, allCols, exportFilename)}
              className="btn btn-ghost px-2.5 py-2"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.25)" }}>
              {allCols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                  style={{
                    color: sortKey === col.key ? "var(--cyan)" : "var(--text-muted)",
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr
                key={i}
                className="border-t transition-colors hover:bg-white/[0.025]"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                {allCols.map((col) => {
                  const raw = row[col.key];
                  const display = col.format ? col.format(raw) : String(raw ?? "");
                  const isNum = typeof raw === "number";
                  const isNeg = isNum && raw < 0;
                  const isRecurring = col.key === "is_recurring";
                  const isCategory = col.key === "category";

                  return (
                    <td
                      key={col.key}
                      className="px-5 py-3 whitespace-nowrap"
                      style={{
                        color: isNeg
                          ? "#f43f5e"
                          : isNum
                          ? "#10b981"
                          : "var(--text-secondary)",
                        fontFamily: isNum ? "DM Mono, monospace" : "inherit",
                        fontSize: isNum ? "13px" : "14px",
                      }}
                    >
                      {isRecurring ? (
                        display === "Yes" ? (
                          <span className="badge badge-amber">Recurring</span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                        )
                      ) : isCategory ? (
                        <span className="badge" style={{ background: "rgba(6,182,212,0.1)", color: "#22d3ee" }}>
                          {display}
                        </span>
                      ) : (
                        display
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            {[
              { Icon: ChevronsLeft, action: () => setPage(0), disabled: page === 0 },
              { Icon: ChevronLeft, action: () => setPage((p) => Math.max(0, p - 1)), disabled: page === 0 },
              { Icon: ChevronRight, action: () => setPage((p) => Math.min(totalPages - 1, p + 1)), disabled: page >= totalPages - 1 },
              { Icon: ChevronsRight, action: () => setPage(totalPages - 1), disabled: page >= totalPages - 1 },
            ].map(({ Icon, action, disabled }, i) => (
              <button
                key={i}
                onClick={action}
                disabled={disabled}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  color: disabled ? "var(--text-muted)" : "var(--text-secondary)",
                  background: "transparent",
                  opacity: disabled ? 0.35 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Page {page + 1}/{totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
