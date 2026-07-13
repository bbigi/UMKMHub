# Deploy ke Vercel

1. Pastikan migration Supabase `001` sampai `004` sudah dijalankan.
2. Push proyek ke GitHub. File `.env` tidak akan ikut karena sudah masuk `.gitignore`.
3. Import repository di Vercel dan pilih framework **Vite**.
4. Tambahkan Environment Variables berikut untuk Production dan Preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (publishable/anon key, bukan service role)
5. Deploy. Build command dan output directory sudah ditentukan oleh `vercel.json`.
6. Di Supabase Authentication > URL Configuration, ubah Site URL ke URL produksi Vercel dan tambahkan URL preview yang diperlukan.
7. Uji login UMKM, pemerintah, admin, GPS, marker, dan tombol Mulai Rute pada perangkat nyata.

GPS membutuhkan HTTPS; Vercel menyediakan HTTPS secara otomatis.
