"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <div className="no-print" style={{ padding: "8px", background: "#f5f5f5", textAlign: "center", marginBottom: "16px" }}>
      <button onClick={() => window.print()} style={{ padding: "8px 16px", cursor: "pointer" }}>
        {label}
      </button>
    </div>
  );
}
