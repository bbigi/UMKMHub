# UMKMku

UMKMku adalah platform web untuk memetakan, mempromosikan, dan mengelola data Usaha Mikro, Kecil, dan Menengah (UMKM) dalam satu tempat. Platform ini membantu masyarakat menemukan UMKM dan produk lokal melalui peta interaktif, sekaligus menyediakan dashboard khusus bagi pemilik usaha, pemerintah, dan administrator.

Tampilan aplikasi dirancang responsif agar nyaman digunakan melalui komputer maupun perangkat seluler.

## Tujuan Platform

UMKMku dibuat untuk membantu digitalisasi ekosistem UMKM dengan cara:

- memudahkan masyarakat menemukan usaha dan produk lokal;
- memberi ruang bagi pemilik UMKM untuk memperkenalkan usahanya;
- membantu pemerintah memantau dan mengolah data UMKM;
- menyediakan proses verifikasi serta moderasi data yang terpusat; dan
- menjaga keamanan akses data sesuai peran pengguna.

## Fitur Utama

### Untuk masyarakat

- Melihat lokasi UMKM aktif pada peta interaktif.
- Mencari UMKM berdasarkan nama atau alamat.
- Menyaring UMKM dan produk berdasarkan kategori.
- Melihat daftar produk yang telah disetujui.
- Menggunakan lokasi perangkat untuk menemukan UMKM di sekitar.

### Untuk pemilik UMKM

- Mendaftar dan masuk menggunakan akun pemilik usaha.
- Melengkapi serta memperbarui profil usaha.
- Mengelola informasi produk, harga, deskripsi, dan gambar.
- Memantau status verifikasi usaha dan moderasi produk.

### Untuk pemerintah

- Melihat ringkasan dan daftar data UMKM.
- Mengelola data UMKM apabila fitur tersebut diizinkan admin.
- Membuat laporan bulanan dan laporan berdasarkan kategori.
- Mengekspor data laporan untuk kebutuhan pendataan.

### Untuk administrator

- Memverifikasi, memperbarui, dan mengelola data UMKM.
- Menyetujui atau menolak produk yang diajukan.
- Menangani laporan dari pengguna.
- Membuat dan mengelola pengumuman platform.
- Mengatur nama platform, kontak bantuan, dan mode pemeliharaan.
- Mengaktifkan atau menonaktifkan fitur pengelolaan UMKM bagi pemerintah dan pendaftaran bagi pemilik usaha.

## Peran Pengguna

| Peran | Akses utama |
| --- | --- |
| Publik | Peta, pencarian, kategori, daftar UMKM, dan produk aktif |
| Pemilik UMKM | Profil usaha dan pengelolaan produk milik sendiri |
| Pemerintah | Pendataan UMKM, ringkasan, dan laporan |
| Admin | Verifikasi, moderasi, pengaturan, dan pengawasan platform |

## Teknologi

- **React 18** dan **TypeScript** untuk antarmuka aplikasi.
- **Vite** sebagai development server dan build tool.
- **Tailwind CSS** untuk styling responsif.
- **Supabase** untuk database PostgreSQL, autentikasi, dan Row Level Security (RLS).
- **Leaflet** dan **React Leaflet** untuk peta interaktif.
- **Vitest** untuk pengujian.
- **Vercel** sebagai target deployment.

## Menjalankan Proyek Secara Lokal

### Prasyarat

- [Node.js](https://nodejs.org/) versi 22.x
- npm
- Project Supabase

### 1. Instal dependensi

```bash
npm install
```

### 2. Konfigurasi environment

Salin `.env.example` menjadi `.env`, kemudian isi kredensial Supabase:

```env
VITE_SUPABASE_URL=https://PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Gunakan **anon/publishable key**, bukan `service_role` key. Jangan commit file `.env` ke repository.

### 3. Siapkan database Supabase

Buka **SQL Editor** pada dashboard Supabase, lalu jalankan seluruh migration berikut secara berurutan:

1. `supabase/migrations/202607130001_create_umkm.sql`
2. `supabase/migrations/202607130002_admin_umkm_policies.sql`
3. `supabase/migrations/202607130003_platform_feature_flags.sql`
4. `supabase/migrations/202607130004_admin_content_modules.sql`
5. `supabase/migrations/202607200001_owner_security_and_validation.sql`
6. `supabase/migrations/202607200002_close_audit_gaps.sql`

Migration tersebut membuat tabel, aturan akses berbasis peran, validasi kepemilikan data, moderasi produk, laporan pengguna, pengumuman, serta pengaturan platform.

Panduan pembuatan akun pemerintah tersedia di [`supabase/SETUP_GOVERNMENT_ACCOUNT.md`](supabase/SETUP_GOVERNMENT_ACCOUNT.md).

### 4. Jalankan development server

```bash
npm run dev
```

Buka alamat lokal yang ditampilkan Vite pada terminal, biasanya `http://localhost:5173`.

## Perintah yang Tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan aplikasi dalam mode pengembangan |
| `npm run build` | Membuat build production |
| `npm run typecheck` | Memeriksa tipe TypeScript tanpa menghasilkan file |
| `npm test` | Menjalankan seluruh pengujian sekali |
| `npm run check` | Menjalankan typecheck, test, dan build sekaligus |

## Alur Moderasi Data

Data usaha dan produk baru tidak langsung tampil kepada publik:

1. Pemilik mengirim profil UMKM atau produk.
2. Data tersimpan dengan status `menunggu`.
3. Admin meninjau dan mengubah status menjadi `aktif` atau `ditolak`.
4. Hanya UMKM dan produk berstatus `aktif` yang ditampilkan pada halaman publik.

## Deployment ke Vercel

1. Pastikan seluruh migration Supabase telah dijalankan.
2. Push proyek ke repository GitHub.
3. Import repository tersebut ke Vercel dan pilih framework **Vite**.
4. Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` untuk environment Production dan Preview.
5. Jalankan deployment.
6. Atur **Site URL** dan URL redirect yang diperlukan melalui **Supabase Authentication > URL Configuration**.
7. Uji login setiap peran, peta, GPS, database, dan fitur utama pada deployment.

GPS pada browser membutuhkan koneksi HTTPS; deployment Vercel telah menyediakan HTTPS secara otomatis. Konfigurasi build dan routing SPA tersedia di `vercel.json`. Petunjuk deployment tambahan dapat dibaca di [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md).

## Mode Pemeliharaan

Admin dapat mengaktifkan mode pemeliharaan melalui **Admin Platform > Pengaturan Sistem**. Ketika aktif, pengguna umum akan melihat halaman pemeliharaan, sementara admin tetap dapat masuk untuk melakukan konfigurasi.

Sebaiknya mode ini hanya diaktifkan saat migration database atau pergantian versi production berlangsung. Pengembangan dan pengujian rutin dapat dilakukan melalui Preview Deployment tanpa menghentikan website production.

## Struktur Utama Proyek

```text
UMKMku/
├── public/                 # Aset publik dan logo
├── src/
│   ├── app/
│   │   ├── components/    # Komponen aplikasi dan peta
│   │   ├── features/      # Auth, UMKM, pemerintah, dan admin
│   │   ├── pages/         # Halaman publik
│   │   └── App.tsx        # Routing dan kontrol akses utama
│   ├── config/            # Konfigurasi branding
│   ├── lib/               # Klien Supabase
│   └── styles/            # Style global dan tema
├── supabase/
│   └── migrations/        # Skema database dan kebijakan RLS
├── .env.example           # Contoh environment variable
└── vercel.json            # Konfigurasi deployment Vercel
```

## Keamanan

- Akses database dibatasi menggunakan Supabase Row Level Security.
- Pemilik UMKM hanya dapat mengelola profil dan produk miliknya sendiri.
- Akses pemerintah dan admin diperiksa berdasarkan role pada metadata autentikasi.
- `service_role` key tidak boleh digunakan pada aplikasi frontend.

---

UMKMku — membantu UMKM lokal lebih mudah ditemukan, dikelola, dan berkembang secara digital.
