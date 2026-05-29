"use client";

import { useState } from "react";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Colombo";

export interface LogRow {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  users: { name: string; email: string } | null;
}

export function LogsClient({ logs }: { logs: LogRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !q || l.action.toLowerCase().includes(q) || (l.users?.name ?? "").toLowerCase().includes(q) || (l.target_table ?? "").includes(q);
  });

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action, admin, table…"
          className="px-3 py-1.5 border border-border rounded-lg text-sm outline-none focus:border-wine w-72"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-ink-light border-b border-border">
            <tr>
              <th className="text-left px-6 py-3">Time</th>
              <th className="text-left px-6 py-3">Admin</th>
              <th className="text-left px-6 py-3">Action</th>
              <th className="text-left px-6 py-3">Target</th>
              <th className="text-left px-6 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-ink-light whitespace-nowrap text-xs">
                  {formatInTimeZone(l.created_at, TZ, "d MMM, h:mm a")}
                </td>
                <td className="px-6 py-3 text-ink">{l.users?.name ?? "System"}</td>
                <td className="px-6 py-3 font-mono text-xs text-wine">{l.action}</td>
                <td className="px-6 py-3 text-xs text-ink-light">
                  {l.target_table && <span className="font-medium">{l.target_table}</span>}
                  {l.target_id && <span className="ml-1 opacity-60">{l.target_id.slice(0, 8)}…</span>}
                </td>
                <td className="px-6 py-3 text-xs text-ink-light font-mono max-w-xs truncate">
                  {l.metadata ? JSON.stringify(l.metadata) : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-light">No logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
