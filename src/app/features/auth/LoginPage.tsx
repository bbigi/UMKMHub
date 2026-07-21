import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { BRANDING } from "../../../config/branding";
import { BrandLogo, TechnologyPartner, FInput } from "../../shared/components";
import {
  Store, Building2, Shield, MapPin, Search, LogOut,
  Plus, Package, BarChart3, FileText, Map, TrendingUp,
  CheckCircle, Clock, AlertCircle, ChevronDown, Filter,
  Download, Eye, Settings, Layers, ArrowRight, Lock,
  UserPlus, Phone, Mail, User, LogIn, X, Home,
  ShoppingBag, Star, SlidersHorizontal, Navigation2,
  Zap, Users, Globe,
} from "lucide-react";


export function LoginPage({ onBack, onSuccess, onRegister }: {
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
  const [publicStats, setPublicStats] = useState({ umkm: 0, products: 0 });

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("umkm").select("id", { count: "exact", head: true }).eq("status", "aktif"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "aktif"),
    ]).then(([umkm, products]) => setPublicStats({ umkm: umkm.count ?? 0, products: products.count ?? 0 }));
  }, []);

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
    // Admin and government roles must come from trusted app_metadata. A public
    // signup can only claim the non-privileged UMKM role in user_metadata.
    const trustedRole = data.user.app_metadata?.role;
    const role = trustedRole === "admin" || trustedRole === "government"
      ? trustedRole
      : data.user.user_metadata?.role === "umkm" ? "umkm" : null;
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
          <button onClick={logoClick} aria-label="Logo platform" className="cursor-pointer"><BrandLogo inverse /></button>
          <button onClick={onBack} aria-label="Tutup halaman masuk" className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white/70 hover:bg-white/25 transition-colors cursor-pointer">
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
          {[{ n: publicStats.umkm, l: "UMKM Aktif" }, { n: publicStats.products, l: "Produk Aktif" }].map((s) => (
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
