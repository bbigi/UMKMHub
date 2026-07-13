
  # UMKM Platform Setup

  This is a code bundle for UMKM Platform Setup. The original project is available at https://www.figma.com/design/r5SPMfGWJ3I9S3FtzkROeO/UMKM-Platform-Setup.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Supabase

1. Buat project di Supabase, lalu buka **SQL Editor**.
2. Jalankan isi `supabase/migrations/202607130001_create_umkm.sql`.
3. Salin `.env.example` menjadi `.env`, kemudian isi Project URL dan anon key dari **Project Settings > API**.
4. Jalankan ulang `npm run dev` setelah mengubah `.env`.

Pendaftaran baru masuk dengan status `menunggu`. Agar marker terlihat di peta publik, ubah statusnya menjadi `aktif` melalui Table Editor Supabase.

Jalankan semua file migration secara berurutan. Migration `202607130003_platform_feature_flags.sql` menambahkan kontrol admin untuk menonaktifkan pengelolaan UMKM oleh pemerintah atau pendaftaran oleh pemilik UMKM.

Migration `202607130004_admin_content_modules.sql` mengaktifkan laporan pengguna, pengumuman, moderasi produk, dan pengaturan sistem pada Admin Platform.
### MAINTENANCE
  1. Aktifkan Mode Maintenance melalui dashboard admin.
  2. Pengguna melihat halaman maintenance, tetapi admin tetap bisa masuk.
  3. Kerjakan dan uji fitur baru secara lokal:

  npm.cmd run dev
  npm.cmd run build

  4. Push perubahan ke branch GitHub terpisah, misalnya development.
  5. Vercel membuat Preview Deployment otomatis.
  6. Uji fitur melalui URL preview Vercel.
  7. Jika sudah aman, gabungkan perubahan ke branch production, biasanya main.
  8. Vercel otomatis melakukan deployment production baru.
  9. Periksa login, database, peta, GPS, dan fitur baru pada URL production.
  10. Setelah semuanya berhasil, matikan Mode Maintenance melalui dashboard admin.

  Jadi:

  - Mengubah data atau pengaturan Supabase: umumnya tidak perlu deploy.
  - Menambah atau mengubah kode fitur: perlu deployment baru.
  - Jika GitHub sudah terhubung ke Vercel, deployment berjalan otomatis setelah push/
    merge.

  - Anda tidak perlu menghapus deployment sebelumnya; Vercel menggantinya dengan
    deployment terbaru dan menyediakan rollback jika diperlukan.

  Mode maintenance sebaiknya baru dinyalakan sesaat sebelum migration database atau
  pergantian production. Selama fitur masih dikerjakan dan diuji di Preview Deployment,
  website production dapat tetap berjalan normal.
