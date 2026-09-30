# Kas RT-01 Kiyaran – Versi Lengkap

Aplikasi kas RT berbasis GitHub Pages + Firebase Firestore + Firebase Authentication.

## 1. Penting: password-only
Firebase Authentication dengan Email/Password tetap membutuhkan email di belakang layar. Versi ini membuat **login yang terlihat oleh Bendahara hanya meminta password**.

Sebelum upload, buka `app.js` dan ganti:

```js
const BENDAHARA_EMAIL = "GANTI_DENGAN_EMAIL_BENDAHARA";
```

menjadi email akun Bendahara Firebase, misalnya:

```js
const BENDAHARA_EMAIL = "bendahara.rt01@gmail.com";
```

**Jangan pernah menaruh password di app.js.**

## 2. Fitur
- Dashboard saldo, pemasukan, pengeluaran, jumlah transaksi
- Pencarian transaksi
- Filter tahun, bulan, jenis
- Rekap periode terpilih
- Cetak laporan
- Login Bendahara dengan password saja pada tampilan
- Tambah/edit/hapus transaksi
- Ganti password dari panel Bendahara
- Warga tidak perlu login

## 3. Firebase
Project dan Firestore tetap menggunakan konfigurasi yang sudah dibuat. Jangan membuat database baru.

Security Rules yang dipasang di Firebase harus tetap membatasi create/update/delete hanya untuk UID Bendahara.

## 4. Upload ke GitHub
Ganti file `index.html`, `style.css`, dan `app.js` di repository `abie165/kas-rt-01`. Upload juga README ini jika diinginkan.

Setelah commit, buka GitHub Pages dan tunggu sampai website diperbarui.
