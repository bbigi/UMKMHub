import { useEffect, useState } from "react";
import { KarangwuniMap, KARANGWUNI_CENTER } from "./components/KarangwuniMap";
import { supabase } from "../lib/supabase";
import { BRANDING } from "../config/branding";
import {
  Store, Building2, Shield, MapPin, Search, LogOut,
  Plus, Package, BarChart3, FileText, Map, TrendingUp,
  CheckCircle, Clock, AlertCircle, ChevronDown, Filter,
  Download, Eye, Settings, Layers, ArrowRight, Lock,
  UserPlus, Phone, Mail, User, LogIn, X, Home,
  ShoppingBag, Star, SlidersHorizontal, Navigation2,
  Zap, Users, Globe,
} from "lucide-react";

type View = "public" | "login" | "register" | "umkm" | "pemerintah" | "admin";
type UmkmTab = "beranda" | "profil" | "produk" | "pesanan";
type GovTab = "ringkasan" | "daftar" | "laporan";
type AdminTab = "ringkasan" | "pengguna" | "umkm" | "konten";

function BrandLogo({ compact = false, inverse = false, showName = true }: { compact?: boolean; inverse?: boolean; showName?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="flex min-w-0 items-center gap-2.5">
    <div className={`${compact ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl"} flex shrink-0 items-center justify-center overflow-hidden ${!failed ? "bg-white" : inverse ? "bg-white/20" : "bg-[#1B6B4E]"}`}>
      {!failed ? <img src={BRANDING.platformLogo} alt={`Logo ${BRANDING.platformName}`} onError={() => setFailed(true)} className="h-full w-full object-contain p-0.5" /> : <Store size={compact ? 14 : 18} className="text-white" />}
    </div>
    {showName && <div className="min-w-0"><p className={`truncate font-extrabold ${compact ? "text-sm" : "text-base"} ${inverse ? "text-white" : "text-[#1A1714]"}`} style={{ fontFamily: "var(--font-display)" }}>{BRANDING.platformName}</p>{!compact && <p className={`text-[10px] ${inverse ? "text-[#8ECFB4]" : "text-[#9B9489]"}`}>{BRANDING.platformTagline}</p>}</div>}
  </div>;
}

function TechnologyPartner({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className={`flex items-center gap-2 ${compact ? "text-[9px]" : "text-[10px]"}`}>
    {!failed && <span className={`flex items-center rounded-lg bg-white ${compact ? "h-6 px-1" : "h-9 px-2"}`}><img src={BRANDING.partnerLogo} alt={`Logo ${BRANDING.partnerName}`} onError={() => setFailed(true)} className={`${compact ? "h-4 max-w-20" : "h-6 max-w-28"} object-contain`} /></span>}
    <div><p className={inverse ? "text-white/55" : "text-[#9B9489]"}>{BRANDING.partnerLabel}</p><p className={`font-bold ${inverse ? "text-white" : "text-[#2A2520]"}`}>{BRANDING.partnerName}</p></div>
  </div>;
}

function AnnouncementBanner({ audience }: { audience: "umkm" | "pemerintah" }) {
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string }[]>([]);
  useEffect(() => {
    supabase?.from("announcements").select("id,title,content").eq("active", true).in("audience", ["semua", audience]).order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => setAnnouncements(data ?? []));
  }, [audience]);
  if (!announcements.length) return null;
  return <div className="space-y-2">{announcements.map((item) => <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-900">{item.title}</p><p className="mt-0.5 text-xs text-amber-700">{item.content}</p></div>)}</div>;
}

function ReportIssueButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reporter_name: "", reporter_contact: "", subject: "", description: "" });
  const [message, setMessage] = useState("");
  const submit = async () => {
    if (!supabase || !form.subject || !form.description) return setMessage("Subjek dan isi laporan wajib diisi.");
    const { error } = await supabase.from("user_reports").insert({ ...form, reporter_name: form.reporter_name || "Anonim" });
    if (error) setMessage(`Gagal mengirim: ${error.message}`); else { setMessage("Laporan berhasil dikirim."); setForm({ reporter_name: "", reporter_contact: "", subject: "", description: "" }); }
  };
  return <><button onClick={() => setOpen(true)} className="report-issue-button fixed z-[1500] rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#6B3FA0] shadow-lg border"><AlertCircle size={14} className="inline mr-1" /> Laporkan masalah</button>{open && <div className="fixed inset-0 z-[2500] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><div className="w-full rounded-t-3xl bg-white p-5 sm:max-w-md sm:rounded-3xl"><div className="mb-4 flex justify-between"><h3 className="font-bold">Laporan Pengguna</h3><button onClick={() => setOpen(false)}><X size={18} /></button></div><div className="space-y-3"><FInput label="Nama (opsional)" placeholder="Nama Anda" value={form.reporter_name} onChange={(v) => setForm((x) => ({ ...x, reporter_name: v }))} /><FInput label="Kontak (opsional)" placeholder="Email / WhatsApp" value={form.reporter_contact} onChange={(v) => setForm((x) => ({ ...x, reporter_contact: v }))} /><FInput label="Subjek" placeholder="Masalah yang dilaporkan" value={form.subject} onChange={(v) => setForm((x) => ({ ...x, subject: v }))} /><textarea rows={4} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} placeholder="Jelaskan masalah…" className="w-full rounded-xl border bg-[#F8F5F0] p-3 text-sm" />{message && <p className="text-xs text-[#6B3FA0]">{message}</p>}<button onClick={submit} className="w-full rounded-xl bg-[#6B3FA0] py-3 text-sm font-bold text-white">Kirim Laporan</button></div></div></div>}</>;
}

// ─── MAP CANVAS ───────────────────────────────────────────────────────────────

function MapCanvas({ className = "" }: { className?: string }) {
  return <KarangwuniMap className={className} mobilePanelOffset />;
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, desc, action, onAction }: {
  icon: React.ElementType; title: string; desc: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-[#F0EDE7] flex items-center justify-center mb-3">
        <Icon size={22} className="text-[#B0A99E]" />
      </div>
      <p className="font-bold text-[#2A2520] text-sm mb-1" style={{ fontFamily: "var(--font-display)" }}>{title}</p>
      <p className="text-[#9B9489] text-xs leading-relaxed mb-4 max-w-[220px]">{desc}</p>
      {action && onAction && (
        <button onClick={onAction}
          className="inline-flex items-center gap-1.5 bg-[#1B6B4E] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#155a3f] transition-colors cursor-pointer">
          <Plus size={13} />{action}
        </button>
      )}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, className = "" }: {
  label: string; value: string | number; icon: React.ElementType; color: string; className?: string;
}) {
  return (
    <div className={`bg-white border border-[#EEEBE4] rounded-2xl p-3 sm:p-4 flex-shrink-0 w-36 ${className}`}>
      <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={14} className="text-white" />
      </div>
      <p className="text-2xl font-extrabold text-[#1A1714] leading-none mb-1" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
      <p className="text-xs text-[#9B9489]">{label}</p>
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: "green" | "orange" | "blue" | "gray" }) {
  const s = { green: "bg-[#D1F5E3] text-[#0F6B35]", orange: "bg-[#FDE8D8] text-[#B84A12]", blue: "bg-[#DDE8F5] text-[#1E4D8A]", gray: "bg-[#EEEBE4] text-[#6B6558]" };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase ${s[color]}`} style={{ fontFamily: "var(--font-mono)" }}>{label}</span>;
}

// ─── FORM INPUT ───────────────────────────────────────────────────────────────

function FInput({ label, icon: Icon, type = "text", placeholder, value, onChange }: {
  label: string; icon?: React.ElementType; type?: string;
  placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#6B6558] mb-1.5 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A99E]" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] text-sm text-[#1A1714] placeholder:text-[#C0B9B0] focus:outline-none focus:ring-2 focus:ring-[#1B6B4E]/25 focus:border-[#1B6B4E] transition-all`} />
      </div>
    </div>
  );
}

// ─── APP SHELL (authenticated layout) ────────────────────────────────────────

function AppShell({
  tabs, active, onTabChange, title, subtitle, rightSlot, children, accentColor = "#1B6B4E", roleLabel,
}: {
  tabs: { id: string; icon: React.ElementType; label: string }[];
  active: string; onTabChange: (id: string) => void;
  title: string; subtitle?: string; rightSlot?: React.ReactNode;
  children: React.ReactNode; accentColor?: string; roleLabel: string;
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

function PublicView({ onLogin }: { onLogin: () => void }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const filters = ["Semua", "Makanan", "Kerajinan", "Fashion", "Pertanian", "Jasa"];

  return (
    <div className="h-screen h-[100dvh] min-h-[480px] flex overflow-hidden bg-[#F7F4EF]" style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Desktop: left panel + map ── */}
      <div className="hidden md:flex flex-col w-80 shrink-0 bg-white border-r border-[#EEEBE4]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EEEBE4] flex items-center justify-between">
          <BrandLogo compact />
          <button onClick={onLogin}
            className="flex items-center gap-1.5 bg-[#1B6B4E] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#155a3f] transition-colors cursor-pointer">
            <LogIn size={13} /> Masuk
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#EEEBE4]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9489]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk atau UMKM..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] text-sm placeholder:text-[#B0A99E] focus:outline-none focus:ring-2 focus:ring-[#1B6B4E]/25 focus:border-[#1B6B4E] transition-all" />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2.5 border-b border-[#EEEBE4] flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                activeFilter === f ? "bg-[#1A1714] text-white" : "bg-[#F0EDE7] text-[#6B6558] hover:bg-[#E5E0D8]"
              }`}>{f}</button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="font-extrabold text-[#1A1714] text-sm" style={{ fontFamily: "var(--font-display)" }}>UMKM Terdekat</p>
            <span className="text-xs text-[#9B9489]">0 ditemukan</span>
          </div>
          <EmptyState icon={MapPin} title="Belum ada UMKM" desc="UMKM yang terdaftar di sekitar Anda akan muncul di sini." />
        </div>

        {/* CTA */}
        <div className="p-4 border-t border-[#EEEBE4]">
          <div className="bg-[#1B6B4E] rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white text-xs" style={{ fontFamily: "var(--font-display)" }}>Punya usaha? Daftar gratis!</p>
              <p className="text-[#8ECFB4] text-[10px] mt-0.5">Jangkau lebih banyak pembeli.</p>
            </div>
            <button onClick={onLogin} className="shrink-0 bg-white text-[#1B6B4E] text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 hover:bg-[#F0FAF5] transition-colors">
              Daftar <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 min-w-0 relative">
        <MapCanvas className="absolute inset-0 w-full h-full" />

        {/* Mobile top bar */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-[1000] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] space-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-white/60 shrink-0"><BrandLogo compact showName={false} /></div>
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9489]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari UMKM..."
                className="w-full min-w-0 pl-9 pr-3 py-2.5 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/60 shadow-sm text-sm placeholder:text-[#B0A99E] focus:outline-none" />
            </div>
            <button onClick={onLogin} aria-label="Masuk" className="shrink-0 bg-[#1B6B4E] text-white text-xs font-bold p-3 min-[390px]:px-3.5 min-[390px]:py-2.5 rounded-2xl shadow-sm cursor-pointer flex items-center gap-1.5">
              <LogIn size={13} /> <span className="hidden min-[390px]:inline">Masuk</span>
            </button>
          </div>

          {/* Mobile filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {filters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-sm border ${
                  activeFilter === f ? "bg-[#1A1714] text-white border-transparent" : "bg-white/90 text-[#2A2520] border-white/60 shadow-sm"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {/* Mobile bottom panel */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 max-h-[38dvh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl z-[1000] pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-center pt-2.5 mb-3">
            <div className="w-10 h-1 rounded-full bg-[#D8D4CC]" />
          </div>
          <div className="px-4 pb-2 flex items-center justify-between">
            <div>
              <p className="font-extrabold text-[#1A1714] text-base" style={{ fontFamily: "var(--font-display)" }}>UMKM Terdekat</p>
              <p className="text-xs text-[#9B9489]">0 ditemukan di sekitar Anda</p>
            </div>
            <button className="text-xs font-semibold text-[#1B6B4E] cursor-pointer">Lihat semua</button>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 text-left">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F0EDE7] flex items-center justify-center"><MapPin size={18} className="text-[#B0A99E]" /></div>
            <div><p className="font-bold text-[#2A2520] text-sm">Belum ada UMKM</p><p className="text-[#9B9489] text-xs">UMKM lokal akan muncul di sini.</p></div>
          </div>
          <div className="mx-4 mb-4 bg-[#1B6B4E] rounded-2xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>Punya usaha? Daftar gratis!</p>
              <p className="hidden min-[360px]:block text-[#8ECFB4] text-xs mt-0.5">Jangkau lebih banyak pembeli.</p>
            </div>
            <button onClick={onLogin} className="shrink-0 bg-white text-[#1B6B4E] text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer flex items-center gap-1 hover:bg-[#F0FAF5] transition-colors">
              Daftar <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Location pill */}
        <div className="absolute top-4 right-4 hidden md:flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-white/60 shadow-sm rounded-2xl px-3 py-1.5">
          <Navigation2 size={12} className="text-[#C9511F] fill-[#C9511F]" />
          <span className="text-xs font-semibold text-[#2A2520]">Mendeteksi lokasi…</span>
        </div>
      </div>
      <ReportIssueButton />
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginPage({ onBack, onSuccess, onRegister }: {
  onBack: () => void;
  onSuccess: (r: "umkm" | "pemerintah" | "admin") => void;
  onRegister: () => void;
}) {
  const [selected, setSelected] = useState<"umkm" | "pemerintah" | "admin" | null>(null);
  const [clicks, setClicks] = useState(0);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  function logoClick() {
    const n = clicks + 1;
    setClicks(n);
    if (n >= 5) setSelected("admin");
  }

  const login = async () => {
    if (!supabase) return setAuthMessage("Supabase belum dikonfigurasi.");
    if (!email || !pass || !selected) return setAuthMessage("Lengkapi email dan kata sandi.");
    setAuthLoading(true); setAuthMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error || !data.user) { setAuthLoading(false); return setAuthMessage("Email atau kata sandi tidak benar."); }
    const role = data.user.app_metadata?.role ?? data.user.user_metadata?.role;
    const expected = selected === "pemerintah" ? "government" : selected;
    if (role !== expected) {
      await supabase.auth.signOut(); setAuthLoading(false);
      return setAuthMessage("Akun ini tidak memiliki akses untuk peran yang dipilih.");
    }
    setAuthLoading(false); onSuccess(selected);
  };

  const features = [
    { icon: MapPin, text: "Temukan UMKM di sekitar Anda" },
    { icon: Zap, text: "Daftar dalam hitungan menit" },
    { icon: Globe, text: "Jangkau pembeli lebih luas" },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Hero panel ── */}
      <div className="relative flex flex-col justify-between px-7 pt-10 pb-8 bg-[#1B6B4E] md:w-[420px] md:shrink-0"
        style={{ minHeight: "42vh" }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#2E8C6A]/25 -translate-y-16 translate-x-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#155A3F]/40 translate-y-10 -translate-x-10 pointer-events-none" />
        <div className="absolute top-1/2 right-8 w-16 h-16 rounded-full bg-[#8ECFB4]/20 pointer-events-none" />

        {/* Logo + close */}
        <div className="relative flex items-center justify-between">
          <button onClick={logoClick} className="cursor-pointer"><BrandLogo inverse /></button>
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Headline */}
        <div className="relative my-6 md:my-0 md:flex-1 md:flex md:flex-col md:justify-center">
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Satu platform<br />untuk semua UMKM
          </h1>
          <p className="text-[#A8D5C2] text-sm leading-relaxed mb-6">
            Bergabung dengan ribuan pelaku usaha dan pembeli di seluruh Indonesia.
          </p>
          <div className="space-y-2.5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Icon size={12} className="text-white" />
                  </div>
                  <span className="text-white/90 text-sm">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="relative flex items-end justify-between gap-4 md:mt-8">
          <div className="flex gap-5">
          {[{ n: "0+", l: "UMKM Terdaftar" }, { n: "0+", l: "Produk" }, { n: "0+", l: "Kota" }].map((s) => (
            <div key={s.l}>
              <p className="font-extrabold text-white text-xl" style={{ fontFamily: "var(--font-display)" }}>{s.n}</p>
              <p className="text-[#8ECFB4] text-[10px]">{s.l}</p>
            </div>
          ))}
          </div><TechnologyPartner inverse /></div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#F7F4EF]" style={{ scrollbarWidth: "none" }}>
        <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-[#1A1714] mb-1" style={{ fontFamily: "var(--font-display)" }}>Selamat datang</h2>
            <p className="text-sm text-[#9B9489]">Pilih peran Anda untuk melanjutkan</p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { id: "umkm" as const, icon: Store, label: "Pemilik UMKM", desc: "Kelola usaha & produk", accent: "#1B6B4E", light: "#EAF2EE" },
              { id: "pemerintah" as const, icon: Building2, label: "Dinas / Pemerintah", desc: "Pantau data wilayah", accent: "#2E5B8A", light: "#E5EEF8" },
            ].map((r) => {
              const Icon = r.icon;
              const isActive = selected === r.id;
              return (
                <button key={r.id} onClick={() => setSelected(r.id)}
                  className={`text-left p-4 rounded-2xl border-2 bg-white transition-all cursor-pointer ${isActive ? "shadow-md" : "border-[#E8E3DA]"}`}
                  style={isActive ? { borderColor: r.accent } : {}}>
                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: r.light }}>
                    <Icon size={18} style={{ color: r.accent }} />
                  </div>
                  <p className="font-bold text-[#1A1714] text-sm leading-tight" style={{ fontFamily: "var(--font-display)" }}>{r.label}</p>
                  <p className="text-xs text-[#9B9489] mt-0.5">{r.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Form */}
          {selected ? (
            <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 space-y-4">
              <FInput label="Email" icon={Mail} type="email" placeholder="nama@email.com" value={email} onChange={setEmail} />
              <FInput label="Kata Sandi" icon={Lock} type="password" placeholder="••••••••" value={pass} onChange={setPass} />
              {authMessage && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{authMessage}</p>}
              <button onClick={login} disabled={authLoading}
                className="w-full font-bold text-sm py-3.5 rounded-xl text-white hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1B6B4E" }}>
                <LogIn size={15} /> {authLoading ? "Memeriksa akun…" : "Masuk"}
              </button>
              {selected === "umkm" && (
                <p className="text-center text-xs text-[#9B9489]">
                  Belum punya akun?{" "}
                  <button onClick={onRegister} className="font-bold text-[#1B6B4E] hover:underline cursor-pointer">Daftar gratis</button>
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 text-center">
              <p className="text-sm text-[#B0A99E]">Pilih peran di atas untuk menampilkan form masuk</p>
            </div>
          )}
          <div className="mt-5 flex justify-center"><TechnologyPartner /></div>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

function RegisterPage({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ nama: "", hp: "", email: "", pass: "", usaha: "", kategori: "", desk: "", kota: "" });
  const [registerMessage, setRegisterMessage] = useState("");
  const [registering, setRegistering] = useState(false);
  const upd = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const kategoriList = ["Makanan & Minuman", "Kerajinan Tangan", "Fashion & Pakaian", "Pertanian", "Jasa & Layanan", "Kesehatan & Kecantikan", "Lainnya"];
  const register = async () => {
    if (!supabase) return setRegisterMessage("Supabase belum dikonfigurasi.");
    if (!f.nama || !f.email || f.pass.length < 8) return setRegisterMessage("Nama, email, dan kata sandi minimal 8 karakter wajib diisi.");
    setRegistering(true); setRegisterMessage("");
    const { error } = await supabase.auth.signUp({ email: f.email, password: f.pass, options: { data: { role: "umkm", nama: f.nama, phone: f.hp } } });
    setRegistering(false);
    if (error) return setRegisterMessage(`Pendaftaran gagal: ${error.message}`);
    setRegisterMessage("Akun berhasil dibuat. Periksa email konfirmasi, lalu masuk.");
    window.setTimeout(onSuccess, 1200);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>
      {/* Hero */}
      <div className="relative bg-[#1B6B4E] px-7 pt-10 pb-8 md:w-[420px] md:shrink-0 flex flex-col justify-between" style={{ minHeight: "38vh" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#2E8C6A]/20 -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-[#155A3F]/30 translate-y-8 -translate-x-8 pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <button onClick={onBack} className="cursor-pointer"><BrandLogo inverse /></button>
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white/70 cursor-pointer hover:bg-white/25 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="relative mt-6 md:mt-0">
          <h1 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {step === 1 ? "Buat Akun Gratis" : "Info Usaha Anda"}
          </h1>
          <p className="text-[#A8D5C2] text-sm">
            {step === 1 ? "Tanpa biaya — tanpa NIB — tanpa ribet" : "Ceritakan sedikit tentang usaha Anda"}
          </p>
          {/* Progress */}
          <div className="flex gap-2 mt-5">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
          <p className="text-white/60 text-[10px] mt-2">Langkah {step} dari 2</p>
          <div className="mt-5"><TechnologyPartner inverse /></div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#F7F4EF]" style={{ scrollbarWidth: "none" }}>
        <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-sm mx-auto w-full">
          <div className="bg-white border border-[#E8E3DA] rounded-2xl p-5 space-y-4">
            {step === 1 && (
              <>
                <FInput label="Nama Lengkap" icon={User} placeholder="Nama Anda" value={f.nama} onChange={(v) => upd("nama", v)} />
                <FInput label="No. HP / WhatsApp" icon={Phone} placeholder="08xx-xxxx-xxxx" value={f.hp} onChange={(v) => upd("hp", v)} />
                <FInput label="Email" icon={Mail} type="email" placeholder="nama@email.com" value={f.email} onChange={(v) => upd("email", v)} />
                <FInput label="Kata Sandi" icon={Lock} type="password" placeholder="Min. 8 karakter" value={f.pass} onChange={(v) => upd("pass", v)} />
                <button onClick={() => setStep(2)}
                  className="w-full bg-[#1B6B4E] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#155a3f] transition-colors cursor-pointer">
                  Lanjut ke Info Usaha →
                </button>
                <p className="text-center text-xs text-[#9B9489]">
                  Sudah punya akun?{" "}
                  <button onClick={onBack} className="font-bold text-[#1B6B4E] hover:underline cursor-pointer">Masuk</button>
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <FInput label="Nama Usaha" placeholder="Contoh: Warung Sate Bu Tini" value={f.usaha} onChange={(v) => upd("usaha", v)} />
                <div>
                  <label className="block text-xs font-bold text-[#6B6558] mb-1.5 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>Kategori</label>
                  <div className="relative">
                    <select value={f.kategori} onChange={(e) => upd("kategori", e.target.value)}
                      className="w-full appearance-none px-4 pr-9 py-3 rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] text-sm text-[#1A1714] focus:outline-none focus:ring-2 focus:ring-[#1B6B4E]/25 cursor-pointer">
                      <option value="">Pilih kategori…</option>
                      {kategoriList.map((k) => <option key={k}>{k}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0A99E] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B6558] mb-1.5 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>Deskripsi Singkat</label>
                  <textarea value={f.desk} onChange={(e) => upd("desk", e.target.value)}
                    placeholder="Produk atau jasa yang Anda tawarkan…" rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] text-sm placeholder:text-[#C0B9B0] focus:outline-none focus:ring-2 focus:ring-[#1B6B4E]/25 focus:border-[#1B6B4E] transition-all resize-none" />
                </div>
                <FInput label="Kota / Kabupaten" placeholder="Contoh: Kota Bandung" value={f.kota} onChange={(v) => upd("kota", v)} />
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setStep(1)} className="flex-1 border border-[#E0DCD5] text-[#1A1714] font-bold text-sm py-3.5 rounded-xl hover:bg-[#F0EDE7] transition-colors cursor-pointer">← Kembali</button>
                  <button onClick={register} disabled={registering} className="flex-[2] bg-[#1B6B4E] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#155a3f] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                    <UserPlus size={14} /> {registering ? "Mendaftarkan…" : "Daftar Sekarang"}
                  </button>
                </div>
                {registerMessage && <p className="rounded-xl bg-[#F0EDE7] px-3 py-2 text-xs text-[#6B6558]">{registerMessage}</p>}
                <p className="text-center text-[11px] text-[#B0A99E]">Tidak diperlukan NIB atau dokumen legalitas</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UMKM DASHBOARD ───────────────────────────────────────────────────────────

function UmkmDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<UmkmTab>("beranda");
  const [profile, setProfile] = useState({ nama_usaha: "", no_whatsapp: "", kategori: "", deskripsi: "", alamat: "" });
  const [location, setLocation] = useState(KARANGWUNI_CENTER);
  const [saveStatus, setSaveStatus] = useState("");
  const [ownerSubmissionEnabled, setOwnerSubmissionEnabled] = useState(true);
  useEffect(() => {
    supabase?.from("platform_settings").select("owner_can_submit_umkm").eq("id", true).single()
      .then(({ data }) => data && setOwnerSubmissionEnabled(data.owner_can_submit_umkm));
  }, []);
  const updateProfile = (key: keyof typeof profile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const saveProfile = async () => {
    if (!ownerSubmissionEnabled) return setSaveStatus("Pendaftaran UMKM sedang dinonaktifkan oleh admin platform.");
    if (!supabase) return setSaveStatus("Supabase belum dikonfigurasi di file .env");
    if (!profile.nama_usaha || !profile.no_whatsapp || !profile.kategori || !profile.alamat) return setSaveStatus("Lengkapi semua kolom wajib.");
    setSaveStatus("Menyimpan...");
    const { error } = await supabase.from("umkm").insert({ ...profile, latitude: location.lat, longitude: location.lng });
    setSaveStatus(error ? `Gagal: ${error.message}` : "Data terkirim dan menunggu verifikasi admin.");
  };
  const tabs = [
    { id: "beranda" as const, icon: Home, label: "Beranda" },
    { id: "profil" as const, icon: Store, label: "Toko" },
    { id: "produk" as const, icon: Package, label: "Produk" },
    { id: "pesanan" as const, icon: ShoppingBag, label: "Pesanan" },
  ];
  const titles: Record<UmkmTab, string> = { beranda: "Beranda", profil: "Profil Toko", produk: "Produk Saya", pesanan: "Pesanan" };

  return (
    <AppShell tabs={tabs} active={tab} onTabChange={(id) => setTab(id as UmkmTab)}
      title={titles[tab]} subtitle="Pemilik UMKM" roleLabel="Pemilik UMKM"
      rightSlot={
        <button onClick={onLogout} className="w-9 h-9 rounded-xl border border-[#E8E3DA] bg-[#F8F5F0] flex items-center justify-center text-[#9B9489] hover:text-[#C0392B] transition-colors cursor-pointer">
          <LogOut size={15} />
        </button>
      }>

      <div className="p-4 space-y-4 pb-6">
        <AnnouncementBanner audience="umkm" />
        {tab === "beranda" && (
          <>
            <div className="bg-[#1B6B4E] rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-40 h-40 bg-[#2E8C6A]/25 rounded-full -translate-y-14 translate-x-14 pointer-events-none" />
              <div className="absolute right-10 bottom-0 w-24 h-24 bg-[#155A3F]/35 rounded-full translate-y-8 pointer-events-none" />
              <div className="relative">
                <Badge label="TOKO AKTIF" color="green" />
                <h2 className="font-extrabold text-white text-lg mt-2 mb-1 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  Lengkapi toko agar tampil di peta
                </h2>
                <p className="text-[#8ECFB4] text-xs leading-relaxed mb-4">Tambah produk dan atur lokasi untuk menjangkau lebih banyak pembeli.</p>
                <button onClick={() => setTab("profil")}
                  className="inline-flex items-center gap-1.5 bg-white text-[#1B6B4E] text-xs font-bold px-4 py-2 rounded-xl cursor-pointer">
                  Lengkapi Sekarang <ArrowRight size={12} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <StatCard label="Produk" value={0} icon={Package} color="bg-[#1B6B4E]" />
              <StatCard label="Pesanan" value={0} icon={ShoppingBag} color="bg-[#C9511F]" />
              <StatCard label="Dilihat" value={0} icon={Eye} color="bg-[#2E5B8A]" />
              <StatCard label="Rating" value="—" icon={Star} color="bg-[#8D5A2B]" />
            </div>

            <div className="bg-white border border-[#EEEBE4] rounded-2xl p-4">
              <p className="font-bold text-[#1A1714] text-sm mb-3" style={{ fontFamily: "var(--font-display)" }}>Langkah Memulai</p>
              {[
                { n: 1, label: "Lengkapi profil dan data usaha", to: "profil" as UmkmTab },
                { n: 2, label: "Tambah produk pertama Anda", to: "produk" as UmkmTab },
                { n: 3, label: "Atur lokasi toko di peta", to: "profil" as UmkmTab },
              ].map((s) => (
                <button key={s.n} onClick={() => setTab(s.to)}
                  className="w-full flex items-center gap-3 py-2.5 border-b border-[#F0EDE7] last:border-0 text-left cursor-pointer hover:bg-[#FAFAF8] rounded-xl px-2 -mx-2 transition-colors">
                  <div className="w-6 h-6 rounded-full border-2 border-[#D8D4CC] flex items-center justify-center text-[10px] font-bold text-[#9B9489] shrink-0">{s.n}</div>
                  <span className="text-sm text-[#2A2520]">{s.label}</span>
                  <span className="ml-auto text-[#C0B9B0] text-base">›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "profil" && (
          <div className="bg-white border border-[#EEEBE4] rounded-2xl p-5 space-y-4">
            <FInput label="Nama Usaha *" placeholder="Nama toko Anda" value={profile.nama_usaha} onChange={(v) => updateProfile("nama_usaha", v)} />
            <FInput label="No. HP / WhatsApp *" icon={Phone} placeholder="08xx-xxxx-xxxx" value={profile.no_whatsapp} onChange={(v) => updateProfile("no_whatsapp", v)} />
            <div>
              <label className="block text-xs font-bold text-[#6B6558] mb-1.5 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>Kategori</label>
              <div className="relative">
                <select value={profile.kategori} onChange={(e) => updateProfile("kategori", e.target.value)} className="w-full appearance-none px-4 pr-9 py-3 rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] text-sm text-[#1A1714] focus:outline-none cursor-pointer">
                  <option value="">Pilih kategori…</option>
                  {["Makanan & Minuman", "Kerajinan", "Fashion", "Pertanian", "Jasa"].map((k) => <option key={k}>{k}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0A99E] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B6558] mb-1.5 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>Deskripsi</label>
              <textarea value={profile.deskripsi} onChange={(e) => updateProfile("deskripsi", e.target.value)} placeholder="Ceritakan produk atau layanan Anda…" rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] text-sm placeholder:text-[#C0B9B0] focus:outline-none focus:ring-2 focus:ring-[#1B6B4E]/25 focus:border-[#1B6B4E] transition-all resize-none" />
            </div>
            <FInput label="Alamat Lengkap *" placeholder="Karangwuni, Wates…" value={profile.alamat} onChange={(v) => updateProfile("alamat", v)} />
            <div>
              <label className="block text-xs font-bold text-[#6B6558] mb-1.5 uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>Lokasi Toko *</label>
              <p className="text-xs text-[#9B9489] mb-2">Klik peta untuk menentukan titik toko di wilayah Karangwuni.</p>
              <KarangwuniMap className="h-64 overflow-hidden rounded-xl border border-[#E4DFD8]" selectedLocation={location} pickLocation={(lat, lng) => setLocation({ lat, lng })} />
              <p className="mt-2 text-[11px] text-[#9B9489]">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
            </div>
            {saveStatus && <p className="rounded-xl bg-[#F0EDE7] px-3 py-2 text-xs text-[#6B6558]">{saveStatus}</p>}
            {!ownerSubmissionEnabled && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Fitur tambah UMKM sedang dinonaktifkan oleh admin.</p>}
            <button type="button" disabled={!ownerSubmissionEnabled} onClick={saveProfile} className="w-full bg-[#1B6B4E] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#155a3f] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40">Simpan Profil</button>
          </div>
        )}

        {tab === "produk" && (
          <>
            <button className="w-full flex items-center justify-center gap-2 bg-[#1B6B4E] text-white font-bold text-sm py-3.5 rounded-2xl hover:bg-[#155a3f] transition-colors cursor-pointer">
              <Plus size={14} /> Tambah Produk Baru
            </button>
            <div className="bg-white border border-[#EEEBE4] rounded-2xl">
              <EmptyState icon={Package} title="Belum ada produk" desc="Tambahkan produk agar muncul di peta dan hasil pencarian pembeli." />
            </div>
          </>
        )}

        {tab === "pesanan" && (
          <div className="bg-white border border-[#EEEBE4] rounded-2xl">
            <EmptyState icon={ShoppingBag} title="Belum ada pesanan" desc="Pesanan dari pembeli akan muncul di sini setelah toko aktif." />
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── PEMERINTAH DASHBOARD ─────────────────────────────────────────────────────

function PemerintahDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<GovTab>("ringkasan");
  const [wilayah, setWilayah] = useState("Semua Wilayah");
  const [govStats, setGovStats] = useState({ total: 0, aktif: 0, menunggu: 0, tidakAktif: 0 });
  useEffect(() => {
    if (!supabase) return;
    supabase.from("umkm").select("status").then(({ data }) => {
      if (!data) return;
      setGovStats({ total: data.length, aktif: data.filter((x) => x.status === "aktif").length, menunggu: data.filter((x) => x.status === "menunggu").length, tidakAktif: data.filter((x) => x.status === "ditolak").length });
    });
  }, []);
  const tabs = [
    { id: "ringkasan" as const, icon: BarChart3, label: "Ringkasan" },
    { id: "daftar" as const, icon: Layers, label: "Daftar" },
    { id: "laporan" as const, icon: FileText, label: "Laporan" },
  ];
  const titles: Record<GovTab, string> = { ringkasan: "Ringkasan", daftar: "Daftar UMKM", laporan: "Laporan" };

  return (
    <AppShell tabs={tabs} active={tab} onTabChange={(id) => setTab(id as GovTab)}
      title={titles[tab]} subtitle="Dinas / Pemerintah" roleLabel="Dinas / Pemerintah" accentColor="#2E5B8A"
      rightSlot={
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <div className="relative min-w-0">
            <select value={wilayah} onChange={(e) => setWilayah(e.target.value)}
              aria-label="Pilih wilayah" className="w-[105px] sm:w-[140px] appearance-none truncate pl-2.5 sm:pl-3 pr-6 sm:pr-7 py-2 text-[11px] sm:text-xs font-bold border border-[#E8E3DA] rounded-xl bg-white text-[#1A1714] focus:outline-none cursor-pointer">
              {["Semua Wilayah", "Kec. Utara", "Kec. Selatan", "Kec. Timur"].map((w) => <option key={w}>{w}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9B9489] pointer-events-none" />
          </div>
          <button onClick={onLogout} aria-label="Keluar" className="w-9 h-9 shrink-0 rounded-xl border border-[#E8E3DA] bg-[#F8F5F0] flex items-center justify-center text-[#9B9489] hover:text-[#C0392B] transition-colors cursor-pointer">
            <LogOut size={15} />
          </button>
        </div>
      }>

      {tab === "ringkasan" && (
        <div className="flex min-h-full flex-col overflow-x-hidden">
          <div className="px-4 pt-4"><AnnouncementBanner audience="pemerintah" /></div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 px-3 pt-3 pb-3 sm:gap-3 sm:px-4 lg:grid-cols-4">
            <StatCard className="w-full min-w-0" label="Total UMKM" value={govStats.total} icon={Store} color="bg-[#2E5B8A]" />
            <StatCard className="w-full min-w-0" label="Aktif" value={govStats.aktif} icon={CheckCircle} color="bg-[#1B6B4E]" />
            <StatCard className="w-full min-w-0" label="Menunggu" value={govStats.menunggu} icon={Clock} color="bg-[#C9511F]" />
            <StatCard className="w-full min-w-0" label="Tidak Aktif" value={govStats.tidakAktif} icon={AlertCircle} color="bg-[#8D5A2B]" />
          </div>
          {/* Map */}
          <div className="mx-3 h-[220px] shrink-0 overflow-hidden rounded-2xl border border-[#EEEBE4] mb-4 sm:mx-4 sm:h-[280px] lg:h-[340px]">
            <MapCanvas className="w-full h-full" />
          </div>
          {/* List header */}
          <div className="px-3 sm:px-4 mb-3 flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate font-extrabold text-[#1A1714] text-sm" style={{ fontFamily: "var(--font-display)" }}>UMKM di {wilayah}</p>
            <span className="shrink-0 text-xs text-[#9B9489]">{govStats.total} terdaftar</span>
          </div>
          <div className="mx-3 sm:mx-4 mb-4 bg-white border border-[#EEEBE4] rounded-2xl">
            <EmptyState icon={Layers} title="Belum ada data UMKM" desc="UMKM yang terdaftar di wilayah ini akan muncul di sini." />
          </div>
        </div>
      )}

      {tab === "daftar" && (
        <div className="p-4 pb-6"><AdminUmkmManager mode="government" /></div>
      )}

      {tab === "laporan" && (
        <div className="p-4 space-y-3 pb-6">
          {[
            { label: "Laporan Bulanan", desc: "Rekap aktivitas UMKM per bulan", icon: BarChart3 },
            { label: "Laporan Kategori", desc: "Distribusi berdasarkan jenis usaha", icon: Layers },
            { label: "Sebaran Kecamatan", desc: "Peta dan tabel per kecamatan", icon: MapPin },
          ].map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="bg-white border border-[#EEEBE4] rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#E5EEF8] flex items-center justify-center shrink-0"><Icon size={16} className="text-[#2E5B8A]" /></div>
                <div className="flex-1">
                  <p className="font-bold text-[#1A1714] text-sm" style={{ fontFamily: "var(--font-display)" }}>{r.label}</p>
                  <p className="text-xs text-[#9B9489]">{r.desc}</p>
                </div>
                <button className="text-xs font-bold text-[#2E5B8A] flex items-center gap-1 cursor-pointer shrink-0"><Download size={12} /> Unduh</button>
              </div>
            );
          })}
          <div className="bg-white border border-[#EEEBE4] rounded-2xl">
            <EmptyState icon={FileText} title="Belum ada laporan" desc="Laporan akan tersedia setelah ada data UMKM masuk." />
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

type AdminUmkm = {
  id: string; nama_usaha: string; no_whatsapp: string; kategori: string;
  deskripsi: string; alamat: string; latitude: number; longitude: number;
  status: "menunggu" | "aktif" | "ditolak";
};

const emptyAdminUmkm: Omit<AdminUmkm, "id"> = {
  nama_usaha: "", no_whatsapp: "", kategori: "Makanan & Minuman", deskripsi: "", alamat: "",
  latitude: KARANGWUNI_CENTER.lat, longitude: KARANGWUNI_CENTER.lng, status: "menunggu",
};

function AdminUmkmManager({ mode = "admin" }: { mode?: "admin" | "government" }) {
  const [items, setItems] = useState<AdminUmkm[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AdminUmkm, "id">>(emptyAdminUmkm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [managementEnabled, setManagementEnabled] = useState(true);

  const loadItems = async () => {
    if (!supabase) { setMessage("Supabase belum dikonfigurasi."); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("umkm").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as AdminUmkm[]);
    setMessage(error ? `Gagal memuat data: ${error.message}` : "");
    setLoading(false);
  };

  useEffect(() => { void loadItems(); }, []);
  useEffect(() => {
    if (mode === "government") supabase?.from("platform_settings").select("government_can_manage_umkm").eq("id", true).single()
      .then(({ data }) => data && setManagementEnabled(data.government_can_manage_umkm));
  }, [mode]);

  const openCreate = () => { if (!managementEnabled) return; setEditingId(null); setForm(emptyAdminUmkm); setDialogOpen(true); setMessage(""); };
  const openEdit = (item: AdminUmkm) => {
    if (!managementEnabled) return;
    const { id, ...values } = item;
    setEditingId(id); setForm(values); setDialogOpen(true); setMessage("");
  };
  const updateForm = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!supabase) return setMessage("Supabase belum dikonfigurasi.");
    if (!form.nama_usaha || !form.no_whatsapp || !form.alamat) return setMessage("Nama, WhatsApp, dan alamat wajib diisi.");
    const result = editingId
      ? await supabase.from("umkm").update(form).eq("id", editingId)
      : await supabase.from("umkm").insert(form);
    if (result.error) return setMessage(`Gagal menyimpan: ${result.error.message}`);
    setDialogOpen(false); setMessage(editingId ? "Data UMKM berhasil diperbarui." : "UMKM berhasil ditambahkan.");
    await loadItems();
  };

  const remove = async (item: AdminUmkm) => {
    if (!managementEnabled) return setMessage("Pengelolaan UMKM untuk pemerintah dinonaktifkan oleh admin platform.");
    if (!supabase || !window.confirm(`Hapus UMKM “${item.nama_usaha}”? Data tidak dapat dikembalikan.`)) return;
    const { error } = await supabase.from("umkm").delete().eq("id", item.id);
    setMessage(error ? `Gagal menghapus: ${error.message}` : "UMKM berhasil dihapus.");
    if (!error) await loadItems();
  };

  const filtered = items.filter((item) => `${item.nama_usaha} ${item.kategori} ${item.alamat}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9489]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari UMKM…" className="w-full rounded-xl border border-[#E4DFD8] bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none" />
        </div>
        <button disabled={!managementEnabled} onClick={openCreate} className="flex items-center gap-1.5 rounded-xl bg-[#6B3FA0] px-3.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Plus size={14} /> <span className="hidden sm:inline">Tambah</span></button>
      </div>
      {!managementEnabled && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Admin platform menonaktifkan fitur tambah, edit, dan hapus UMKM untuk pemerintah.</p>}
      {message && <p className="rounded-xl bg-[#F2EDF8] px-3 py-2 text-xs text-[#6B3FA0]">{message}</p>}
      <div className="space-y-2">
        {loading && <p className="py-8 text-center text-sm text-[#9B9489]">Memuat data UMKM…</p>}
        {!loading && filtered.length === 0 && <div className="rounded-2xl border border-[#EEEBE4] bg-white"><EmptyState icon={Store} title="Belum ada UMKM" desc="Tambahkan UMKM pertama melalui tombol Tambah." /></div>}
        {filtered.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[#EEEBE4] bg-white p-4 sm:flex sm:items-center sm:gap-4">
            <div className="mb-3 flex min-w-0 flex-1 items-start gap-3 sm:mb-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2EDF8]"><Store size={16} className="text-[#6B3FA0]" /></div>
              <div className="min-w-0"><p className="truncate text-sm font-bold text-[#1A1714]">{item.nama_usaha}</p><p className="text-xs text-[#9B9489]">{item.kategori} · {item.alamat}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.status === "aktif" ? "bg-[#D1F5E3] text-[#0F6B35]" : item.status === "ditolak" ? "bg-red-100 text-red-700" : "bg-[#FDE8D8] text-[#B84A12]"}`}>{item.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={!managementEnabled} onClick={() => openEdit(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#E4DFD8] px-3 py-2 text-xs font-bold text-[#6B3FA0] disabled:opacity-40"><Settings size={13} /> Edit</button>
              <button disabled={!managementEnabled} onClick={() => remove(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40"><X size={13} /> Hapus</button>
            </div>
          </div>
        ))}
      </div>
      {dialogOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && setDialogOpen(false)}>
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold text-[#1A1714]">{editingId ? "Edit UMKM" : "Tambah UMKM"}</h3><p className="text-xs text-[#9B9489]">Data lokasi dibatasi di Karangwuni, Wates.</p></div><button onClick={() => setDialogOpen(false)} className="rounded-xl p-2 text-[#9B9489]"><X size={18} /></button></div>
            <div className="space-y-3">
              <FInput label="Nama Usaha" placeholder="Nama usaha" value={form.nama_usaha} onChange={(v) => updateForm("nama_usaha", v)} />
              <FInput label="WhatsApp" placeholder="08xx…" value={form.no_whatsapp} onChange={(v) => updateForm("no_whatsapp", v)} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select value={form.kategori} onChange={(e) => updateForm("kategori", e.target.value)} className="rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] px-3 py-3 text-sm">{["Makanan & Minuman", "Kerajinan", "Fashion", "Pertanian", "Jasa"].map((v) => <option key={v}>{v}</option>)}</select>
                <select value={form.status} onChange={(e) => updateForm("status", e.target.value)} className="rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] px-3 py-3 text-sm"><option value="menunggu">Menunggu</option><option value="aktif">Aktif</option><option value="ditolak">Ditolak</option></select>
              </div>
              <FInput label="Alamat" placeholder="Alamat lengkap" value={form.alamat} onChange={(v) => updateForm("alamat", v)} />
              <textarea value={form.deskripsi} onChange={(e) => updateForm("deskripsi", e.target.value)} rows={2} placeholder="Deskripsi" className="w-full rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] px-4 py-3 text-sm" />
              <KarangwuniMap className="h-60 overflow-hidden rounded-xl" selectedLocation={{ lat: form.latitude, lng: form.longitude }} pickLocation={(lat, lng) => setForm((v) => ({ ...v, latitude: lat, longitude: lng }))} />
              <button onClick={save} className="w-full rounded-xl bg-[#6B3FA0] py-3 text-sm font-bold text-white">{editingId ? "Simpan Perubahan" : "Tambahkan UMKM"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminFeatureSettings() {
  const [settings, setSettings] = useState({ government_can_manage_umkm: true, owner_can_submit_umkm: true });
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase?.from("platform_settings").select("government_can_manage_umkm,owner_can_submit_umkm").eq("id", true).single()
      .then(({ data, error }) => {
        if (data) setSettings(data);
        if (error) setMessage(`Gagal memuat pengaturan: ${error.message}`);
      });
  }, []);

  const toggle = async (key: keyof typeof settings) => {
    if (!supabase) return setMessage("Supabase belum dikonfigurasi.");
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    const { error } = await supabase.from("platform_settings").update({ [key]: next[key], updated_at: new Date().toISOString() }).eq("id", true);
    if (error) { setSettings(settings); setMessage(`Gagal mengubah pengaturan: ${error.message}`); }
    else setMessage("Pengaturan fitur berhasil diperbarui.");
  };

  return (
    <div className="rounded-2xl border border-[#DED3EA] bg-[#FAF7FD] p-4">
      <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B3FA0] text-white"><Lock size={16} /></div><div><p className="text-sm font-bold text-[#1A1714]">Kontrol Khusus Admin</p><p className="text-xs text-[#9B9489]">Atur siapa yang boleh menambahkan dan mengelola UMKM.</p></div></div>
      <div className="space-y-2">
        {[
          { key: "government_can_manage_umkm" as const, label: "Pengelolaan oleh pemerintah", desc: "Izinkan pemerintah menambah, mengedit, dan menghapus UMKM." },
          { key: "owner_can_submit_umkm" as const, label: "Pendaftaran oleh pemilik UMKM", desc: "Izinkan pengguna UMKM mengirim data usaha baru." },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-3 rounded-xl bg-white p-3">
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2A2520]">{item.label}</p><p className="text-xs text-[#9B9489]">{item.desc}</p></div>
            <button type="button" role="switch" aria-checked={settings[item.key]} onClick={() => toggle(item.key)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings[item.key] ? "bg-[#1B6B4E]" : "bg-[#CFC8BE]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings[item.key] ? "left-6" : "left-1"}`} /></button>
          </div>
        ))}
      </div>
      {message && <p className="mt-3 text-xs text-[#6B3FA0]">{message}</p>}
    </div>
  );
}

type ContentSection = "menu" | "reports" | "moderation" | "announcements" | "system";

function AdminContentManager() {
  const [section, setSection] = useState<ContentSection>("menu");
  const [records, setRecords] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState({ title: "", content: "", audience: "semua" });
  const [system, setSystem] = useState({ platform_name: "UMKM Nusantara", maintenance_mode: false, support_contact: "" });

  const loadSection = async (next: ContentSection) => {
    setSection(next); setMessage(""); setRecords([]);
    if (!supabase || next === "menu") return;
    const table = next === "reports" ? "user_reports" : next === "moderation" ? "products" : next === "announcements" ? "announcements" : "platform_settings";
    const query = supabase.from(table).select("*");
    const { data, error } = table === "platform_settings" ? await query.eq("id", true).single() : await query.order("created_at", { ascending: false });
    if (error) return setMessage(`Gagal memuat: ${error.message}`);
    if (next === "system") setSystem(data as typeof system); else setRecords((data ?? []) as any[]);
  };

  const updateStatus = async (table: "user_reports" | "products", id: string, status: string) => {
    if (!supabase) return;
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) setMessage(`Gagal memperbarui: ${error.message}`); else await loadSection(table === "products" ? "moderation" : "reports");
  };

  const addAnnouncement = async () => {
    if (!supabase || !announcement.title || !announcement.content) return setMessage("Judul dan isi pengumuman wajib diisi.");
    const { error } = await supabase.from("announcements").insert(announcement);
    if (error) setMessage(`Gagal menambahkan: ${error.message}`); else { setAnnouncement({ title: "", content: "", audience: "semua" }); await loadSection("announcements"); }
  };

  const changeAnnouncement = async (item: any, action: "toggle" | "delete") => {
    if (!supabase) return;
    const result = action === "delete" ? await supabase.from("announcements").delete().eq("id", item.id) : await supabase.from("announcements").update({ active: !item.active }).eq("id", item.id);
    if (result.error) setMessage(result.error.message); else await loadSection("announcements");
  };

  const saveSystem = async () => {
    if (!supabase) return;
    const { error } = await supabase.from("platform_settings").update({ ...system, updated_at: new Date().toISOString() }).eq("id", true);
    setMessage(error ? `Gagal menyimpan: ${error.message}` : "Pengaturan sistem berhasil disimpan.");
  };

  if (section === "menu") return (
    <div className="space-y-3">
      <AdminFeatureSettings />
      {[
        { id: "reports" as const, label: "Laporan Pengguna", desc: "Tinjau dan tangani laporan masuk", icon: AlertCircle },
        { id: "moderation" as const, label: "Moderasi Produk", desc: "Setujui atau tolak produk yang diajukan", icon: Eye },
        { id: "announcements" as const, label: "Pengumuman", desc: "Kirim informasi ke UMKM dan pemerintah", icon: TrendingUp },
        { id: "system" as const, label: "Pengaturan Sistem", desc: "Identitas, maintenance, dan kontak bantuan", icon: Settings },
      ].map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => loadSection(item.id)} className="w-full rounded-2xl border border-[#EEEBE4] bg-white p-4 text-left flex items-center gap-4 hover:bg-[#FAFAF8]"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2EDF8]"><Icon size={16} className="text-[#6B3FA0]" /></div><div className="flex-1"><p className="text-sm font-bold text-[#1A1714]">{item.label}</p><p className="text-xs text-[#9B9489]">{item.desc}</p></div><span>›</span></button>; })}
    </div>
  );

  return (
    <div className="space-y-4">
      <button onClick={() => setSection("menu")} className="text-xs font-bold text-[#6B3FA0]">← Kembali ke Konten</button>
      <h2 className="text-lg font-bold text-[#1A1714]">{{ reports: "Laporan Pengguna", moderation: "Moderasi Produk", announcements: "Pengumuman", system: "Pengaturan Sistem", menu: "" }[section]}</h2>
      {message && <p className="rounded-xl bg-[#F2EDF8] px-3 py-2 text-xs text-[#6B3FA0]">{message}</p>}

      {section === "reports" && <div className="space-y-2">{records.length === 0 && <EmptyState icon={AlertCircle} title="Belum ada laporan" desc="Laporan pengguna akan muncul di sini." />}{records.map((item) => <div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold">{item.subject}</p><p className="text-xs text-[#9B9489]">{item.reporter_name} · {item.reporter_contact || "Tanpa kontak"}</p></div><Badge label={item.status} color={item.status === "selesai" ? "green" : item.status === "baru" ? "orange" : "gray"} /></div><p className="my-3 text-sm text-[#6B6558]">{item.description}</p><select value={item.status} onChange={(e) => updateStatus("user_reports", item.id, e.target.value)} className="rounded-xl border px-3 py-2 text-xs"><option value="baru">Baru</option><option value="diproses">Diproses</option><option value="selesai">Selesai</option><option value="ditolak">Ditolak</option></select></div>)}</div>}

      {section === "moderation" && <div className="space-y-2">{records.length === 0 && <EmptyState icon={Package} title="Tidak ada produk" desc="Produk yang perlu ditinjau akan muncul di sini." />}{records.map((item) => <div key={item.id} className="rounded-2xl border bg-white p-4"><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-[#9B9489]">Rp {Number(item.price).toLocaleString("id-ID")} · {item.status}</p><p className="my-2 text-sm text-[#6B6558]">{item.description}</p><div className="flex gap-2"><button onClick={() => updateStatus("products", item.id, "aktif")} className="rounded-xl bg-[#1B6B4E] px-3 py-2 text-xs font-bold text-white">Setujui</button><button onClick={() => updateStatus("products", item.id, "ditolak")} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">Tolak</button></div></div>)}</div>}

      {section === "announcements" && <><div className="space-y-3 rounded-2xl border bg-white p-4"><FInput label="Judul" placeholder="Judul pengumuman" value={announcement.title} onChange={(v) => setAnnouncement((x) => ({ ...x, title: v }))} /><textarea value={announcement.content} onChange={(e) => setAnnouncement((x) => ({ ...x, content: e.target.value }))} placeholder="Isi pengumuman" rows={3} className="w-full rounded-xl border bg-[#F8F5F0] p-3 text-sm" /><select value={announcement.audience} onChange={(e) => setAnnouncement((x) => ({ ...x, audience: e.target.value }))} className="w-full rounded-xl border p-3 text-sm"><option value="semua">Semua</option><option value="umkm">Pemilik UMKM</option><option value="pemerintah">Pemerintah</option></select><button onClick={addAnnouncement} className="w-full rounded-xl bg-[#6B3FA0] py-3 text-sm font-bold text-white">Terbitkan Pengumuman</button></div><div className="space-y-2">{records.map((item) => <div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between"><p className="text-sm font-bold">{item.title}</p><span className="text-xs">{item.active ? "Aktif" : "Nonaktif"}</span></div><p className="my-2 text-sm text-[#6B6558]">{item.content}</p><div className="flex gap-2"><button onClick={() => changeAnnouncement(item, "toggle")} className="rounded-xl border px-3 py-2 text-xs font-bold">{item.active ? "Nonaktifkan" : "Aktifkan"}</button><button onClick={() => changeAnnouncement(item, "delete")} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Hapus</button></div></div>)}</div></>}

      {section === "system" && <div className="space-y-4 rounded-2xl border bg-white p-4"><FInput label="Nama Platform" placeholder="Nama platform" value={system.platform_name} onChange={(v) => setSystem((x) => ({ ...x, platform_name: v }))} /><FInput label="Kontak Bantuan" placeholder="WhatsApp atau email" value={system.support_contact} onChange={(v) => setSystem((x) => ({ ...x, support_contact: v }))} /><label className="flex items-center justify-between rounded-xl bg-[#F8F5F0] p-3"><span><span className="block text-sm font-bold">Mode Maintenance</span><span className="text-xs text-[#9B9489]">Tandai platform sedang dalam pemeliharaan.</span></span><input type="checkbox" checked={system.maintenance_mode} onChange={(e) => setSystem((x) => ({ ...x, maintenance_mode: e.target.checked }))} className="h-5 w-5" /></label><button onClick={saveSystem} className="w-full rounded-xl bg-[#6B3FA0] py-3 text-sm font-bold text-white">Simpan Pengaturan</button></div>}
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("ringkasan");
  const tabs = [
    { id: "ringkasan" as const, icon: Home, label: "Ringkasan" },
    { id: "pengguna" as const, icon: Users, label: "Pengguna" },
    { id: "umkm" as const, icon: Store, label: "UMKM" },
    { id: "konten" as const, icon: FileText, label: "Konten" },
  ];
  const titles: Record<AdminTab, string> = { ringkasan: "Ringkasan Platform", pengguna: "Pengguna", umkm: "UMKM", konten: "Konten" };

  return (
    <AppShell tabs={tabs} active={tab} onTabChange={(id) => setTab(id as AdminTab)}
      title={titles[tab]} subtitle="Panel kontrol administrator" roleLabel="Admin Platform" accentColor="#6B3FA0"
      rightSlot={
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs bg-[#F2EDF8] text-[#6B3FA0] px-3 py-1.5 rounded-full font-bold">
            <Shield size={11} /> Admin
          </span>
          <button onClick={onLogout} className="w-9 h-9 rounded-xl border border-[#E8E3DA] bg-[#F8F5F0] flex items-center justify-center text-[#9B9489] hover:text-[#C0392B] transition-colors cursor-pointer">
            <LogOut size={15} />
          </button>
        </div>
      }>

      <div className="p-4 space-y-4 pb-6">
        {tab === "ringkasan" && (
          <>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <StatCard label="Pengguna" value={0} icon={Shield} color="bg-[#6B3FA0]" />
              <StatCard label="UMKM" value={0} icon={Store} color="bg-[#1B6B4E]" />
              <StatCard label="Produk" value={0} icon={Package} color="bg-[#C9511F]" />
              <StatCard label="Wilayah" value={0} icon={Building2} color="bg-[#2E5B8A]" />
            </div>
            <div className="bg-white border border-[#EEEBE4] rounded-2xl">
              <EmptyState icon={Clock} title="Belum ada aktivitas" desc="Log aktivitas sistem akan muncul di sini." />
            </div>
            <div className="space-y-2">
              {["Status API", "Status Database", "Notifikasi"].map((s) => (
                <div key={s} className="bg-white border border-[#EEEBE4] rounded-2xl p-3.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1A1714]">{s}</span>
                  <Badge label="Aktif" color="green" />
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "pengguna" && (
          <>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9489]" />
                <input placeholder="Cari pengguna…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E4DFD8] bg-white text-sm placeholder:text-[#B0A99E] focus:outline-none" />
              </div>
              <button className="px-3 py-2.5 rounded-xl border border-[#E4DFD8] bg-white text-[#6B6558] cursor-pointer"><Filter size={14} /></button>
              <button className="px-3 py-2.5 rounded-xl bg-[#6B3FA0] text-white cursor-pointer"><Plus size={14} /></button>
            </div>
            <div className="bg-white border border-[#EEEBE4] rounded-2xl">
              <EmptyState icon={Users} title="Belum ada pengguna" desc="Data akan muncul setelah ada pendaftaran." />
            </div>
          </>
        )}

        {tab === "umkm" && <AdminUmkmManager />}

        {tab === "konten" && (
          <AdminContentManager />
        )}
      </div>
    </AppShell>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("public");
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setAuthRole(user?.app_metadata?.role ?? user?.user_metadata?.role ?? null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthRole(user?.app_metadata?.role ?? user?.user_metadata?.role ?? null);
      setAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  const logout = async () => { await supabase?.auth.signOut(); setAuthRole(null); setView("public"); };
  if (!authReady) return <div className="flex h-[100dvh] items-center justify-center bg-[#F7F4EF] text-sm text-[#6B6558]">Memeriksa sesi…</div>;
  if (view === "public") return <PublicView onLogin={() => setView("login")} />;
  if (view === "login") return <LoginPage onBack={() => setView("public")} onSuccess={(r) => setView(r)} onRegister={() => setView("register")} />;
  if (view === "register") return <RegisterPage onBack={() => setView("login")} onSuccess={() => setView("login")} />;
  if (view === "umkm") return authRole === "umkm" ? <UmkmDashboard onLogout={logout} /> : <LoginPage onBack={() => setView("public")} onSuccess={(r) => setView(r)} onRegister={() => setView("register")} />;
  if (view === "pemerintah") return authRole === "government" ? <PemerintahDashboard onLogout={logout} /> : <LoginPage onBack={() => setView("public")} onSuccess={(r) => setView(r)} onRegister={() => setView("register")} />;
  if (view === "admin") return authRole === "admin" ? <AdminDashboard onLogout={logout} /> : <LoginPage onBack={() => setView("public")} onSuccess={(r) => setView(r)} onRegister={() => setView("register")} />;
  return null;
}
