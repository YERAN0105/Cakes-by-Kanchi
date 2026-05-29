"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

const PERIODS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

export function RevenueChart({ allData }: { allData: RevenueDataPoint[] }) {
  const [period, setPeriod] = useState(30);
  const data = allData.slice(-period);

  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-ink">Revenue</h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                period === p.days ? "bg-wine text-cream" : "bg-gray-100 text-ink-light hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#852040" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#852040" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#59617A" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#59617A" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Revenue"]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#852040"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrderStatusChart({ data }: { data: StatusDataPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
      <h3 className="font-display text-lg text-ink mb-4">Orders by Status</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 12, color: "#59617A" }}>{value}</span>}
          />
          <Tooltip formatter={(v: number) => [v, "Orders"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
