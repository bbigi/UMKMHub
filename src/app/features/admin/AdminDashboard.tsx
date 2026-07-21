
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { KarangwuniMap, KARANGWUNI_CENTER } from "../../components/KarangwuniMap";
import { AppShell } from "../../layouts/AppShell";
import { EmptyState, StatCard, Badge, FInput } from "../../shared/components";
import {
  Store, Building2, Shield, MapPin, Search, LogOut,
  Plus, Package, BarChart3, FileText, Map, TrendingUp,
  CheckCircle, Clock, AlertCircle, ChevronDown, Filter,
  Download, Eye, Settings, Layers, ArrowRight, Lock,
  UserPlus, Phone, Mail, User, LogIn, X, Home,
  ShoppingBag, Star, SlidersHorizontal, Navigation2,
  Zap, Users, Globe,
} from "lucide-react";

type AdminTab = "ringkasan" | "umkm" | "konten";


type AdminUmkm = {
  id: string; nama_usaha: string; no_whatsapp: string; kategori: string;
  deskripsi: string; alamat: string; latitude: number; longitude: number;
  owner_id: string | null;
  status: "menunggu" | "aktif" | "ditolak";
};
type OwnerAccount = { id: string; email: string; display_name: string };

const emptyAdminUmkm: Omit<AdminUmkm, "id"> = {
  nama_usaha: "", no_whatsapp: "", kategori: "Makanan & Minuman", deskripsi: "", alamat: "",
  latitude: KARANGWUNI_CENTER.lat, longitude: KARANGWUNI_CENTER.lng, owner_id: null, status: "menunggu",
};

export function AdminUmkmManager({ mode = "admin" }: { mode?: "admin" | "government" }) {
  const [items, setItems] = useState<AdminUmkm[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AdminUmkm, "id">>(emptyAdminUmkm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [managementEnabled, setManagementEnabled] = useState(true);
  const [owners, setOwners] = useState<OwnerAccount[]>([]);

  const loadItems = async () => {
    if (!supabase) { setMessage("Supabase belum dikonfigurasi."); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("umkm").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as AdminUmkm[]);
    setMessage(error ? `Gagal memuat data: ${error.message}` : "");
    setLoading(false);
  };

  useEffect(() => {
    void loadItems();
    if (mode === "admin") supabase?.rpc("admin_list_umkm_owners").then(({ data, error }) => {
      if (data) setOwners(data as OwnerAccount[]);
      if (error) setMessage(`Daftar akun pemilik belum dapat dimuat: ${error.message}`);
    });
  }, [mode]);
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
  const updateForm = (key: keyof typeof form, value: string | number | null) => setForm((current) => ({ ...current, [key]: value }));

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
              <div className="min-w-0"><p className="truncate text-sm font-bold text-[#1A1714]">{item.nama_usaha}</p><p className="text-xs text-[#9B9489]">{item.kategori} · {item.alamat}</p><p className="mt-0.5 text-[10px] text-[#9B9489]">{item.owner_id ? "Sudah terkait akun" : "Belum terkait akun pemilik"}</p>
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
              {mode === "admin" && <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#6B6558]">Akun Pemilik</label><select value={form.owner_id ?? ""} onChange={(e) => updateForm("owner_id", e.target.value || null)} className="w-full rounded-xl border border-[#E4DFD8] bg-[#F8F5F0] px-3 py-3 text-sm"><option value="">Belum dikaitkan</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.display_name} — {owner.email}</option>)}</select><p className="mt-1 text-[11px] text-[#9B9489]">Gunakan ini untuk mengaitkan data UMKM lama dengan akun pemilik.</p></div>}
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
type AdminContentRecord = { id: string; subject?: string; reporter_name?: string; reporter_contact?: string; description?: string; status?: string; name?: string; price?: number; image_url?: string | null; title?: string; content?: string; active?: boolean };

function AdminContentManager() {
  const [section, setSection] = useState<ContentSection>("menu");
  const [records, setRecords] = useState<AdminContentRecord[]>([]);
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
    if (next === "system") setSystem(data as typeof system); else setRecords((data ?? []) as AdminContentRecord[]);
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

  const changeAnnouncement = async (item: AdminContentRecord, action: "toggle" | "delete") => {
    if (!supabase) return;
    const result = action === "delete" ? await supabase.from("announcements").delete().eq("id", item.id) : await supabase.from("announcements").update({ active: !item.active }).eq("id", item.id);
    if (result.error) setMessage(result.error.message); else await loadSection("announcements");
  };

  const saveSystem = async () => {
    if (!supabase) return;
    const { error } = await supabase.from("platform_settings").update({ ...system, updated_at: new Date().toISOString() }).eq("id", true);
    setMessage(error ? `Gagal menyimpan: ${error.message}` : "Pengaturan sistem berhasil disimpan.");
    if (!error) window.dispatchEvent(new CustomEvent("platform-settings-updated", { detail: system }));
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

      {section === "reports" && <div className="space-y-2">{records.length === 0 && <EmptyState icon={AlertCircle} title="Belum ada laporan" desc="Laporan pengguna akan muncul di sini." />}{records.map((item) => <div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold">{item.subject}</p><p className="text-xs text-[#9B9489]">{item.reporter_name} · {item.reporter_contact || "Tanpa kontak"}</p></div><Badge label={item.status ?? "baru"} color={item.status === "selesai" ? "green" : item.status === "baru" ? "orange" : "gray"} /></div><p className="my-3 text-sm text-[#6B6558]">{item.description}</p><select value={item.status} onChange={(e) => updateStatus("user_reports", item.id, e.target.value)} className="rounded-xl border px-3 py-2 text-xs"><option value="baru">Baru</option><option value="diproses">Diproses</option><option value="selesai">Selesai</option><option value="ditolak">Ditolak</option></select></div>)}</div>}

      {section === "moderation" && <div className="space-y-2">{records.length === 0 && <EmptyState icon={Package} title="Tidak ada produk" desc="Produk yang perlu ditinjau akan muncul di sini." />}{records.map((item) => <div key={item.id} className="rounded-2xl border bg-white p-4">{item.image_url && <img src={item.image_url} alt={item.name ?? "Produk"} className="mb-3 h-40 w-full rounded-xl object-cover" loading="lazy" />}<p className="text-sm font-bold">{item.name}</p><p className="text-xs text-[#9B9489]">Rp {Number(item.price).toLocaleString("id-ID")} · {item.status}</p><p className="my-2 text-sm text-[#6B6558]">{item.description}</p><div className="flex gap-2"><button onClick={() => updateStatus("products", item.id, "aktif")} className="rounded-xl bg-[#1B6B4E] px-3 py-2 text-xs font-bold text-white">Setujui</button><button onClick={() => updateStatus("products", item.id, "ditolak")} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">Tolak</button></div></div>)}</div>}

      {section === "announcements" && <><div className="space-y-3 rounded-2xl border bg-white p-4"><FInput label="Judul" placeholder="Judul pengumuman" value={announcement.title} onChange={(v) => setAnnouncement((x) => ({ ...x, title: v }))} /><textarea value={announcement.content} onChange={(e) => setAnnouncement((x) => ({ ...x, content: e.target.value }))} placeholder="Isi pengumuman" rows={3} className="w-full rounded-xl border bg-[#F8F5F0] p-3 text-sm" /><select value={announcement.audience} onChange={(e) => setAnnouncement((x) => ({ ...x, audience: e.target.value }))} className="w-full rounded-xl border p-3 text-sm"><option value="semua">Semua</option><option value="umkm">Pemilik UMKM</option><option value="pemerintah">Pemerintah</option></select><button onClick={addAnnouncement} className="w-full rounded-xl bg-[#6B3FA0] py-3 text-sm font-bold text-white">Terbitkan Pengumuman</button></div><div className="space-y-2">{records.map((item) => <div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex justify-between"><p className="text-sm font-bold">{item.title}</p><span className="text-xs">{item.active ? "Aktif" : "Nonaktif"}</span></div><p className="my-2 text-sm text-[#6B6558]">{item.content}</p><div className="flex gap-2"><button onClick={() => changeAnnouncement(item, "toggle")} className="rounded-xl border px-3 py-2 text-xs font-bold">{item.active ? "Nonaktifkan" : "Aktifkan"}</button><button onClick={() => changeAnnouncement(item, "delete")} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Hapus</button></div></div>)}</div></>}

      {section === "system" && <div className="space-y-4 rounded-2xl border bg-white p-4"><FInput label="Nama Platform" placeholder="Nama platform" value={system.platform_name} onChange={(v) => setSystem((x) => ({ ...x, platform_name: v }))} /><FInput label="Kontak Bantuan" placeholder="WhatsApp atau email" value={system.support_contact} onChange={(v) => setSystem((x) => ({ ...x, support_contact: v }))} /><label className="flex items-center justify-between rounded-xl bg-[#F8F5F0] p-3"><span><span className="block text-sm font-bold">Mode Maintenance</span><span className="text-xs text-[#9B9489]">Tandai platform sedang dalam pemeliharaan.</span></span><input type="checkbox" checked={system.maintenance_mode} onChange={(e) => setSystem((x) => ({ ...x, maintenance_mode: e.target.checked }))} className="h-5 w-5" /></label><button onClick={saveSystem} className="w-full rounded-xl bg-[#6B3FA0] py-3 text-sm font-bold text-white">Simpan Pengaturan</button></div>}
    </div>

  );
}

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("ringkasan");
  const [stats, setStats] = useState({ umkm: 0, products: 0, reports: 0, announcements: 0 });
  const [statsMessage, setStatsMessage] = useState("");
  useEffect(() => {
    if (!supabase) return setStatsMessage("Supabase belum dikonfigurasi.");
    Promise.all([
      supabase.from("umkm").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("user_reports").select("id", { count: "exact", head: true }),
      supabase.from("announcements").select("id", { count: "exact", head: true }),
    ]).then(([umkm, products, reports, announcements]) => {
      const error = umkm.error ?? products.error ?? reports.error ?? announcements.error;
      if (error) return setStatsMessage(`Gagal memuat ringkasan: ${error.message}`);
      setStats({ umkm: umkm.count ?? 0, products: products.count ?? 0, reports: reports.count ?? 0, announcements: announcements.count ?? 0 });
    });
  }, []);
  const tabs = [
    { id: "ringkasan" as const, icon: Home, label: "Ringkasan" },
    { id: "umkm" as const, icon: Store, label: "UMKM" },
    { id: "konten" as const, icon: FileText, label: "Konten" },
  ];
  const titles: Record<AdminTab, string> = { ringkasan: "Ringkasan Platform", umkm: "UMKM", konten: "Konten" };

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
              <StatCard label="UMKM" value={stats.umkm} icon={Store} color="bg-[#1B6B4E]" />
              <StatCard label="Produk" value={stats.products} icon={Package} color="bg-[#C9511F]" />
              <StatCard label="Laporan" value={stats.reports} icon={AlertCircle} color="bg-[#6B3FA0]" />
              <StatCard label="Pengumuman" value={stats.announcements} icon={TrendingUp} color="bg-[#2E5B8A]" />
            </div>
            {statsMessage ? <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{statsMessage}</p> : <div className="flex items-center justify-between rounded-2xl border bg-white p-4"><div><p className="text-sm font-bold">Koneksi database</p><p className="text-xs text-[#9B9489]">Seluruh ringkasan berhasil dibaca dari Supabase.</p></div><Badge label="Terhubung" color="green" /></div>}
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

