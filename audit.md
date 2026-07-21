# Audit Teknis UMKMku

Pembaruan terakhir: 20 Juli 2026

## Ringkasan

Status kesiapan saat ini: **layak untuk tahap uji pengguna/staging**. Struktur frontend, autentikasi, kepemilikan data, fitur UMKM, moderasi, laporan, dan quality gate sudah aktif. Sebelum produksi penuh, migrasi terbaru harus diterapkan dan pengujian RLS terhadap akun nyata perlu dilakukan.

## Temuan yang sudah diperbaiki

### Keamanan dan database

- [x] Menambahkan `owner_id` pada UMKM dan menghubungkannya ke `auth.users`.
- [x] Menambahkan RLS agar pemilik hanya membaca, menambah, mengubah, dan menghapus data miliknya.
- [x] Memastikan produk hanya dapat dikaitkan ke UMKM milik pengguna tersebut.
- [x] Mencegah pemilik mengubah status moderasi sendiri.
- [x] Mengembalikan UMKM/produk ke status `menunggu` setelah diedit pemilik.
- [x] Menghapus insert UMKM dan produk secara anonim.
- [x] Membatasi laporan pengguna ke akun terautentikasi.
- [x] Menambahkan validasi panjang laporan dan pengumuman di database.
- [x] Memastikan trigger registrasi menghormati `owner_can_submit_umkm`.
- [x] Menambahkan RPC admin terbatas untuk melihat akun pemilik UMKM.
- [x] Menambahkan mekanisme admin untuk mengaitkan UMKM lama dengan akun pemilik.
- [x] Role istimewa frontend hanya membaca `app_metadata`, bukan `user_metadata`.

Migrasi terkait:

- `supabase/migrations/202607200001_owner_security_and_validation.sql`
- `supabase/migrations/202607200002_close_audit_gaps.sql`

### Fitur aplikasi

- [x] Registrasi menyimpan identitas dan informasi usaha, lalu trigger membuat profil UMKM.
- [x] Pemilik dapat memuat dan memperbarui profil usahanya.
- [x] Pemilik dapat menambah, mengedit, dan menghapus produk.
- [x] Produk mendukung `image_url` dan gambar tampil di dashboard, katalog publik, serta moderasi.
- [x] Produk aktif tampil pada katalog publik.
- [x] Logo mitra CONCERN terhubung ke website resmi dengan pembukaan tab yang aman.
- [x] Logo UMKMku digunakan sebagai favicon dan nama platform menjadi judul tab browser.
- [x] Pencarian dan filter kategori bekerja pada UMKM dan produk.
- [x] Statistik pemilik, pemerintah, admin, dan halaman login berasal dari database.
- [x] Pemerintah dapat mengunduh laporan bulanan, kategori, dan data lengkap dalam CSV.
- [x] Admin dapat mengelola UMKM, moderasi produk, laporan pengguna, pengumuman, dan pengaturan platform.
- [x] `platform_name`, `support_contact`, dan `maintenance_mode` digunakan oleh aplikasi.
- [x] Fitur tanpa tabel pendukung seperti pesanan dan daftar pengguna publik tidak lagi ditampilkan sebagai menu palsu.

### Stabilitas dan maintainability

- [x] Memecah `App.tsx` menjadi modul auth, UMKM, pemerintah, admin, layout, halaman, dan komponen bersama.
- [x] Menambahkan Error Boundary untuk mencegah layar putih tanpa pesan.
- [x] Menambahkan URL aplikasi untuk login, registrasi, dashboard, dan admin.
- [x] Menambahkan fallback SPA pada Vercel.
- [x] Menambahkan lazy loading per halaman/dashboard.
- [x] Menurunkan bundle awal dari sekitar 600 kB menjadi sekitar 365 kB.
- [x] Membersihkan encoding teks yang rusak.
- [x] Menampilkan error pemuatan data utama, bukan menyamarkannya sebagai data kosong.
- [x] Mengganti `any[]` pada modul konten admin dengan tipe data khusus.
- [x] Menambahkan TypeScript strict check.
- [x] Menambahkan unit test filter katalog dengan Vitest.
- [x] Menambahkan perintah `npm run check` untuk type-check, test, dan build.
- [x] Menambahkan CSP, HSTS, anti-framing, referrer policy, dan permissions policy.
- [x] Audit dependency npm terakhir menemukan 0 kerentanan.

## Verifikasi

Perintah quality gate:

```bash
npm run check
```

Quality gate menjalankan:

1. `tsc --noEmit`
2. `vitest run`
3. `vite build`

Pemeriksaan runtime juga dilakukan menggunakan Chrome headless untuk memastikan root React dirender tanpa error.

## Tindakan deployment yang wajib

1. Terapkan migrasi `202607200002_close_audit_gaps.sql` ke Supabase.
2. Buka Admin → UMKM dan kaitkan UMKM lama yang masih memiliki `owner_id = null` ke akun pemilik.
3. Jalankan `npm run check`.
4. Deploy hasil build ke Vercel.
5. Uji registrasi, moderasi, dan akses lintas akun pada environment staging.

Pemeriksaan read-only pada 20 Juli 2026 menemukan satu UMKM publik lama yang belum memiliki `owner_id`.

## Risiko yang masih tersisa

- [ ] Belum ada end-to-end test yang masuk menggunakan akun UMKM, pemerintah, dan admin nyata.
- [ ] Belum ada integration test otomatis khusus kebijakan RLS Supabase.
- [ ] Gambar produk masih menggunakan URL HTTPS; belum ada bucket upload Supabase Storage.
- [ ] Routing OSRM dan tile OpenStreetMap masih bergantung pada layanan eksternal publik.
- [ ] Akun lama tidak dapat dipasangkan otomatis karena database lama tidak mempunyai hubungan yang dapat dipercaya; admin harus memilih pemiliknya.
- [ ] Belum ada tabel pesanan/pembayaran. Fitur tersebut sengaja tidak ditampilkan sampai aturan bisnis dan skemanya ditentukan.

## Rekomendasi sebelum produksi penuh

- Tambahkan Supabase Storage dan kebijakan upload gambar per pemilik.
- Tambahkan Playwright untuk alur end-to-end utama.
- Jalankan test RLS menggunakan akun dummy untuk setiap role.
- Gunakan layanan routing dengan SLA atau fallback jika navigasi menjadi fitur utama.
- Tentukan model bisnis pesanan sebelum membuat tabel transaksi.
