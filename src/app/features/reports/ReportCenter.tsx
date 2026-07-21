import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, FileCheck2, RefreshCw, Send } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { Badge, EmptyState, FInput } from "../../shared/components";

type OwnReport = {
  id: string;
  report_type: "masalah" | "permohonan" | "verifikasi";
  subject: string;
  description: string;
  status: "baru" | "diproses" | "selesai" | "ditolak";
  created_at: string;
  updated_at: string;
  admin_response: string;
};

export function ReportCenter({ audienceLabel }: { audienceLabel: string }) {
  const [records, setRecords] = useState<OwnReport[]>([]);
  const [form, setForm] = useState({ report_type: "masalah" as OwnReport["report_type"], subject: "", description: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReports = async () => {
    if (!supabase) return setMessage("Supabase belum dikonfigurasi.");
    const { data, error } = await supabase.from("user_reports").select("id,report_type,subject,description,status,created_at,updated_at,admin_response").order("created_at", { ascending: false });
    setRecords((data ?? []) as OwnReport[]);
    if (error) setMessage(`Gagal memuat laporan: ${error.message}`);
  };

  useEffect(() => { void loadReports(); }, []);

  const submit = async () => {
    if (!supabase || form.subject.trim().length < 3 || form.description.trim().length < 10) return setMessage("Subjek minimal 3 karakter dan keterangan minimal 10 karakter.");
    setSubmitting(true); setMessage("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setSubmitting(false); return setMessage("Sesi berakhir. Silakan masuk kembali."); }
    const { error } = await supabase.from("user_reports").insert({
      report_type: form.report_type,
      subject: form.subject.trim(),
      description: form.description.trim(),
      reporter_name: userData.user.user_metadata?.nama || audienceLabel,
      reporter_contact: userData.user.email || "",
      status: "baru",
    });
    setSubmitting(false);
    if (error) return setMessage(`Gagal mengirim: ${error.message}`);
    setForm({ report_type: "masalah", subject: "", description: "" });
    setMessage("Laporan berhasil dikirim ke admin.");
    await loadReports();
  };

  return <div className="space-y-4">
    <section className="space-y-3 rounded-2xl border border-[#EEEBE4] bg-white p-4">
      <div><h2 className="text-sm font-extrabold text-[#1A1714]">Kirim ke Admin</h2><p className="text-xs text-[#9B9489]">Laporkan masalah atau ajukan permohonan dan pantau prosesnya.</p></div>
      <select value={form.report_type} onChange={(event) => setForm((current) => ({ ...current, report_type: event.target.value as OwnReport["report_type"] }))} className="w-full rounded-xl border bg-[#F8F5F0] p-3 text-sm"><option value="masalah">Laporan Masalah</option><option value="permohonan">Permohonan Persetujuan</option><option value="verifikasi">Permohonan Verifikasi</option></select>
      <FInput label="Subjek" placeholder="Ringkasan laporan atau permohonan" value={form.subject} onChange={(subject) => setForm((current) => ({ ...current, subject }))} />
      <textarea value={form.description} maxLength={4000} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Jelaskan kebutuhan Anda secara lengkap" className="w-full rounded-xl border bg-[#F8F5F0] p-3 text-sm" />
      <button disabled={submitting} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B6B4E] py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={14} /> {submitting ? "Mengirim..." : "Kirim ke Admin"}</button>
      {message && <p className="rounded-xl bg-[#F0EDE7] px-3 py-2 text-xs text-[#6B6558]">{message}</p>}
    </section>

    <section className="space-y-2">
      <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold text-[#1A1714]">Riwayat dan Proses</h2><button type="button" onClick={() => void loadReports()} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#1B6B4E]"><RefreshCw size={12} /> Perbarui</button></div>
      {records.length === 0 ? <div className="rounded-2xl border bg-white"><EmptyState icon={FileCheck2} title="Belum ada laporan" desc="Laporan dan permohonan yang dikirim akan muncul di sini." /></div> : records.map((record) => <article key={record.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#1B6B4E]">{record.report_type}</p><h3 className="mt-1 text-sm font-bold">{record.subject}</h3></div><Badge label={record.status} color={record.status === "selesai" ? "green" : record.status === "baru" ? "orange" : record.status === "diproses" ? "blue" : "gray"} /></div><p className="mt-2 text-xs text-[#6B6558]">{record.description}</p>{record.admin_response && <div className="mt-3 rounded-xl border border-[#DED3EA] bg-[#FAF7FD] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#6B3FA0]">Tanggapan Admin</p><p className="mt-1 whitespace-pre-wrap text-xs text-[#4A4054]">{record.admin_response}</p></div>}<div className="mt-3 flex items-center gap-2 text-[10px] text-[#9B9489]">{record.status === "selesai" ? <CheckCircle size={12} /> : record.status === "diproses" ? <Clock size={12} /> : <AlertCircle size={12} />} Diperbarui {new Date(record.updated_at || record.created_at).toLocaleString("id-ID")}</div></article>)}
    </section>
  </div>;
}
