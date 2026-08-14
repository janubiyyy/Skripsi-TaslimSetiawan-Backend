# 🚦 Skripsi Backend — Analisis Pola Lalu Lintas Lebaran

> Backend API untuk sistem analisis dan visualisasi pola lalu lintas kendaraan selama libur panjang Lebaran menggunakan **K-Means Clustering** dan **Time Series**.

---

## 📦 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| ORM | Sequelize v6 + mysql2 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Upload | multer v2 |
| CSV Parsing | csv-parse |
| Security | helmet, cors, express-rate-limit |
| Dev | nodemon, morgan |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd skripsi-backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env dan isi DB_PASSWORD dengan password MySQL Anda
```

### 3. Buat Database MySQL

```sql
CREATE DATABASE skripsi_lalin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Jalankan Seeder (buat user admin)

```bash
npm run seed
```

Output:
```
✅ User admin "admin" berhasil dibuat.
   Password: Admin@123
   ⚠️  Segera ubah password setelah login pertama!
```

### 5. Jalankan Server

```bash
npm run dev   # Development (auto-reload dengan nodemon)
npm start     # Production
```

Server berjalan di: `http://localhost:5000`

---

## 📁 Struktur Folder

```
skripsi-backend/
├── src/
│   ├── config/
│   │   ├── database.js          ← Sequelize MySQL connection
│   │   └── env.js               ← Validasi env vars
│   ├── models/
│   │   ├── index.js             ← Load semua model + relasi
│   │   ├── User.js              ← users table
│   │   ├── Dataset.js           ← datasets table
│   │   ├── PreprocessingResult.js
│   │   └── KmeansCluster.js
│   ├── controllers/             ← HTTP layer (request/response)
│   ├── services/                ← Business logic
│   ├── routes/                  ← Route definitions
│   ├── middlewares/
│   │   ├── auth.middleware.js   ← JWT verify
│   │   ├── role.middleware.js   ← RBAC (admin/viewer)
│   │   └── errorHandler.js     ← Global error handler
│   ├── utils/
│   │   ├── response.js          ← Standard API response
│   │   ├── jwt.js               ← Sign/verify token
│   │   └── hash.js              ← bcrypt helpers
│   └── app.js                   ← Express app
├── seeders/
│   └── adminSeeder.js
├── uploads/                     ← Temp storage CSV upload
├── .env.example
├── .env                         ← ⚠️ JANGAN COMMIT!
├── package.json
└── server.js                    ← Entry point
```

---

## 🗄️ Database Schema

### `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | Auto increment |
| username | VARCHAR(100) UNIQUE | Nama pengguna |
| password_hash | VARCHAR(255) | bcrypt hash |
| role | ENUM('admin','viewer') | Default: viewer |
| createdAt | DATETIME | |
| updatedAt | DATETIME | |

### `datasets`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT UNSIGNED PK | |
| gerbang | VARCHAR(150) | Nama gerbang tol |
| tahun | SMALLINT | Tahun data |
| indeks_hari | VARCHAR(20) | H-7 s/d H+7 |
| v_masuk | INT UNSIGNED | Volume masuk |
| v_keluar | INT UNSIGNED | Volume keluar |
| v_total | INT UNSIGNED | Volume total |
| tanggal | DATE | |
| hari | VARCHAR(20) | Nama hari |
| urutan_hari | TINYINT | |

### `preprocessing_results`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT PK | |
| dataset_id | INT FK → datasets.id | |
| volume_masuk_scaled | DECIMAL(10,8) | Min-Max scaled 0–1 |
| volume_keluar_scaled | DECIMAL(10,8) | Min-Max scaled 0–1 |
| cluster_label | TINYINT | Hasil K-Means |

### `kmeans_clusters`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | INT PK | |
| k_value | TINYINT | Nilai K |
| centroid_masuk | DECIMAL(10,8) | |
| centroid_keluar | DECIMAL(10,8) | |
| cluster_label | VARCHAR(50) | Sangat Tinggi/dst |
| member_count | INT | Jumlah anggota |
| inertia | FLOAT | SSE Elbow Method |
| silhouette_score | FLOAT | Opsional |
| run_id | VARCHAR(36) | UUID per-run |

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| POST | `/api/auth/login` | ❌ | Login admin |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/me` | ✅ | Profile user |
| PATCH | `/api/auth/change-password` | ✅ | Ganti password |

### Dataset
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/datasets` | any | List (paginated) |
| GET | `/api/datasets/:id` | any | Detail |
| POST | `/api/datasets/upload` | admin | Upload CSV |
| DELETE | `/api/datasets/reset` | admin | Hapus semua |
| GET | `/api/datasets/meta/gerbang` | any | List gerbang |
| GET | `/api/datasets/meta/tahun` | any | List tahun |

### Preprocessing
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| GET | `/api/preprocessing` | any | Hasil scaling |
| POST | `/api/preprocessing/run` | admin | Jalankan scaling |

### K-Means
| Method | Endpoint | Role | Keterangan |
|--------|----------|------|------------|
| POST | `/api/kmeans/run` | admin | Jalankan K-Means |
| GET | `/api/kmeans/results/:k` | any | Hasil untuk K |
| GET | `/api/kmeans/available-k` | any | K yang tersedia |

---

## 📤 Format CSV Upload

```csv
id,gerbang,tahun,indeks_hari,v_masuk,v_keluar,v_total,tanggal,hari,urutan_hari
1,Cikampek Utama,2024,H-7,5230,4102,9332,2024-04-03,Rabu,1
2,Cikampek Utama,2024,H-6,6814,3890,10704,2024-04-04,Kamis,2
```

---

## 🔑 Contoh Request

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123"}'
```

### Upload CSV (dengan token)
```bash
curl -X POST http://localhost:5000/api/datasets/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@data_lalin.csv"
```

### Run K-Means (K=3)
```bash
curl -X POST http://localhost:5000/api/kmeans/run \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"k": 3}'
```

---

## ⚠️ Catatan Penting

1. **Urutan workflow**: Upload CSV → Run Preprocessing → Run K-Means
2. **JWT bersifat stateless**: logout hanya delete token di sisi client/frontend
3. **Preprocessing** akan menghapus hasil lama dan menghitung ulang
4. **K-Means** menggunakan **K-Means++** initialization untuk hasil lebih stabil
5. Edit `.env` → `DB_PASSWORD` sebelum menjalankan server
