import type { ElementType, ReactNode } from "react";
import { BrandLogo } from "../shared/components";


export function AppShell({
  tabs, active, onTabChange, title, subtitle, rightSlot, children, accentColor = "#1B6B4E", roleLabel,
}: {
  tabs: { id: string; icon: ElementType; label: string }[];
  active: string; onTabChange: (id: string) => void;
  title: string; subtitle?: string; rightSlot?: ReactNode;
  children: ReactNode; accentColor?: string; roleLabel: string;
}) {
  return (
    <div className="h-screen h-[100dvh] min-h-[480px] flex overflow-hidden bg-[#F7F4EF]" style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-white border-r border-[#EEEBE4]">
        <div className="px-5 py-5 border-b border-[#EEEBE4]">
          <div className="mb-3"><BrandLogo compact /></div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#F0EDE7] text-[#6B6558]"
            style={{ fontFamily: "var(--font-mono)" }}>{roleLabel}</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button key={t.id} onClick={() => onTabChange(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive ? "text-white" : "text-[#6B6558] hover:bg-[#F0EDE7] hover:text-[#2A2520]"
                }`}
                style={isActive ? { backgroundColor: accentColor } : {}}>
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">

        {/* Header */}
        <header className="shrink-0 bg-white border-b border-[#EEEBE4] px-3 sm:px-5 py-3.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-extrabold text-[#1A1714] text-sm" style={{ fontFamily: "var(--font-display)" }}>{title}</p>
            {subtitle && <p className="hidden min-[360px]:block truncate text-[11px] text-[#9B9489]">{subtitle}</p>}
          </div>
          {rightSlot}
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {children}
        </main>

        {/* ── Mobile bottom tabs (in flex flow, not fixed) ── */}
        <nav className="md:hidden shrink-0 bg-white border-t border-[#EEEBE4] flex">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button key={t.id} onClick={() => onTabChange(t.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors cursor-pointer"
                style={{ color: isActive ? accentColor : "#A09A8E" }}>
                <div className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={isActive ? { backgroundColor: accentColor + "18" } : {}}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ─── PUBLIC VIEW ──────────────────────────────────────────────────────────────

