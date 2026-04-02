# 📋 Fitur-Fitur Duit Log

Dokumen ini menjelaskan setiap fitur yang tersedia di aplikasi Duit Log secara mendetail.

---

## 1. 🔐 Autentikasi

### Login
- Pengguna masuk menggunakan **email dan password**.
- Token JWT yang diterima disimpan secara aman di `expo-secure-store`.
- Tersedia kredensial demo bawaan untuk keperluan testing.
- Jika token valid sudah tersimpan, pengguna akan **otomatis masuk** tanpa perlu login ulang.

### Register
- Pengguna baru mendaftar dengan nama, email, dan password.
- Setelah berhasil mendaftar, pengguna diarahkan ke halaman Login.

### Manajemen Token
- Token disuntikkan otomatis ke setiap request API melalui **Axios interceptor**.
- Route yang dilindungi akan mengarahkan pengguna ke Login jika token tidak ditemukan.

---

## 2. 🏠 Dashboard (Home)

Halaman utama yang memberikan gambaran keuangan pengguna secara keseluruhan.

### Yang Ditampilkan
- Sapaan pengguna berdasarkan nama akun.
- **Saldo akun** saat ini.
- Ringkasan **total pemasukan dan pengeluaran** bulanan.
- **Pie chart** visualisasi pengeluaran per kategori.
- Daftar transaksi yang dapat difilter per bulan/tahun.

### Aksi yang Tersedia
- Tombol **"+"** (FAB) untuk menambah transaksi baru.
- Picker bulan dan tahun untuk memilih periode.
- **Unduh laporan keuangan** dalam format PDF.
- **Bagikan laporan** ke aplikasi lain.
- Pull-to-refresh untuk memperbarui data.

---

## 3. 💳 Transaksi

### Tambah Transaksi
- **Tipe**: pemasukan atau pengeluaran.
- **Jumlah**: nominal transaksi.
- **Kategori**: dipilih dari daftar kategori sesuai tipe.
- **Dompet**: pilih sumber/tujuan dana.
- **Deskripsi**: opsional, sebagai catatan tambahan.
- **Tanggal**: menggunakan date picker bawaan.

### Edit Transaksi
- Data transaksi yang ada diambil dari API dan ditampilkan sebagai nilai awal form.
- Semua field dapat diperbarui.
- Kategori difilter secara otomatis berdasarkan tipe transaksi.

---

## 4. 🔔 Tagihan & Pengingat (Bills)

### Daftar Tagihan
- Menampilkan semua tagihan berulang.
- Menampilkan nama, jumlah, frekuensi, dan tanggal jatuh tempo.
- Aksi edit dan hapus tersedia per item.
- Konfirmasi sebelum menghapus.

### Tambah / Edit Tagihan
- **Nama** tagihan (misal: Netflix, Listrik).
- **Jumlah** tagihan.
- **Tanggal jatuh tempo** (hari 1–31).
- **Frekuensi**: `MONTHLY` (bulanan) atau `YEARLY` (tahunan).
- Jika tahunan, pilih **bulan spesifik** (Januari–Desember).

### Sistem Notifikasi Pengingat
- Setiap kali tagihan ditambah, diedit, atau dihapus, `syncBillReminders()` dijalankan.
- Fungsi ini:
  1. Mengambil semua tagihan dari API.
  2. Menghitung tanggal jatuh tempo berikutnya untuk setiap tagihan.
  3. Menjadwalkan **notifikasi push pukul 09.00** pada tanggal tersebut.
- Menangani kasus khusus: bulan dengan < 31 hari, dan 29 Februari (tahun kabisat).

---

## 5. 👛 Dompet (Wallet)

### Daftar Dompet
- Menampilkan semua dompet beserta saldo masing-masing.
- Filter berdasarkan status: semua / aktif / tidak aktif.
- Setiap dompet ditampilkan dengan warna kustom.

### Tambah / Edit Dompet
- **Nama** dompet.
- **Tipe**: `bank`, `e-wallet`, `cash`, `other`.
- **Saldo awal**.
- **Warna**: 15 warna preset atau pilih bebas via color wheel picker.
- **Status aktif/nonaktif**.

### Logika Hapus
- Jika dompet **sudah digunakan** dalam transaksi → di-nonaktifkan (soft delete).
- Jika dompet **belum digunakan** → dihapus permanen (hard delete).

---

## 6. 🏷️ Kategori

### Daftar Kategori
- Ditampilkan dikelompokkan berdasarkan tipe: pengeluaran dan pemasukan.
- Filter tampilan: semua / pengeluaran / pemasukan.
- Setiap kategori memiliki warna dan indikator visibilitas.

### Tambah / Edit Kategori
- **Nama** kategori.
- **Tipe**: `expense` (pengeluaran) atau `income` (pemasukan).
- **Warna**: 15 warna preset atau color wheel picker.
- **Visibilitas**: toggle tampil/sembunyikan kategori.

---

## 7. 👤 Profil & Akun

### Halaman Profil
- Menampilkan info pengguna: nama, email, avatar inisial.
- Akses ke Edit Profil dan Ganti Password.
- Toggle tema (terang / gelap / sistem).
- Toggle notifikasi.
- Tombol logout.
- Tautan ke halaman About dan FAQ.

### Edit Profil
- Perbarui nama dan email.
- **Konfirmasi password** diperlukan untuk menyimpan perubahan.
- Validasi format email.

### Ganti Password
- Input password lama, password baru, dan konfirmasi password baru.
- Validasi: minimal 6 karakter, password baru tidak boleh sama dengan yang lama.
- Setelah berhasil, pengguna **otomatis logout** dan perlu login ulang.

---

## 8. 🌙 Tema (Light / Dark Mode)

- Tiga pilihan: **terang**, **gelap**, atau **ikuti sistem**.
- Preferensi disimpan di `expo-secure-store` dan dipulihkan saat app dibuka kembali.
- Seluruh layar membaca skema warna dari `getColors(isDarkMode)` di `constants/colors.ts`.

---

## 9. 🔧 Status Server / Maintenance

- Saat app dibuka, `AppStatusContext` secara otomatis mengecek `GET /status`.
- Polling interval: **30 detik** saat maintenance, **5 menit** saat normal.
- Jika server sedang maintenance, tampil **MaintenanceScreen** yang memblokir akses ke semua fitur.

---

## 10. ℹ️ About & FAQ

### Halaman About
- Deskripsi aplikasi dan versi.
- Daftar fitur unggulan dengan ikon.
- Informasi kontak: email, Instagram, GitHub.

### Halaman FAQ
- 10 pertanyaan yang dapat dikembangkan (accordion).
- Topik: fitur, keamanan, edit data, statistik, password, dan lainnya.
