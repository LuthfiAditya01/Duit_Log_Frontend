# 🌐 API Endpoints

Base URL: `https://duit-log-backend.vercel.app/api`

Semua endpoint (kecuali `/status`, `/auth/register`, dan `/auth/login`) memerlukan header:

```
Authorization: Bearer <token>
```

---

## Autentikasi

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/auth/register` | Daftar akun baru |
| `POST` | `/auth/login` | Login dan dapatkan token |
| `GET` | `/auth/me` | Ambil profil pengguna saat ini |
| `PUT` | `/auth/me` | Perbarui profil (nama, email) |
| `PUT` | `/auth/change-password` | Ganti password |

### POST /auth/register

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

### POST /auth/login

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "user": { ... }
}
```

### PUT /auth/change-password

**Request Body:**
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

---

## Transaksi

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/transactions` | Daftar transaksi (bisa filter) |
| `POST` | `/transactions` | Buat transaksi baru |
| `PUT` | `/transactions/:id` | Perbarui transaksi |
| `DELETE` | `/transactions/:id` | Hapus transaksi |

### GET /transactions

**Query Parameters:**
| Parameter | Tipe | Deskripsi |
|---|---|---|
| `month` | number | Bulan (1–12) |
| `year` | number | Tahun (misal: 2024) |

**Response:**
```json
[
  {
    "_id": "string",
    "amount": 50000,
    "type": "expense",
    "category": { "_id": "...", "name": "Makan", "color": "#ff0000" },
    "wallet": { "_id": "...", "name": "BCA" },
    "description": "Makan siang",
    "date": "2024-01-15T00:00:00.000Z"
  }
]
```

### POST /transactions

**Request Body:**
```json
{
  "amount": 50000,
  "type": "expense",
  "category": "category_id",
  "wallet": "wallet_id",
  "description": "Makan siang",
  "date": "2024-01-15"
}
```

---

## Kategori

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/categories` | Daftar semua kategori |
| `GET` | `/categories/:id` | Detail satu kategori |
| `POST` | `/categories` | Buat kategori baru |
| `PUT` | `/categories/:id` | Perbarui kategori |
| `DELETE` | `/categories/:id` | Hapus kategori |

### POST /categories

**Request Body:**
```json
{
  "name": "Transportasi",
  "type": "expense",
  "color": "#3b82f6",
  "isVisible": true
}
```

---

## Dompet (Wallet)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/wallet` | Daftar semua dompet |
| `GET` | `/wallet/:id` | Detail satu dompet |
| `POST` | `/wallet` | Buat dompet baru |
| `PUT` | `/wallet/:id` | Perbarui dompet |
| `DELETE` | `/wallet/:id` | Hapus dompet (soft/hard) |

### POST /wallet

**Request Body:**
```json
{
  "name": "BCA",
  "type": "bank",
  "balance": 1500000,
  "color": "#2563eb",
  "isActive": true
}
```

### Logika DELETE /wallet/:id

- Jika dompet digunakan dalam transaksi → **soft delete** (set `isActive: false`).
- Jika dompet belum pernah digunakan → **hard delete** (dihapus dari database).

---

## Tagihan (Bills)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/bills` | Daftar semua tagihan |
| `GET` | `/bills/:id` | Detail satu tagihan |
| `POST` | `/bills` | Buat tagihan baru |
| `PUT` | `/bills/:id` | Perbarui tagihan |
| `DELETE` | `/bills/:id` | Hapus tagihan |

### POST /bills

**Request Body:**
```json
{
  "name": "Netflix",
  "amount": 54000,
  "dueDay": 15,
  "frequency": "MONTHLY"
}
```

Untuk tagihan tahunan:
```json
{
  "name": "Domain",
  "amount": 150000,
  "dueDay": 1,
  "frequency": "YEARLY",
  "dueMonth": 0
}
```

> `dueMonth`: 0 = Januari, 1 = Februari, ..., 11 = Desember

---

## Status Server

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/status` | Status server / maintenance | ❌ Tidak diperlukan |

**Response:**
```json
{
  "isAvailable": true,
  "isMaintenance": false,
  "message": "Server is running normally",
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```
