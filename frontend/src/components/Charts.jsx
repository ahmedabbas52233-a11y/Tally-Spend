import React from "react";
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  LabelList,
} from "recharts";
import { RefreshCw } from "lucide-react";

const CATEGORY_COLORS = [
  "#06b6d4", "#f59e0b", "#f43f5e", "#10b981", "#8b5cf6",
  "#ec4899", "#3b82f6", "#14b8a6", "#f97316", "#84cc16",
];

function EmptyState({ message }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center gap-2">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <RefreshCw className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
      </div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-sm shadow-xl"
      style={{
        background: "rgba(10,20,40,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      {label && (
        <p
          className="font-semibold mb-1.5 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          <span style={{ color: "var(--text-secondary)" }} className="text-xs">
            {p.name}:
          </span>
          <span className="num text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {typeof p.value === "number" ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

const axisStyle = { fill: "#4e6080", fontSize: 11, fontFamily: "DM Mono, monospace" };
const gridStyle = { stroke: "rgba(255,255,255,0.05)", strokeDasharray: "4 4" };

export function MonthlyChart({ data }) {
  if (!data?.length) return (
    <div className="card p-5">
      <h3 className="section-title">Monthly Trend</h3>
      <EmptyState message="No monthly data" />
    </div>
  );

  return (
    <div className="card p-5 animate-fade-in">
      <h3 className="section-title">Monthly Spend vs Income</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#8b9ab5", paddingTop: 12 }} iconType="circle" iconSize={8} />
          <Bar dataKey="total_spend" name="Spend" fill="#f43f5e" radius={[4, 4, 0, 0]} opacity={0.9} maxBarSize={32} />
          <Area type="monotone" dataKey="total_income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data }) {
  if (!data?.length) return (
    <div className="card p-5">
      <h3 className="section-title">Category Breakdown</h3>
      <EmptyState message="No category data" />
    </div>
  );

  const topData = data.slice(0, 10);
  const total = topData.reduce((s, d) => s + d.spend, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const pct = ((topData[index].spend / total) * 100).toFixed(0);
    if (pct < 6) return null;
    return (
      <text x={x} y={y} fill="rgba(255,255,255,0.75)" textAnchor="middle" dominantBaseline="central" fontSize={10}>
        {pct}%
      </text>
    );
  };

  return (
    <div className="card p-5 animate-fade-in">
      <h3 className="section-title">Category Breakdown</h3>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={topData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              dataKey="spend"
              nameKey="category"
              labelLine={false}
              label={<CustomLabel />}
              stroke="none"
            >
              {topData.map((_, i) => (
                <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-2">
          {topData.map((d, i) => (
            <div key={d.category} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
              />
              <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                {d.category}
              </span>
              <span className="text-xs num ml-auto shrink-0" style={{ color: "var(--text-muted)" }}>
                {((d.spend / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TopMerchantsChart({ data }) {
  if (!data?.length) return (
    <div className="card p-5">
      <h3 className="section-title">Top Merchants by Spend</h3>
      <EmptyState message="No merchant data" />
    </div>
  );

  return (
    <div className="card p-5 animate-fade-in">
      <h3 className="section-title">Top Merchants by Spend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridStyle} horizontal={false} />
          <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
          <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="amount" name="Spend" fill="url(#barGrad)" radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList
              dataKey="amount"
              position="right"
              style={{ fill: "#8b9ab5", fontSize: 10, fontFamily: "DM Mono, monospace" }}
              formatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RecurringList({ data }) {
  if (!data?.length) return (
    <div className="card p-5">
      <h3 className="section-title">Recurring Payments</h3>
      <EmptyState message="No recurring payments detected" />
    </div>
  );

  return (
    <div className="card overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <h3 className="section-title mb-0">Recurring Payments</h3>
          <span className="badge badge-cyan">{data.length}</span>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        {data.map((r, i) => (
          <div
            key={i}
            className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}18`,
                color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                fontFamily: "Outfit, sans-serif",
              }}
            >
              {r.merchant.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {r.merchant}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {r.category} · {r.count} transactions
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold num" style={{ color: "#f43f5e" }}>
                {r.avgPerMonth.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>avg/month</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
