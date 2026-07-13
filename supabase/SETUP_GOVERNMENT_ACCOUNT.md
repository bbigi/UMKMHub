# Membuat akun pemerintah

1. Buka Supabase Dashboard > Authentication > Users > Add user.
2. Masukkan email dan kata sandi khusus yang diberikan pemerintah. Aktifkan **Auto Confirm User**.
3. Buka SQL Editor dan jalankan perintah berikut setelah mengganti alamat email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"government"}'::jsonb
where email = 'email-pemerintah@example.com';
```

Role harus disimpan di `app_metadata`, bukan `user_metadata`, agar tidak dapat diubah sendiri oleh pengguna.
