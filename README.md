# Classify — Academic Task & Trivia Platform (TIF PK 23)

Classify adalah platform manajemen tugas akademik dan kuis trivia interaktif yang dirancang khusus untuk memenuhi kebutuhan koordinasi kuliah **Kelas TIF PK 23 (Teknik Informatika)**.

Aplikasi ini awalnya dibangun menggunakan database NoSQL **Firebase**. lalu sistem ini telah berhasil dimigrasi sepenuhnya ke database relasional SQL menggunakan **Supabase (PostgreSQL)** dengan backend **Express.js** dan frontend **React + Vite**. Hingga saat ini, Classify masih berada dalam fase pengembangan aktif untuk penyempurnaan fitur.

---

## Tujuan Platform

Aplikasi ini dibuat khusus sebagai wadah internal untuk mempermudah koordinasi, memantau pengumpulan tugas kuliah, serta menjadi sarana belajar interaktif melalui kuis trivia bagi seluruh mahasiswa **Kelas TIF PK 23**.

---

## Spesifikasi & Port Server

* **Frontend:** Berjalan di port default Vite (`http://localhost:5173`)
* **Backend Server (Express.js):** Berjalan di port **`3001`** (`http://localhost:3001`)
* **Database:** Supabase (PostgreSQL)

---

## Fitur Utama Sistem

* **Autentikasi Berbasis NIM**: Registrasi dan login aman menggunakan validasi Nomor Induk Mahasiswa (NIM) anggota kelas TIF PK 23.
* **Sistem Role-Based Access (RBAC)**: Pembagian hak akses yang jelas antara **Admin (Komisaris Kelas/)** dan **User (Mahasiswa TIF PK 23)**.
* **Distribusi Tugas Fleksibel**: Tugas dapat dibagikan secara global (*broadcast*) ke seluruh kelas atau ditargetkan secara spesifik ke beberapa mahasiswa tertentu saja.
* **Gamifikasi & Poin**: Selesai mengerjakan kuis trivia, skor akan otomatis terakumulasi ke profil mahasiswa untuk menaikkan peringkat mereka di papan skor (*leaderboard*).
* **Visualisasi Progress**: Dashboard interaktif yang menampilkan persentase penyelesaian tugas secara real-time menggunakan grafik visual dari Recharts.

---

## Hak Akses & Pembagian Halaman

### 1. Panel Admin

Halaman ini hanya dapat diakses oleh akun dengan role Admin (misalnya Komisaris Tingkat atau perwakilan kelas).

* **Dashboard Admin**:
* Melihat ringkasan jumlah mahasiswa aktif, total tugas yang rilis, dan kuis yang tersedia.


* **Manajemen Tugas (CRUD Tasks)**:
* Membuat tugas baru lengkap dengan detail mata kuliah, dosen pengampu, deskripsi, tingkat prioritas, dan tenggat waktu (*deadline*).
* Mengedit detail tugas atau menghapus tugas yang sudah tidak berlaku.
* Menentukan target mahasiswa yang wajib mengerjakan tugas tersebut (bisa *broadcast* ke seluruh kelas atau memilih mahasiswa tertentu saja).


* **Manajemen Kuis Trivia**:
* Membuat, mengedit, dan menghapus paket soal kuis trivia seputar dunia informatika untuk bahan latihan kelas.


* **Manajemen Jadwal Kuliah & Pengumuman**:
* Memperbarui jadwal kuliah mingguan kelas TIF PK 23 (hari, jam, ruang kelas, dan dosen).
* Menulis pengumuman penting (*broadcast*) yang akan langsung muncul di halaman depan mahasiswa.



---

### 2. Portal User (Mahasiswa TIF PK 23)

Halaman khusus yang didesain personal untuk setiap mahasiswa kelas TIF PK 23.

* **Dashboard Personal**:
* Melihat grafik persentase tugas yang sudah diselesaikan vs tugas yang masih menumpuk.
* Membaca pengumuman terbaru yang dipasang oleh Admin.


* **Daftar Tugas (Task List)**:
* Melihat daftar tugas kuliah yang ditugaskan khusus untuk dirinya.
* Menandai tugas sebagai "Selesai" atau membatalkannya secara instan lewat tombol *toggle checkbox*. Status ini otomatis memperbarui tabel progress di database.


* **Arena Kuis Trivia**:
* Mengakses dan mengerjakan kuis-kuis informatika yang tersedia untuk menguji pemahaman materi kuliah.


* **Leaderboard Kelas**:
* Melihat papan peringkat poin seluruh mahasiswa kelas TIF PK 23 berdasarkan keaktifan dan skor pengerjaan kuis kuis trivia.


* **Jadwal Kuliah**:
* Mengakses informasi jadwal kuliah harian agar tidak tertinggal info jam masuk, mata kuliah, maupun ruangan.


* **Profil Pengguna**:
* Melihat informasi pribadi (Nama, NIM TIF PK 23) serta total poin akumulasi dan jumlah kuis yang berhasil diselesaikan.



---

## Struktur Folder Proyek

```text
Classify/
├── dist/                     # Build production frontend (React)
├── server/                   # Backend Server (Express.js) - PORT 3001
│   ├── config/               # Inisialisasi koneksi SDK client Supabase
│   ├── routes/               # Handler API Router modular (auth, tasks, completions, dll.)
│   ├── .env                  # Environment Variables Server (Port 3001 & Secret Key)
│   ├── index.js              # Entry point utama jalannya server Express
│   └── package.json          # Dependencies backend
├── src/                      # Frontend Client (React)
│   ├── assets/               # Aset statis (gambar, ikon, & logo)
│   ├── components/           # Komponen UI reusable & visualisasi grafik Recharts
│   ├── layouts/              # Tata letak dashboard (Admin & User)
│   ├── pages/                # Halaman fungsional (Tugas, Kuis, Profil, dll.)
│   ├── services/             # Manajemen komunikasi API (api.js & supabase.js)
│   └── main.jsx              # Entry point utama React ke DOM
├── package.json              # Dependencies frontend
└── README.md                 # Dokumen laporan ini

```