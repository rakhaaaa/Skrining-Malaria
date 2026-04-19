# MalariaCheck — Aplikasi Skrining Malaria
Rakha Naufal Sujana · NPM 535220006 · Universitas Tarumanagara

## LANGKAH 1 — Jalankan Backend (Flask)

Buka terminal di VSCode, masuk ke folder backend:

```bash
cd backend
pip install -r requirements.txt
conda activate malaria
python app.py
```

Backend berjalan di: `http://localhost:5000 // 8081 `

---

## LANGKAH 2 — Sambungkan IP ke App

1. Cari IP komputer kamu:
   - Windows: buka CMD → ketik `ipconfig`
   - Mac/Linux: buka Terminal → ketik `ifconfig`
   - Catat IP (contoh: `192.168.100.100`)

2. Buka file `app/src/utils/api.js`
3. Ganti baris:
   ```js
   const BASE_URL = "http://192.1.10.100:8081"; // contoh
   ```
   Dengan IP komputer kamu.

---

## LANGKAH 3 — Jalankan Aplikasi (React Native Expo)

Install Node.js terlebih dahulu dari https://nodejs.org

Buka terminal baru di VSCode, masuk ke folder app:

```bash
cd app
npm install
npx expo start
```

Setelah QR code muncul:

### Opsi A — Pakai HP Fisik (Rekomendasi)
1. Install aplikasi **Expo Go** di HP (Android/iOS)
2. Scan QR code yang muncul di terminal
3. Pastikan HP dan komputer dalam satu jaringan WiFi

### Opsi B — Pakai Emulator Android
1. Install Android Studio (hanya untuk emulator, bukan untuk coding)
2. Buat Virtual Device (AVD)
3. Tekan `a` di terminal Expo

### Opsi C — Jalankan di Browser (Web)
```bash
npx expo start --web
```
Buka `http://localhost:8081` di browser.

---

## Catatan

- File `best_model_catboost.pkl` harus ada di folder `backend/`
- Backend harus berjalan sebelum aplikasi digunakan
- Hasil skrining disimpan secara lokal di HP (AsyncStorage)
- Laporan PDF dapat diunduh dan dibagikan dari halaman Hasil
