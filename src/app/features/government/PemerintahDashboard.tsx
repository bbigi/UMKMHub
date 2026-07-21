import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { AppShell } from "../../layouts/AppShell";
import { AnnouncementBanner, StatCard, Badge, MapCanvas } from "../../shared/components";
import { AdminUmkmManager } from "../admin/AdminDashboard";
import { ReportCenter } from "../reports/ReportCenter";
import { Store, BarChart3, FileText, Layers, CheckCircle, Clock, AlertCircle, Download, LogOut, MapPin, MessageSquareWarning } from "lucide-react";

type GovTab = "ringkasan" | "daftar" | "laporan" | "aduan";
type GovernmentUmkm = {
  id: string;
  nama_usaha: string;
  kategori: string;
  alamat: string;
  status: "menunggu" | "aktif" | "ditolak";
  created_at: string;
  latitude: number;
  longitude: number;
};

const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function PemerintahDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<GovTab>("ringkasan");
  const [items, setItems] = useState<GovernmentUmkm[]>([]);
  const [loadMessage, setLoadMessage] = useState("");

  useEffect(() => {
    if (!supabase) return setLoadMessage("Supabase belum dikonfigurasi.");
    supabase.from("umkm").select("id,nama_usaha,kategori,alamat,status,created_at,latitude,longitude").order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setItems((data ?? []) as GovernmentUmkm[]);
        setLoadMessage(error ? `Gagal memuat data: ${error.message}` : "");
      });
  }, []);

  const stats = {
    total: items.length,
    aktif: items.filter((item) => item.status === "aktif").length,
    menunggu: items.filter((item) => item.status === "menunggu").length,
    ditolak: items.filter((item) => item.status === "ditolak").length,
  };
  const categorySummary = Object.entries(items.reduce<Record<string, number>>((result, item) => {
    result[item.kategori] = (result[item.kategori] ?? 0) + 1;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);
  const largestCategory = Math.max(1, ...categorySummary.map(([, count]) => count));
  const mappedCount = items.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)).length;
  const mappedPercentage = items.length ? Math.round((mappedCount / items.length) * 100) : 0;

  const downloadCsv = (kind: "data" | "kategori" | "bulanan") => {
    let rows: (string | number)[][];
    let filename: string;

    if (kind === "kategori") {
      const grouped = Object.entries(items.reduce<Record<string, number>>((result, item) => {
        result[item.kategori] = (result[item.kategori] ?? 0) + 1;
        return result;
      }, {}));
      rows = [["Kategori", "Jumlah"], ...grouped];
      filename = "laporan-kategori-umkm.csv";
    } else if (kind === "bulanan") {
      const grouped = Object.entries(items.reduce<Record<string, number>>((result, item) => {
        const month = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(item.created_at));
        result[month] = (result[month] ?? 0) + 1;
        return result;
      }, {}));
      rows = [["Bulan", "UMKM Terdaftar"], ...grouped];
      filename = "laporan-bulanan-umkm.csv";
    } else {
      rows = [["Nama Usaha", "Kategori", "Alamat", "Status", "Tanggal Daftar"], ...items.map((item) => [item.nama_usaha, item.kategori, item.alamat, item.status, new Date(item.created_at).toLocaleDateString("id-ID")])];
      filename = "data-umkm-karangwuni.csv";
    }

    const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(escapeCsv).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "ringkasan" as const, icon: BarChart3, label: "Ringkasan" },
    { id: "daftar" as const, icon: Layers, label: "Daftar" },
    { id: "laporan" as const, icon: FileText, label: "Laporan" },
    { id: "aduan" as const, icon: MessageSquareWarning, label: "Aduan" },
  ];
  const titles: Record<GovTab, string> = { ringkasan: "Ringkasan", daftar: "Daftar UMKM", laporan: "Ekspor Laporan", aduan: "Laporan ke Admin" };

  return (
    <AppShell tabs={tabs} active={tab} onTabChange={(id) => setTab(id as GovTab)}
      title={titles[tab]} subtitle="Karangwuni, Wates" roleLabel="Dinas / Pemerintah" accentColor="#2E5B8A"
      rightSlot={<button onClick={onLogout} aria-label="Keluar" className="flex h-9 w-9 items-center justify-center rounded-xl border bg-[#F8F5F0] text-[#9B9489] hover:text-[#C0392B]"><LogOut size={15} /></button>}>

      {tab === "ringkasan" && <div className="flex min-h-full flex-col gap-4 p-4">
        <AnnouncementBanner audience="pemerintah" />
        {loadMessage && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{loadMessage}</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard className="w-full min-w-0" label="Total UMKM" value={stats.total} icon={Store} color="bg-[#2E5B8A]" />
          <StatCard className="w-full min-w-0" label="Aktif" value={stats.aktif} icon={CheckCircle} color="bg-[#1B6B4E]" />
          <StatCard className="w-full min-w-0" label="Menunggu" value={stats.menunggu} icon={Clock} color="bg-[#C9511F]" />
          <StatCard className="w-full min-w-0" label="Ditolak" value={stats.ditolak} icon={AlertCircle} color="bg-[#8D5A2B]" />
        </div>
        <section className="rounded-2xl border bg-white p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold">Sebaran kategori</h2><span className="text-xs text-[#9B9489]">{categorySummary.length} kategori</span></div>
          {categorySummary.length === 0 ? <p className="text-xs text-[#9B9489]">Belum ada data kategori.</p> : <div className="space-y-3">{categorySummary.map(([name, count]) => <div key={name}><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-[#2A2520]">{name}</span><span className="text-[#6B6558]">{count} UMKM</span></div><div className="h-2 overflow-hidden rounded-full bg-[#E5EEF8]"><div className="h-full rounded-full bg-[#2E5B8A]" style={{ width: `${Math.max(8, (count / largestCategory) * 100)}%` }} /></div></div>)}</div>}
        </section>
        <section className="flex items-center gap-4 rounded-2xl border border-[#C9D9EA] bg-[#F5F9FD] p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2E5B8A] text-white"><MapPin size={18} /></div>
          <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold">Kelengkapan data spasial</p><span className="text-sm font-extrabold text-[#2E5B8A]">{mappedPercentage}%</span></div><p className="mt-1 text-xs text-[#6B6558]">{mappedCount} dari {items.length} UMKM memiliki titik koordinat dan siap dianalisis di GIS.</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#DDE8F5]"><div className="h-full rounded-full bg-[#2E5B8A]" style={{ width: `${mappedPercentage}%` }} /></div></div>
        </section>
        <div className="h-[260px] overflow-hidden rounded-2xl border lg:h-[360px]"><MapCanvas className="h-full w-full" /></div>
        <section className="space-y-2">
          <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold">UMKM terbaru</h2><span className="text-xs text-[#9B9489]">{items.length} data</span></div>
          {items.slice(0, 5).map((item) => <article key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-white p-4"><div><p className="text-sm font-bold">{item.nama_usaha}</p><p className="text-xs text-[#9B9489]">{item.kategori} · {item.alamat}</p></div><Badge label={item.status} color={item.status === "aktif" ? "green" : item.status === "ditolak" ? "orange" : "gray"} /></article>)}
          {items.length === 0 && !loadMessage && <p className="rounded-2xl border bg-white p-5 text-sm text-[#6B6558]">Belum ada data UMKM di database.</p>}
        </section>
      </div>}

      {tab === "daftar" && <div className="p-4 pb-6"><AdminUmkmManager mode="government" /></div>}

      {tab === "laporan" && <div className="space-y-3 p-4 pb-6">
        {[
          { id: "bulanan" as const, label: "Laporan Bulanan", desc: "Jumlah pendaftaran UMKM per bulan", icon: BarChart3 },
          { id: "kategori" as const, label: "Laporan Kategori", desc: "Distribusi UMKM berdasarkan kategori", icon: Layers },
          { id: "data" as const, label: "Data Lengkap UMKM", desc: "Nama, kategori, alamat, status, dan tanggal", icon: MapPin },
        ].map((report) => { const Icon = report.icon; return <article key={report.id} className="flex items-center gap-4 rounded-2xl border bg-white p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5EEF8]"><Icon size={16} className="text-[#2E5B8A]" /></div><div className="flex-1"><p className="text-sm font-bold">{report.label}</p><p className="text-xs text-[#9B9489]">{report.desc}</p></div><button disabled={items.length === 0} onClick={() => downloadCsv(report.id)} className="flex items-center gap-1 text-xs font-bold text-[#2E5B8A] disabled:opacity-40"><Download size={12} /> Unduh CSV</button></article>; })}
        <p className="text-xs text-[#9B9489]">Laporan dibuat langsung dari {items.length} data UMKM yang dapat diakses akun pemerintah.</p>
      </div>}
      {tab === "aduan" && <div className="p-4 pb-6"><ReportCenter audienceLabel="Pemerintah" /></div>}
    </AppShell>
  );
}
