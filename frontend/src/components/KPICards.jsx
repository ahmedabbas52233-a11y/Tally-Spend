import React from "react";
import { TrendingDown, TrendingUp, Wallet, Activity } from "lucide-react";

function HealthRing({ score }) {
  if (score === null) return null;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color =
    score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#f43f5e";
  const label =
    score >= 70 ? "Excellent" : score >= 40 ? "Fair" : "At Risk";

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 1s ease-out", filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold num"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
          Financial Health
        </p>
        <p className="text-xl font-bold mt-0.5" style={{ color }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Savings ratio: {score}%
        </p>
      </div>
    </div>
  );
}

export function KPICards({ kpis, healthScore }) {
  if (!kpis) return null;

  const cards = [
    {
      label: "Total Spend",
      value: kpis.totalSpend ?? "N/A",
      icon: TrendingDown,
      accent: "#f43f5e",
      bg: "rgba(244,63,94,0.08)",
      border: "rgba(244,63,94,0.2)",
      delay: "0ms",
    },
    {
      label: "Total Income",
      value: kpis.totalIncome ?? "N/A",
      icon: TrendingUp,
      accent: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
      delay: "60ms",
    },
    {
      label: "Net Balance",
      value: kpis.net ?? "N/A",
      icon: Wallet,
      accent: "#06b6d4",
      bg: "rgba(6,182,212,0.08)",
      border: "rgba(6,182,212,0.2)",
      delay: "120ms",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="card p-5 animate-slide-up"
          style={{ animationDelay: card.delay }}
        >
          <div className="flex items-start justify-between mb-3">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)", fontFamily: "Outfit, sans-serif" }}
            >
              {card.label}
            </p>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: card.bg, border: `1px solid ${card.border}` }}
            >
              <card.icon className="w-4 h-4" style={{ color: card.accent }} />
            </div>
          </div>
          <p
            className="text-2xl font-bold num leading-none"
            style={{ color: "var(--text-primary)", fontFamily: "DM Mono, Outfit, monospace" }}
          >
            {card.value}
          </p>
        </div>
      ))}

      {/* Health Score Card */}
      <div
        className="card p-5 animate-slide-up"
        style={{ animationDelay: "180ms" }}
      >
        {healthScore !== null ? (
          <HealthRing score={healthScore} />
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(139,154,181,0.1)" }}
            >
              <Activity className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
                Health Score
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                No income data
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
