# 🏗️ Arsitektur Duit Log

Dokumen ini menjelaskan arsitektur teknis, tech stack, alur kerja, dan struktur kode aplikasi Duit Log.

---

## Tech Stack

### Frontend

| Kategori | Teknologi | Versi |
|---|---|---|
| Framework | React Native | 0.81.5 |
| Platform | Expo | 54.0.29 |
| Bahasa | TypeScript | 5.9.2 |
| Routing | Expo Router | v6 |
| State Management | React Context API | — |
| Navigation | React Navigation | v7 |

### Library Utama

| Kategori | Library |
|---|---|
| HTTP | Axios 1.13.2 |
| Penyimpanan Aman | expo-secure-store |
| Notifikasi | expo-notifications |
| Grafik | react-native-chart-kit (PieChart) |
| Color Picker | react-native-color-picker-wheel |
| Date Picker | @react-native-community/datetimepicker |
| PDF | expo-print, expo-sharing |
| Haptic | expo-haptics |
| Animasi | react-native-reanimated |
| Storage | @react-native-async-storage/async-storage |

### Backend

- **URL Produksi:** `https://duit-log-backend.vercel.app/api`
- **Platform:** Vercel (serverless)
- **Database:** MongoDB
- **Autentikasi:** JWT (Bearer Token)

---

## Struktur Context Providers

Aplikasi menggunakan tiga Context Provider yang bersarang dalam urutan berikut:

```
AppStatusProvider        ← Cek status server (maintenance/available)
  └─ ThemeProvider       ← Manajemen tema terang/gelap
       └─ AuthProvider   ← Status login & JWT token
            └─ RootLayoutContent  ← Navigasi utama
```

### AppStatusContext
- Polling `GET /status` secara berkala.
- Menyimpan `isAvailable` dan `isMaintenance`.
- Interval: 30 detik (maintenance) / 5 menit (normal).
- Timeout: 10 detik per request.

### ThemeContext
- Menyimpan preferensi tema di `expo-secure-store`.
- `isDarkMode` dihitung berdasarkan preferensi atau setting sistem.
- Semua warna diambil dari `getColors(isDarkMode)`.

### AuthContext
- Menyimpan JWT di `expo-secure-store`.
- Token disuntikkan otomatis via Axios interceptor.
- Menyediakan fungsi `login()`, `logout()`, dan `user`.

---

## File-Based Routing (Expo Router)

Navigasi dikelola oleh Expo Router menggunakan struktur folder:

```
app/
├── _layout.tsx          # Root layout, mounting semua providers
├── index.tsx            # Redirect ke (auth)/login
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/              # Tab navigation utama
│   ├── _layout.tsx      # Konfigurasi tab bar
│   ├── index.tsx        # Home / Dashboard
│   ├── bills.tsx        # Daftar tagihan
│   └── profile.tsx      # Profil pengguna
├── (transactions)/
│   ├── add.tsx
│   └── edit.tsx
├── (wallet)/
│   ├── index.tsx
│   ├── add.tsx
│   └── edit.tsx
├── (categories)/
│   ├── index.tsx
│   ├── create.tsx
│   └── edit.tsx
├── (bills)/
│   ├── add.tsx
│   └── edit.tsx
├── (profile)/
│   ├── edit.tsx
│   └── change-password.tsx
├── (about)/index.tsx
└── (faq)/index.tsx
```

Grup dalam tanda kurung `(nama)` tidak memengaruhi URL, hanya digunakan untuk pengelompokan file.

---

## Alur Kerja Utama (End-to-End Workflows)

### A. Login & Autentikasi

```
1. App dibuka → AppStatusProvider cek server
2. AuthProvider cek token di SecureStore
3. Tidak ada token → arahkan ke Login
4. Pengguna login → POST /auth/login → terima token
5. Token disimpan di SecureStore → AuthContext diperbarui
6. Arahkan ke Home (Tabs)
7. Semua request API berikutnya menyertakan token via interceptor
```

### B. Catat Transaksi Baru

```
1. Di Home, tekan tombol "+" → layar Add Transaction
2. Pilih tipe (pemasukan/pengeluaran)
3. Ambil kategori sesuai tipe dari API → tampilkan dropdown
4. Ambil daftar dompet dari API → tampilkan dropdown
5. Isi: jumlah, kategori, dompet, tanggal, deskripsi
6. Submit → POST /transactions
7. Berhasil → kembali ke Home
8. Home mengambil ulang data transaksi sesuai filter bulan/tahun
```

### C. Atur Pengingat Tagihan

```
1. Di tab Bills, tekan "+" → layar Add Bill
2. Isi: nama, jumlah, hari jatuh tempo, frekuensi
3. Submit → POST /bills
4. syncBillReminders() dipanggil otomatis
5. Ambil semua tagihan, hitung tanggal jatuh tempo berikutnya
6. Jadwalkan notifikasi push pukul 09.00 untuk setiap tagihan
7. Notifikasi diterima di perangkat pada tanggal jatuh tempo
```

### D. Lihat Ringkasan Keuangan

```
1. Buka halaman Home
2. Pilih periode (bulan/tahun) via picker
3. GET /transactions?month=X&year=Y
4. Hitung totalPemasukan dan totalPengeluaran
5. Kelompokkan pengeluaran per kategori → data PieChart
6. Tampilkan: saldo (dari GET /auth/me), ringkasan, chart, daftar transaksi
```

### E. Ganti Tema

```
1. Di Profil, tekan toggle tema
2. ThemeContext.toggleTheme() dipanggil
3. Preferensi disimpan ke SecureStore
4. isDarkMode dihitung ulang
5. getColors(isDarkMode) mengembalikan skema warna baru
6. Semua layar re-render dengan warna baru
```

---

## Skema Warna

### Light Mode

| Token | Nilai |
|---|---|
| Background | `#f8fafc` |
| Primary | `#2563eb` |
| Success / Income | `#10b981` |
| Error / Expense | `#ef4444` |
| Text | `#1e293b` |

### Dark Mode

| Token | Nilai |
|---|---|
| Background | `#0f172a` |
| Primary | `#2563eb` |
| Success / Income | `#10b981` |
| Error / Expense | `#ef4444` |
| Text | `#f1f5f9` |
| Text Secondary | `#cbd5e1` |

---

## Keamanan

| Aspek | Implementasi |
|---|---|
| Penyimpanan token | `expo-secure-store` (terenkripsi) |
| Injeksi token | Axios request interceptor |
| Route protection | Navigation guard di AuthContext |
| Edit profil | Memerlukan konfirmasi password |
| Ganti password | Memaksa logout setelah berhasil |

---

## Utilitas Penting

### `utils/formatCurrency.ts`
Memformat angka ke format Rupiah Indonesia (id-ID locale) tanpa desimal.  
Contoh: `1500000` → `Rp 1.500.000`

### `utils/syncReminders.ts`
Menjadwalkan notifikasi push untuk semua tagihan aktif.  
Logika khusus:
- Bulan dengan < 31 hari: tanggal disesuaikan ke hari terakhir bulan tersebut.
- 29 Februari: disesuaikan jika bukan tahun kabisat.
- Berjalan saat startup dan setiap perubahan pada data tagihan.
