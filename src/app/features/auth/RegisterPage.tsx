import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { BrandLogo, FInput, TechnologyPartner } from "../../shared/components";
import {
  Store, Building2, Shield, MapPin, Search, LogOut,
  Plus, Package, BarChart3, FileText, Map, TrendingUp,
  CheckCircle, Clock, AlertCircle, ChevronDown, Filter,
  Download, Eye, Settings, Layers, ArrowRight, Lock,
  UserPlus, Phone, Mail, User, LogIn, X, Home,
  ShoppingBag, Star, SlidersHorizontal, Navigation2,
  Zap, Users, Globe,
} from "lucide-react";


export function RegisterPage({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ nama: "", hp: "", email: "", pass: "", usaha: "", kategori: "", desk: "", kota: "" });
  const [registerMessage, setRegisterMessage] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const upd = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const kategoriList = ["Makanan & Minuman", "Kerajinan", "Fashion", "Pertanian", "Jasa"];
  useEffect(() => {
    supabase?.from("platform_settings").select("owner_can_submit_umkm").eq("id", true).maybeSingle()
      .then(({ data }) => setRegistrationEnabled(data?.owner_can_submit_umkm ?? false));
  }, []);
  const register = async () => {
    if (!registrationEnabled) return setRegisterMessage("Pendaftaran UMKM sedang dinonaktifkan oleh admin platform.");
    if (!supabase) return setRegisterMessage("Supabase belum dikonfigurasi.");
    if (!f.nama || !f.hp || !f.email || !f.usaha || !f.kategori || !f.kota || f.pass.length < 8) return setRegisterMessage("Lengkapi semua data wajib dan gunakan kata sandi minimal 8 karakter.");
    setRegistering(true); setRegisterMessage("");
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.pass,
      options: { data: { role: "umkm", nama: f.nama, phone: f.hp, nama_usaha: f.usaha, kategori: f.kategori, deskripsi: f.desk, alamat: f.kota } },
    });
    setRegistering(false);
    if (error) return setRegisterMessage(`Pendaftaran gagal: ${error.message}`);
    if (!data.user) return setRegisterMessage("Pendaftaran gagal: akun tidak berhasil dibuat di Supabase Auth.");
    if (data.user.identities?.length === 0) return setRegisterMessage("Email tersebut sudah terdaftar. Silakan masuk atau gunakan email lain.");
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
                <button onClick={() => {
                  if (!f.nama || !f.hp || !f.email || f.pass.length < 8) return setRegisterMessage("Lengkapi identitas dan gunakan kata sandi minimal 8 karakter.");
                  setRegisterMessage(""); setStep(2);
                }}
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
                <FInput label="Alamat Usaha di Karangwuni" placeholder="Contoh: RT 02, Karangwuni, Wates" value={f.kota} onChange={(v) => upd("kota", v)} />
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setStep(1)} className="flex-1 border border-[#E0DCD5] text-[#1A1714] font-bold text-sm py-3.5 rounded-xl hover:bg-[#F0EDE7] transition-colors cursor-pointer">← Kembali</button>
                  <button onClick={register} disabled={registering || !registrationEnabled} className="flex-[2] bg-[#1B6B4E] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-[#155a3f] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                    <UserPlus size={14} /> {registering ? "Mendaftarkan…" : "Daftar Sekarang"}
                  </button>
                </div>
                {registerMessage && <p className="rounded-xl bg-[#F0EDE7] px-3 py-2 text-xs text-[#6B6558]">{registerMessage}</p>}
                {!registrationEnabled && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">Pendaftaran baru sedang ditutup oleh admin.</p>}
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
