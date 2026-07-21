import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { KarangwuniMap, KARANGWUNI_CENTER } from "../../components/KarangwuniMap";
import { AppShell } from "../../layouts/AppShell";
import { AnnouncementBanner, ReportIssueButton, StatCard, EmptyState, FInput, MapCanvas, Badge } from "../../shared/components";
import {
  Store, Building2, Shield, MapPin, Search, LogOut,
  Plus, Package, BarChart3, FileText, Map, TrendingUp,
  CheckCircle, Clock, AlertCircle, ChevronDown, Filter,
  Download, Eye, Settings, Layers, ArrowRight, Lock,
  UserPlus, Phone, Mail, User, LogIn, X, Home,
  ShoppingBag, Star, SlidersHorizontal, Navigation2,
  Zap, Users, Globe,
} from "lucide-react";

type UmkmTab = "beranda" | "profil" | "produk";
type Product = { id: string; name: string; description: string; price: number; image_url: string | null; status: string };


export function UmkmDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<UmkmTab>("beranda");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState({ nama_usaha: "", no_whatsapp: "", kategori: "", deskripsi: "", alamat: "" });
  const [location, setLocation] = useState(KARANGWUNI_CENTER);
  const [saveStatus, setSaveStatus] = useState("");
  const [ownerSubmissionEnabled, setOwnerSubmissionEnabled] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", description: "", price: "", image_url: "" });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productMessage, setProductMessage] = useState("");
  useEffect(() => {
    supabase?.from("platform_settings").select("owner_can_submit_umkm").eq("id", true).single()
      .then(({ data }) => data && setOwnerSubmissionEnabled(data.owner_can_submit_umkm));
    supabase?.auth.getUser().then(async ({ data }) => {
      if (!data.user || !supabase) return;
      const { data: business } = await supabase.from("umkm").select("id,nama_usaha,no_whatsapp,kategori,deskripsi,alamat,latitude,longitude").eq("owner_id", data.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (business) {
        setProfileId(business.id);
        setProfile({ nama_usaha: business.nama_usaha, no_whatsapp: business.no_whatsapp, kategori: business.kategori, deskripsi: business.deskripsi, alamat: business.alamat });
        setLocation({ lat: business.latitude, lng: business.longitude });
      } else {
        const metadata = data.user.user_metadata;
        setProfile({ nama_usaha: metadata.nama_usaha ?? "", no_whatsapp: metadata.phone ?? "", kategori: metadata.kategori ?? "", deskripsi: metadata.deskripsi ?? "", alamat: metadata.alamat ?? "" });
      }
    });
  }, []);
  useEffect(() => {
    if (!supabase || !profileId) return;
    supabase.from("products").select("id,name,description,price,image_url,status").eq("umkm_id", profileId).order("created_at", { ascending: false })
      .then(({ data }) => setProducts((data ?? []) as Product[]));
  }, [profileId]);
  const updateProfile = (key: keyof typeof profile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const saveProfile = async () => {
    if (!ownerSubmissionEnabled) return setSaveStatus("Pendaftaran UMKM sedang dinonaktifkan oleh admin platform.");
    if (!supabase) return setSaveStatus("Supabase belum dikonfigurasi di file .env");
    if (!profile.nama_usaha || !profile.no_whatsapp || !profile.kategori || !profile.alamat) return setSaveStatus("Lengkapi semua kolom wajib.");
    setSaveStatus("Menyimpan...");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return setSaveStatus("Sesi berakhir. Silakan masuk kembali.");
    const payload = { ...profile, latitude: location.lat, longitude: location.lng, owner_id: userData.user.id };
    const result = profileId
      ? await supabase.from("umkm").update(payload).eq("id", profileId).select("id").single()
      : await supabase.from("umkm").insert(payload).select("id").single();
    if (result.data?.id) setProfileId(result.data.id);
    setSaveStatus(result.error ? `Gagal: ${result.error.message}` : "Profil berhasil disimpan dan menunggu verifikasi admin.");
  };
  const saveProduct = async () => {
    if (!supabase || !profileId) return setProductMessage("Simpan profil usaha terlebih dahulu.");
    const price = Number(productForm.price);
    if (!productForm.name.trim() || !Number.isFinite(price) || price < 0) return setProductMessage("Nama dan harga produk wajib valid.");
    if (productForm.image_url && !/^https?:\/\//i.test(productForm.image_url)) return setProductMessage("URL gambar harus diawali http:// atau https://.");
    const payload = { umkm_id: profileId, name: productForm.name.trim(), description: productForm.description.trim(), price, image_url: productForm.image_url.trim() || null };
    const { data, error } = editingProductId
      ? await supabase.from("products").update(payload).eq("id", editingProductId).select("id,name,description,price,image_url,status").single()
      : await supabase.from("products").insert({ ...payload, status: "menunggu" }).select("id,name,description,price,image_url,status").single();
    if (error) return setProductMessage(`Gagal: ${error.message}`);
    setProducts((current) => editingProductId ? current.map((item) => item.id === editingProductId ? data as Product : item) : [data as Product, ...current]);
    setProductForm({ name: "", description: "", price: "", image_url: "" }); setEditingProductId(null); setProductFormOpen(false); setProductMessage(editingProductId ? "Produk berhasil diperbarui." : "Produk dikirim untuk ditinjau admin.");
  };
  const editProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({ name: product.name, description: product.description, price: String(product.price), image_url: product.image_url ?? "" });
    setProductMessage(""); setProductFormOpen(true);
  };
  const removeProduct = async (id: string) => {
    if (!supabase || !window.confirm("Hapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return setProductMessage(`Gagal: ${error.message}`);
    setProducts((current) => current.filter((item) => item.id !== id));
  };
  const tabs = [
    { id: "beranda" as const, icon: Home, label: "Beranda" },
    { id: "profil" as const, icon: Store, label: "Toko" },
    { id: "produk" as const, icon: Package, label: "Produk" },
  ];
  const titles: Record<UmkmTab, string> = { beranda: "Beranda", profil: "Profil Toko", produk: "Produk Saya" };

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
              <StatCard label="Total Produk" value={products.length} icon={Package} color="bg-[#1B6B4E]" />
              <StatCard label="Aktif" value={products.filter((item) => item.status === "aktif").length} icon={CheckCircle} color="bg-[#2E5B8A]" />
              <StatCard label="Menunggu" value={products.filter((item) => item.status === "menunggu").length} icon={Clock} color="bg-[#C9511F]" />
              <StatCard label="Ditolak" value={products.filter((item) => item.status === "ditolak").length} icon={AlertCircle} color="bg-[#8D5A2B]" />
            </div>

            <div className="bg-white border border-[#EEEBE4] rounded-2xl p-4">
              <p className="font-bold text-[#1A1714] text-sm mb-3" style={{ fontFamily: "var(--font-display)" }}>Langkah Memulai</p>
              {[
                { n: 1, label: "Lengkapi profil dan data usaha", to: "profil" as UmkmTab },
                { n: 2, label: "Tambah produk pertama Anda", to: "produk" as UmkmTab },
                { n: 3, label: "Pastikan lokasi toko sudah tepat", to: "profil" as UmkmTab },
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
            <button onClick={() => { setEditingProductId(null); setProductForm({ name: "", description: "", price: "", image_url: "" }); setProductFormOpen((open) => !open); }} className="w-full flex items-center justify-center gap-2 bg-[#1B6B4E] text-white font-bold text-sm py-3.5 rounded-2xl hover:bg-[#155a3f] transition-colors cursor-pointer">
              <Plus size={14} /> Tambah Produk Baru
            </button>
            {productFormOpen && <div className="space-y-3 rounded-2xl border border-[#EEEBE4] bg-white p-4"><p className="text-sm font-bold">{editingProductId ? "Edit Produk" : "Produk Baru"}</p><FInput label="Nama Produk" placeholder="Nama produk" value={productForm.name} onChange={(name) => setProductForm((form) => ({ ...form, name }))} /><FInput label="Harga" type="number" placeholder="0" value={productForm.price} onChange={(price) => setProductForm((form) => ({ ...form, price }))} /><FInput label="URL Gambar" type="url" placeholder="https://..." value={productForm.image_url} onChange={(image_url) => setProductForm((form) => ({ ...form, image_url }))} /><textarea value={productForm.description} onChange={(event) => setProductForm((form) => ({ ...form, description: event.target.value }))} rows={3} placeholder="Deskripsi produk" className="w-full rounded-xl border bg-[#F8F5F0] p-3 text-sm" /><button onClick={saveProduct} className="w-full rounded-xl bg-[#1B6B4E] py-3 text-sm font-bold text-white">{editingProductId ? "Simpan Perubahan" : "Simpan Produk"}</button></div>}
            {productMessage && <p className="rounded-xl bg-[#F0EDE7] px-3 py-2 text-xs text-[#6B6558]">{productMessage}</p>}
            <div className="space-y-2">{products.length === 0 ? <div className="bg-white border border-[#EEEBE4] rounded-2xl"><EmptyState icon={Package} title="Belum ada produk" desc="Tambahkan produk agar muncul di peta dan hasil pencarian pembeli." /></div> : products.map((product) => <article key={product.id} className="rounded-2xl border border-[#EEEBE4] bg-white p-4">{product.image_url && <img src={product.image_url} alt={product.name} className="mb-3 h-36 w-full rounded-xl object-cover" loading="lazy" />}<div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{product.name}</p><p className="text-xs text-[#1B6B4E]">Rp {Number(product.price).toLocaleString("id-ID")}</p></div><Badge label={product.status} color={product.status === "aktif" ? "green" : product.status === "ditolak" ? "orange" : "gray"} /></div><p className="mt-2 text-xs text-[#6B6558]">{product.description || "Tanpa deskripsi"}</p><div className="mt-3 flex gap-3"><button onClick={() => editProduct(product)} className="text-xs font-bold text-[#1B6B4E]">Edit</button><button onClick={() => removeProduct(product.id)} className="text-xs font-bold text-red-600">Hapus</button></div></article>)}</div>
          </>
        )}

      </div>
    </AppShell>
  );
}

// ─── PEMERINTAH DASHBOARD ─────────────────────────────────────────────────────
