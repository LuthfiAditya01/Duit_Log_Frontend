# 💰 Duit Log — Personal Finance Management App

**Duit Log** adalah aplikasi manajemen keuangan pribadi berbasis mobile yang dibangun dengan React Native (Expo). Aplikasi ini membantu pengguna mencatat pemasukan, pengeluaran, tagihan berulang, dan mengelola beberapa dompet dalam satu tempat. Nama "Duit" berasal dari bahasa Indonesia yang berarti uang.

> **Version:** 1.0.0 (Beta)  
> **Platform:** Android & iOS (via Expo)  
> **Backend:** [https://duit-log-backend.vercel.app/api](https://duit-log-backend.vercel.app/api)

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Direktori](#-struktur-direktori)
- [Cara Menjalankan](#-cara-menjalankan)
- [Dokumentasi Lengkap](#-dokumentasi-lengkap)

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| 🔐 **Autentikasi** | Login & Register dengan JWT, auto-login via SecureStore |
| 📊 **Dashboard** | Ringkasan keuangan bulanan, pie chart pengeluaran per kategori |
| 💳 **Transaksi** | Catat pemasukan & pengeluaran dengan kategori dan dompet |
| 🔔 **Tagihan / Bills** | Tagihan berulang (bulanan/tahunan) dengan notifikasi pengingat |
| 👛 **Dompet** | Kelola beberapa dompet (bank, e-wallet, tunai, lainnya) |
| 🏷️ **Kategori** | Buat kategori kustom untuk pengeluaran dan pemasukan |
| 🌙 **Tema** | Mode terang / gelap / sistem |
| 📄 **Export PDF** | Unduh & bagikan laporan keuangan |

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| **Mobile Framework** | React Native 0.81.5 via Expo 54 |
| **Bahasa** | TypeScript 5.9 |
| **Routing** | Expo Router v6 (file-based) |
| **State Management** | React Context API |
| **HTTP Client** | Axios (JWT via interceptor) |
| **Secure Storage** | expo-secure-store |
| **Notifikasi** | expo-notifications |
| **Chart** | react-native-chart-kit (PieChart) |
| **Backend** | REST API on Vercel (MongoDB) |

---

## 📁 Struktur Direktori

```
Duit_Log/
├── app/
│   ├── _layout.tsx          # Root layout (providers)
│   ├── index.tsx            # Redirect ke login
│   ├── (auth)/              # Login, Register
│   ├── (tabs)/              # Home, Bills, Profile (tab utama)
│   ├── (transactions)/      # Add, Edit transaksi
│   ├── (wallet)/            # List, Add, Edit dompet
│   ├── (categories)/        # List, Create, Edit kategori
│   ├── (bills)/             # Add, Edit tagihan
│   ├── (profile)/           # Edit profil, Ganti password
│   ├── (about)/             # Halaman tentang aplikasi
│   └── (faq)/               # Halaman FAQ
├── components/
│   ├── ExpenseChart.tsx      # Komponen pie chart
│   ├── TransactionItem.tsx   # Item list transaksi
│   └── MaintenanceScreen.tsx # UI saat maintenance
├── context/
│   ├── AuthContext.tsx       # Status login & token
│   ├── ThemeContext.tsx      # Mode terang/gelap
│   └── AppStatusContext.tsx  # Status server/maintenance
├── services/
│   ├── api.ts                # Axios instance
│   └── statusService.ts      # Cek status server
├── utils/
│   ├── formatCurrency.ts     # Format Rupiah
│   └── syncReminders.ts      # Penjadwal notifikasi tagihan
├── constants/
│   └── colors.ts             # Skema warna terang/gelap
└── docs/                     # Dokumentasi lengkap
    ├── FEATURES.md
    ├── ARCHITECTURE.md
    ├── API.md
    └── DATA_MODELS.md
```

---

## 🚀 Cara Menjalankan

### 1. Install dependencies

```bash
npm install
```

### 2. Jalankan aplikasi

```bash
npx expo start
```

Pilih platform yang diinginkan:

- **Expo Go** — scan QR code di perangkat fisik
- **Android Emulator** — tekan `a`
- **iOS Simulator** — tekan `i`

### 3. Konfigurasi backend (opsional)

Untuk development lokal, ubah `BASE_URL` di `services/api.ts`:

```ts
const BASE_URL = "http://192.168.x.x:3000/api";
```

---

## 📚 Dokumentasi Lengkap

| File | Isi |
|---|---|
| [docs/FEATURES.md](docs/FEATURES.md) | Penjelasan detail setiap fitur |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arsitektur, tech stack, alur kerja |
| [docs/API.md](docs/API.md) | Semua endpoint API |
| [docs/DATA_MODELS.md](docs/DATA_MODELS.md) | Skema database & model data |
