import { useEffect, useState } from "react";
import { KarangwuniMap, type UmkmMarker } from "../components/KarangwuniMap";
import { supabase } from "../../lib/supabase";
import { BRANDING } from "../../config/branding";
import { usePlatformSettings } from "../context/PlatformSettingsContext";
import {
  Store, Building2, Shield, MapPin, Search, LogOut,
  Plus, Package, BarChart3, FileText, Map, TrendingUp,
  CheckCircle, Clock, AlertCircle, ChevronDown, Filter,
  Download, Eye, Settings, Layers, ArrowRight, Lock,
  UserPlus, Phone, Mail, User, LogIn, X, Home,
  ShoppingBag, Star, SlidersHorizontal, Navigation2,
  Zap, Users, Globe,
} from "lucide-react";


export function BrandLogo({ compact = false, inverse = false, showName = true }: { compact?: boolean; inverse?: boolean; showName?: boolean }) {
  const [failed, setFailed] = useState(false);
  const { platformName } = usePlatformSettings();
  return <div className="flex min-w-0 items-center gap-2.5">
    <div className={`${compact ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl"} flex shrink-0 items-center justify-center overflow-hidden ${!failed ? "bg-white" : inverse ? "bg-white/20" : "bg-[#1B6B4E]"}`}>
      {!failed ? <img src={BRANDING.platformLogo} alt={`Logo ${platformName}`} onError={() => setFailed(true)} className="h-full w-full object-contain p-0.5" /> : <Store size={compact ? 14 : 18} className="text-white" />}
    </div>
    {showName && <div className="min-w-0"><p className={`truncate font-extrabold ${compact ? "text-sm" : "text-base"} ${inverse ? "text-white" : "text-[#1A1714]"}`} style={{ fontFamily: "var(--font-display)" }}>{platformName}</p>{!compact && <p className={`text-[10px] ${inverse ? "text-[#8ECFB4]" : "text-[#9B9489]"}`}>{BRANDING.platformTagline}</p>}</div>}
  </div>;
}

export function TechnologyPartner({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className={`flex items-center gap-2 ${compact ? "text-[9px]" : "text-[10px]"}`}>
    {!failed && <a href={BRANDING.partnerUrl} target="_blank" rel="noopener noreferrer" aria-label={`Kunjungi website ${BRANDING.partnerName}`} className={`flex items-center rounded-lg bg-white transition-opacity hover:opacity-80 ${compact ? "h-6 px-1" : "h-9 px-2"}`}><img src={BRANDING.partnerLogo} alt={`Logo ${BRANDING.partnerName}`} onError={() => setFailed(true)} className={`${compact ? "h-4 max-w-20" : "h-6 max-w-28"} object-contain`} /></a>}
    <div><p className={inverse ? "text-white/55" : "text-[#9B9489]"}>{BRANDING.partnerLabel}</p><p className={`font-bold ${inverse ? "text-white" : "text-[#2A2520]"}`}>{BRANDING.partnerName}</p></div>
  </div>;
}

export function AnnouncementBanner({ audience }: { audience: "umkm" | "pemerintah" }) {
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string }[]>([]);
  useEffect(() => {
    supabase?.from("announcements").select("id,title,content").eq("active", true).in("audience", ["semua", audience]).order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => setAnnouncements(data ?? []));
  }, [audience]);
  if (!announcements.length) return null;
  return <div className="space-y-2">{announcements.map((item) => <div key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-bold text-amber-900">{item.title}</p><p className="mt-0.5 text-xs text-amber-700">{item.content}</p></div>)}</div>;
}

export function ReportIssueButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reporter_name: "", reporter_contact: "", subject: "", description: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!supabase || form.subject.trim().length < 3 || form.description.trim().length < 10) return setMessage("Subjek minimal 3 karakter dan isi laporan minimal 10 karakter.");
    setSubmitting(true);
    const { error } = await supabase.from("user_reports").insert({ ...form, reporter_name: form.reporter_name || "Anonim" });
    if (error) setMessage(`Gagal mengirim: ${error.message}`); else { setMessage("Laporan berhasil dikirim."); setForm({ reporter_name: "", reporter_contact: "", subject: "", description: "" }); }
    setSubmitting(false);
  };
  return <><button onClick={() => setOpen(true)} className="report-issue-button fixed z-[1500] rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#6B3FA0] shadow-lg border"><AlertCircle size={14} className="inline mr-1" /> Laporkan masalah</button>{open && <div className="fixed inset-0 z-[2500] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"><div role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full rounded-t-3xl bg-white p-5 sm:max-w-md sm:rounded-3xl"><div className="mb-4 flex justify-between"><h3 id="report-title" className="font-bold">Laporan Pengguna</h3><button aria-label="Tutup laporan" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="space-y-3"><FInput label="Nama (opsional)" placeholder="Nama Anda" value={form.reporter_name} onChange={(v) => setForm((x) => ({ ...x, reporter_name: v }))} /><FInput label="Kontak (opsional)" placeholder="Email / WhatsApp" value={form.reporter_contact} onChange={(v) => setForm((x) => ({ ...x, reporter_contact: v }))} /><FInput label="Subjek" placeholder="Masalah yang dilaporkan" value={form.subject} onChange={(v) => setForm((x) => ({ ...x, subject: v }))} /><textarea rows={4} maxLength={4000} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} placeholder="Jelaskan masalah…" className="w-full rounded-xl border bg-[#F8F5F0] p-3 text-sm" />{message && <p className="text-xs text-[#6B3FA0]">{message}</p>}<button disabled={submitting} onClick={submit} className="w-full rounded-xl bg-[#6B3FA0] py-3 text-sm font-bold text-white disabled:opacity-50">{submitting ? "Mengirim..." : "Kirim Laporan"}</button></div></div></div>}</>;
}

// ─── MAP CANVAS ───────────────────────────────────────────────────────────────

export function MapCanvas({ className = "", query = "", category = "Semua", onMarkersChange, focusBusinessId, focusBusinessKey }: { className?: string; query?: string; category?: string; onMarkersChange?: (items: UmkmMarker[]) => void; focusBusinessId?: string | null; focusBusinessKey?: number }) {
  return <KarangwuniMap className={className} mobilePanelOffset query={query} category={category} onMarkersChange={onMarkersChange} focusBusinessId={focusBusinessId} focusBusinessKey={focusBusinessKey} />;
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, desc, action, onAction }: {
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

export function StatCard({ label, value, icon: Icon, color, className = "" }: {
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

export function Badge({ label, color }: { label: string; color: "green" | "orange" | "blue" | "gray" }) {
  const s = { green: "bg-[#D1F5E3] text-[#0F6B35]", orange: "bg-[#FDE8D8] text-[#B84A12]", blue: "bg-[#DDE8F5] text-[#1E4D8A]", gray: "bg-[#EEEBE4] text-[#6B6558]" };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase ${s[color]}`} style={{ fontFamily: "var(--font-mono)" }}>{label}</span>;
}

// ─── FORM INPUT ───────────────────────────────────────────────────────────────

export function FInput({ label, icon: Icon, type = "text", placeholder, value, onChange }: {
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
