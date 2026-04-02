# 🗃️ Data Models & Database Schema

Duit Log menggunakan **MongoDB** sebagai database melalui backend yang di-deploy di Vercel. Berikut adalah skema setiap model data yang digunakan.

---

## User

Menyimpan informasi akun pengguna.

```ts
{
  _id:        ObjectId,         // ID unik MongoDB
  name:       string,           // Nama lengkap pengguna
  email:      string,           // Email (unik)
  password:   string,           // Password yang sudah di-hash
  balance:    number,           // Saldo total pengguna
  createdAt:  Date,
  updatedAt:  Date
}
```

---

## Transaction

Menyimpan setiap transaksi keuangan (pemasukan dan pengeluaran).

```ts
{
  _id:          ObjectId,               // ID unik MongoDB
  user:         ObjectId,               // Referensi ke User
  amount:       number,                 // Nominal transaksi
  type:         'income' | 'expense',   // Tipe transaksi
  category:     ObjectId,               // Referensi ke Category
  wallet:       ObjectId,               // Referensi ke Wallet
  description:  string | null,          // Catatan opsional
  date:         Date,                   // Tanggal transaksi
  createdAt:    Date,
  updatedAt:    Date
}
```

---

## Category

Menyimpan kategori kustom untuk klasifikasi transaksi.

```ts
{
  _id:        ObjectId,               // ID unik MongoDB
  user:       ObjectId,               // Referensi ke User (pemilik)
  name:       string,                 // Nama kategori (misal: "Makan", "Gaji")
  type:       'expense' | 'income',   // Tipe kategori
  color:      string | null,          // Warna hex (misal: "#ef4444")
  isVisible:  boolean,                // Apakah kategori ditampilkan (default: true)
  createdAt:  Date,
  updatedAt:  Date
}
```

---

## Wallet

Menyimpan dompet/rekening keuangan pengguna.

```ts
{
  _id:       ObjectId,                              // ID unik MongoDB
  user:      ObjectId,                              // Referensi ke User (pemilik)
  name:      string,                                // Nama dompet (unik per pengguna)
  type:      'bank' | 'e-wallet' | 'cash' | 'other', // Tipe dompet
  balance:   number,                                // Saldo dompet
  color:     string | null,                         // Warna hex (misal: "#2563eb")
  isActive:  boolean,                               // Status aktif (default: true)
  createdAt: Date,
  updatedAt: Date
}
```

---

## Bill

Menyimpan tagihan berulang yang memiliki jadwal notifikasi.

```ts
{
  _id:       ObjectId,             // ID unik MongoDB
  user:      ObjectId,             // Referensi ke User (pemilik)
  name:      string,               // Nama tagihan (misal: "Netflix", "Listrik")
  amount:    number,               // Jumlah tagihan
  dueDay:    number,               // Hari jatuh tempo (1–31)
  frequency: 'MONTHLY' | 'YEARLY', // Frekuensi pembayaran
  dueMonth:  number | undefined,   // Bulan jatuh tempo (0=Jan ... 11=Des), hanya jika YEARLY
  createdAt: Date,
  updatedAt: Date
}
```

---

## AppStatus

Model sementara (dibaca dari API, tidak disimpan di client) untuk status server.

```ts
{
  isAvailable:       boolean,          // Apakah server tersedia
  isMaintenance:     boolean,          // Apakah sedang maintenance
  message:           string,           // Pesan status
  maintenanceStart:  Date | undefined, // Waktu mulai maintenance (opsional)
  maintenanceEnd:    Date | undefined, // Waktu selesai maintenance (opsional)
  notes:             string | undefined, // Catatan tambahan (opsional)
  lastUpdated:       Date
}
```

---

## Relasi Antar Model

```
User
 ├── Transaction (1 → banyak)
 │     ├── → Category
 │     └── → Wallet
 ├── Category    (1 → banyak)
 ├── Wallet      (1 → banyak)
 └── Bill        (1 → banyak)
```

Setiap pengguna memiliki data yang terisolasi — kategori, dompet, transaksi, dan tagihan satu pengguna tidak dapat diakses oleh pengguna lain.
