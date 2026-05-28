import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-14 bg-ink flex items-center px-6">
        <span className="font-display text-cream text-lg">Cakery Admin</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
