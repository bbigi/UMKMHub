import { useEffect, useMemo, useState } from "react";
import { BRANDING } from "../../config/branding";
import { supabase } from "../../lib/supabase";
import type { UmkmMarker } from "../components/KarangwuniMap";
import { filterBusinesses, filterProducts } from "../lib/catalog";
import { BrandLogo, TechnologyPartner, MapCanvas, Badge, EmptyState } from "../shared/components";
import {
  Store, Building2, Shield, MapPin, Search, LogOut,
  Plus, Package, BarChart3, FileText, Map, TrendingUp,
  CheckCircle, Clock, AlertCircle, ChevronDown, Filter,
  Download, Eye, Settings, Layers, ArrowRight, Lock,
  UserPlus, Phone, Mail, User, LogIn, X, Home,
  ShoppingBag, Star, SlidersHorizontal, Navigation2,
  Zap, Users, Globe,
} from "lucide-react";


export function PublicView({ onLogin }: { onLogin: () => void }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [businesses, setBusinesses] = useState<UmkmMarker[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; description: string; price: number; image_url: string | null; umkm: { nama_usaha: string; kategori: string } | null }[]>([]);
  const [productLoadError, setProductLoadError] = useState("");
  const filters = ["Semua", "Makanan", "Kerajinan", "Fashion", "Pertanian", "Jasa"];
  const filteredBusinesses = useMemo(() => filterBusinesses(businesses, query, activeFilter), [activeFilter, businesses, query]);
  const filteredProducts = useMemo(() => filterProducts(products, query, activeFilter), [activeFilter, products, query]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("products").select("id,name,description,price,image_url,umkm:umkm_id(nama_usaha,kategori)").eq("status", "aktif").order("created_at", { ascending: false })
      .then(({ data, error }) => { setProducts((data ?? []) as unknown as typeof products); setProductLoadError(error ? "Produk belum dapat dimuat. Coba muat ulang halaman." : ""); });
  }, []);

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
              placeholder="Cari nama atau alamat UMKM..."
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
            <span className="text-xs text-[#9B9489]">{filteredBusinesses.length} ditemukan</span>
          </div>
          {filteredBusinesses.length === 0 ? <EmptyState icon={MapPin} title="Belum ada UMKM" desc="Coba kata kunci atau kategori lain." /> : <div className="space-y-2 px-4 pb-4">{filteredBusinesses.map((item) => <article key={item.id} className="rounded-2xl border border-[#EEEBE4] p-3"><p className="text-sm font-bold text-[#2A2520]">{item.nama_usaha}</p><p className="text-xs text-[#1B6B4E]">{item.kategori}</p><p className="mt-1 text-xs text-[#9B9489]">{item.alamat}</p></article>)}</div>}
          {productLoadError && <p className="mx-4 mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{productLoadError}</p>}
          {filteredProducts.length > 0 && <section className="border-t border-[#EEEBE4] px-4 py-4"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-extrabold">Produk Aktif</h2><span className="text-xs text-[#9B9489]">{filteredProducts.length} produk</span></div><div className="space-y-2">{filteredProducts.map((item) => <article key={item.id} className="rounded-2xl bg-[#F8F5F0] p-3">{item.image_url && <img src={item.image_url} alt={item.name} className="mb-2 h-28 w-full rounded-xl object-cover" loading="lazy" />}<p className="text-sm font-bold">{item.name}</p><p className="text-xs font-semibold text-[#1B6B4E]">Rp {Number(item.price).toLocaleString("id-ID")}</p><p className="mt-1 text-xs text-[#9B9489]">{item.umkm?.nama_usaha ?? "UMKM"}</p></article>)}</div></section>}
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
        <MapCanvas className="absolute inset-0 w-full h-full" query={query} category={activeFilter} onMarkersChange={setBusinesses} />

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
              <p className="text-xs text-[#9B9489]">{filteredBusinesses.length} ditemukan di sekitar Anda</p>
            </div>
            <span className="text-xs font-semibold text-[#1B6B4E]">{filteredBusinesses.length} hasil</span>
          </div>
          {filteredBusinesses.length === 0 ? <div className="flex items-center gap-3 px-4 py-3 text-left">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F0EDE7] flex items-center justify-center"><MapPin size={18} className="text-[#B0A99E]" /></div>
            <div><p className="font-bold text-[#2A2520] text-sm">Belum ada UMKM</p><p className="text-[#9B9489] text-xs">UMKM lokal akan muncul di sini.</p></div>
          </div> : <div className="flex gap-3 overflow-x-auto px-4 py-3">{filteredBusinesses.map((item) => <article key={item.id} className="min-w-52 rounded-2xl border p-3"><p className="truncate text-sm font-bold">{item.nama_usaha}</p><p className="text-xs text-[#1B6B4E]">{item.kategori}</p><p className="truncate text-xs text-[#9B9489]">{item.alamat}</p></article>)}</div>}
          {filteredProducts.length > 0 && <div className="flex gap-3 overflow-x-auto border-t px-4 py-3">{filteredProducts.map((item) => <article key={item.id} className="min-w-48 rounded-2xl bg-[#F8F5F0] p-3">{item.image_url && <img src={item.image_url} alt="" className="mb-2 h-20 w-full rounded-xl object-cover" loading="lazy" />}<p className="truncate text-sm font-bold">{item.name}</p><p className="text-xs text-[#1B6B4E]">Rp {Number(item.price).toLocaleString("id-ID")}</p><p className="truncate text-xs text-[#9B9489]">{item.umkm?.nama_usaha ?? "UMKM"}</p></article>)}</div>}
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
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
