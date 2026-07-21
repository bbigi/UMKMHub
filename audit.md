# Audit Teknis UMKMku

Pembaruan terakhir: 22 Juli 2026

## Ringkasan

Status kesiapan saat ini: **layak untuk tahap uji pengguna/staging**. Struktur frontend, autentikasi, kepemilikan data, fitur UMKM, moderasi, laporan, dan quality gate sudah aktif. Sebelum produksi penuh, migration history perlu dicocokkan dan kebijakan RLS harus diuji menggunakan akun nyata untuk setiap role.

## Audit lanjutan — 22 Juli 2026

Pemeriksaan read-only terhadap Supabase mengonfirmasi bahwa `products.image_path`, kolom laporan berbasis akun, kolom tanggapan admin, `umkm.location`, dan RPC `search_nearby_umkm` sudah tersedia. RPC GIS dapat dipanggil tanpa error dan migrasi hardening terbaru terdeteksi aktif. Verifikasi operasional terakhir menemukan **3 UMKM aktif**, **1 produk aktif**, dan **3 hasil GIS dalam radius 5 km**.

Temuan terbuka berdasarkan prioritas:

### Prioritas tinggi

- [x] Trigger GIS diperbarui agar selalu membentuk ulang `location` pada setiap insert/update sehingga penulisan langsung tidak dapat membuat data spasial berbeda dari latitude/longitude.
- [x] Data publik telah aktif: 3 UMKM dan 1 produk dapat dibaca anonim; seluruh 3 titik dikembalikan RPC GIS radius 5 km.

### Prioritas menengah

- [x] Perubahan `owner_id` dilindungi trigger: hanya admin yang dapat memasangkan ulang pemilik, sedangkan data buatan pemerintah tetap tidak memiliki pemilik.
- [x] Produk peta tidak lagi diunduh seluruhnya; produk aktif dimuat sesuai UMKM yang sedang dipilih dan request lama diabaikan saat pilihan berubah.
- [ ] Peta masih mengambil seluruh UMKM aktif saat pertama dibuka. Pada data besar, marker perlu dimuat berdasarkan viewport atau clustering server-side.
- [ ] Daftar admin, pemerintah, laporan, dan katalog belum memakai pagination atau batas jumlah data.
- [x] Laporan memiliki tanggapan admin, waktu pembaruan, status proses, dan tombol muat ulang bagi pengirim. Realtime belum diaktifkan agar tidak bergantung pada konfigurasi publication Supabase.
- [ ] Bucket gambar bersifat publik sejak upload, sehingga gambar produk yang masih menunggu moderasi dapat diakses jika URL-nya diketahui.
- [x] Pelacakan GPS membersihkan watcher sebelumnya, dapat dihentikan saat masih mencari lokasi, dan mengabaikan respons radius lama.

### Prioritas rendah

- [x] Kartu UMKM dan produk pada panel publik dapat memusatkan peta serta membuka rincian UMKM terkait.
- [ ] Test otomatis baru terdiri dari 4 unit test filter katalog; belum mencakup GIS, moderasi, upload, autentikasi, laporan, dan dashboard.
- [ ] Banyak komponen UI dan dependency bawaan tidak digunakan aplikasi utama. Tree-shaking menjaga bundle runtime, tetapi waktu instalasi dan permukaan dependency masih lebih besar dari kebutuhan.

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
- [x] Mengaitkan laporan/permohonan dengan akun pengirim agar riwayat proses hanya dapat dibaca pemilik laporan dan admin.
- [x] Menyimpan jenis laporan dan role pengirim yang tepercaya untuk membantu triase admin.
- [x] Menambahkan fondasi PostGIS dengan kolom `geography(Point,4326)`, indeks GiST, dan sinkronisasi otomatis dari latitude/longitude.
- [x] Menambahkan RPC pencarian UMKM aktif berdasarkan radius 100 meter sampai 20 km.
- [x] Menambahkan view GeoJSON UMKM aktif untuk integrasi GIS seperti QGIS.

Migrasi terkait:

- `supabase/migrations/202607200001_owner_security_and_validation.sql`
- `supabase/migrations/202607200002_close_audit_gaps.sql`
- `supabase/migrations/202607220002_account_reports_and_requests.sql`
- `supabase/migrations/202607220003_postgis_spatial_foundation.sql`
- `supabase/migrations/202607220004_audit_hardening_and_report_responses.sql`

### Fitur aplikasi

- [x] Registrasi menyimpan identitas dan informasi usaha, lalu trigger membuat profil UMKM.
- [x] Pemilik dapat memuat dan memperbarui profil usahanya.
- [x] Pemilik dapat menambah, mengedit, dan menghapus produk.
- [x] Produk mendukung upload gambar langsung ke Supabase Storage dan gambar tampil di dashboard, katalog publik, serta moderasi.
- [x] Upload gambar dibatasi ke JPG, PNG, WEBP, atau GIF dengan ukuran maksimal 5 MB.
- [x] File gambar disimpan dalam folder pemilik dengan kebijakan Storage berbasis `auth.uid()`.
- [x] File baru dibersihkan jika penyimpanan produk gagal; file lama dibersihkan ketika gambar diganti atau produk dihapus.
- [x] Produk aktif tampil pada katalog publik.
- [x] Marker peta publik memuat produk aktif dari UMKM terkait, menampilkan maksimal empat gambar sebagai kolase, dan membuka rincian UMKM dalam panel mengapung tanpa login.
- [x] Pengguna dapat mengaktifkan GPS lalu memfilter UMKM dalam radius 1, 3, 5, atau 10 km menggunakan kueri spasial PostGIS.
- [x] Hasil radius diurutkan berdasarkan jarak dan rincian UMKM menampilkan jarak dari pengguna.
- [x] Logo mitra CONCERN terhubung ke website resmi dengan pembukaan tab yang aman.
- [x] Logo UMKMku digunakan sebagai favicon dan nama platform menjadi judul tab browser.
- [x] Pencarian dan filter kategori bekerja pada UMKM dan produk.
- [x] Statistik pemilik, pemerintah, admin, dan halaman login berasal dari database.
- [x] Dashboard pemilik menampilkan status verifikasi usaha sebenarnya dan setiap perubahan produk kembali masuk antrean moderasi.
- [x] Pemilik UMKM dan pemerintah dapat mengirim masalah, permohonan, atau verifikasi ke admin serta memantau status penanganannya.
- [x] Admin dapat menyimpan tanggapan pada laporan dan pengirim dapat membaca tanggapan beserta waktu pembaruannya.
- [x] Pemerintah dapat mengunduh laporan bulanan, kategori, dan data lengkap dalam CSV.
- [x] Ringkasan pemerintah menampilkan sebaran kategori UMKM dari data database.
- [x] Ringkasan pemerintah menampilkan persentase kelengkapan titik koordinat sebagai kesiapan data spasial.
- [x] Admin dapat mengelola UMKM, moderasi produk, laporan pengguna, pengumuman, dan pengaturan platform.
- [x] Admin memiliki antrean persetujuan terpadu untuk profil UMKM dan produk.
- [x] Daftar moderasi produk hanya memuat status `menunggu`; produk langsung hilang dari antrean setelah disetujui atau ditolak.
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
- [x] Menyamakan `engines.node` dengan Node.js 24.x pada Vercel agar konfigurasi runtime deployment konsisten tanpa warning override.
- [x] Audit dependency npm terakhir menemukan 0 kerentanan.

## Verifikasi

Verifikasi operasional Supabase pada 22 Juli 2026:

- `maintenance_mode = false`.
- Pendaftaran pemilik dan pengelolaan pemerintah aktif.
- View GeoJSON mengembalikan 3 fitur dan seluruhnya bertipe `Point` valid.
- Katalog publik mengembalikan 1 produk yang terhubung ke UMKM aktif.
- Laporan pengguna tidak dapat dibaca anonim.
- RPC daftar akun pemilik khusus admin menolak akses anonim.
- Pengguna telah menguji langsung akun UMKM, pemerintah, dan admin yang tersedia; login serta fitur masing-masing role dikonfirmasi berjalan.

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

1. Pastikan `202607200002_close_audit_gaps.sql` dan seluruh kebijakan Storage dari `202607220001_product_image_storage.sql` tercatat berhasil di migration history; keberadaan kolom sudah terverifikasi, tetapi kebijakan lintas role belum diuji otomatis.
2. Migrasi laporan, PostGIS, dan hardening `202607220004_audit_hardening_and_report_responses.sql` sudah terdeteksi aktif melalui REST/RPC pada 22 Juli 2026.
3. Buka Admin → UMKM dan kaitkan UMKM lama yang masih memiliki `owner_id = null` ke akun pemilik.
4. Jalankan `npm run check`.
5. Deploy hasil build ke Vercel.
6. Ulangi smoke test registrasi, upload gambar, kolase peta, pencarian radius GPS, tanggapan laporan, moderasi, dan akses lintas akun setelah setiap deployment besar.

Pemeriksaan read-only pada 20 Juli 2026 menemukan satu UMKM publik lama yang belum memiliki `owner_id`.

## Risiko yang masih tersisa

- [ ] Belum ada end-to-end test yang masuk menggunakan akun UMKM, pemerintah, dan admin nyata.
- [ ] Belum ada integration test otomatis khusus kebijakan RLS Supabase.
- [ ] Peta dan dashboard belum memakai pagination, clustering marker, atau pemuatan UMKM sesuai viewport.
- [ ] Routing OSRM dan tile OpenStreetMap masih bergantung pada layanan eksternal publik.
- [ ] Akun lama tidak dapat dipasangkan otomatis karena database lama tidak mempunyai hubungan yang dapat dipercaya; admin harus memilih pemiliknya.
- [ ] Belum ada tabel pesanan/pembayaran. Fitur tersebut sengaja tidak ditampilkan sampai aturan bisnis dan skemanya ditentukan.

## Rekomendasi sebelum produksi penuh

- Tambahkan Playwright untuk alur end-to-end utama.
- Jalankan test RLS menggunakan akun dummy untuk setiap role.
- Gunakan layanan routing dengan SLA atau fallback jika navigasi menjadi fitur utama.
- Tentukan model bisnis pesanan sebelum membuat tabel transaksi.
