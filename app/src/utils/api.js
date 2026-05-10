import { getAuthToken } from "./auth";

// BASE_URL adalah alamat backend Flask yang dipakai aplikasi saat mengirim data.
const BASE_URL = "http://192.168.110.247:5000";
// REQUEST_TIMEOUT_MS membatasi lama request agar aplikasi tidak menunggu terlalu lama.
const REQUEST_TIMEOUT_MS = 8000;

async function request(path, options = {}) {
  // AbortController dipakai untuk menghentikan request jika melewati batas waktu.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Semua request ke backend dilewatkan ke fungsi ini supaya penanganannya rapi di satu tempat.
    // Opsi auth menentukan apakah request harus mengirim token login atau tidak.
    const { auth, ...fetchOptions } = options;
    const token = auth ? await getAuthToken() : null;
    // Header bawaan request digabung dengan token Bearer jika endpoint membutuhkan autentikasi.
    const headers = {
      ...(fetchOptions.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      // Jika backend mengirim pesan error terstruktur, tampilkan pesan itu ke frontend.
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Gagal menghubungi server");
    }
    return response;
  } catch (error) {
    // Error validasi dari backend diteruskan apa adanya, sedangkan error jaringan dibungkus pesan umum.
    if (
      error.message &&
      error.name !== "AbortError" &&
      error.message !== "Failed to fetch" &&
      error.message !== "Network request failed"
    ) {
      throw error;
    }
    // Pesan ini ditampilkan kalau aplikasi tidak bisa tersambung ke backend.
    throw new Error(
      "Tidak bisa terhubung ke backend. Pastikan server Flask aktif, perangkat satu jaringan, dan BASE_URL di src/utils/api.js sudah benar."
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function predictMalaria(formData) {
  // Fungsi ini mengirim data form ke endpoint /predict untuk diproses model.
  const response = await request("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
    auth: true,
  });
  return await response.json();
}

export async function registerUser(formData) {
  // Membuat akun baru melalui endpoint register.
  const response = await request("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return await response.json();
}

export async function loginUser(formData) {
  // Mengirim username dan password ke backend untuk proses login.
  const response = await request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return await response.json();
}

export async function getCurrentUser() {
  // Mengambil data user yang sedang login berdasarkan token yang tersimpan.
  const response = await request("/me", { auth: true });
  return await response.json();
}

export async function logoutUser() {
  // Mengakhiri sesi login aktif di backend.
  const response = await request("/logout", {
    method: "POST",
    auth: true,
  });
  return await response.json();
}

export async function createScreening(record) {
  // Menyimpan satu hasil skrining baru ke database backend.
  const response = await request("/screenings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    auth: true,
  });
  return await response.json();
}

export async function getScreenings() {
  // Mengambil semua data skrining milik akun yang sedang login.
  const response = await request("/screenings", { auth: true });
  return await response.json();
}

export async function replaceScreenings(items) {
  // Mengganti seluruh riwayat skrining akun aktif, biasanya dipakai setelah hapus sebagian riwayat.
  const response = await request("/screenings/replace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
    auth: true,
  });
  return await response.json();
}

export async function clearScreenings() {
  // Menghapus semua riwayat skrining milik akun aktif.
  const response = await request("/screenings", {
    method: "DELETE",
    auth: true,
  });
  return await response.json();
}

export async function checkHealth() {
  // Fungsi ini dipakai untuk mengecek apakah backend sedang aktif.
  const response = await request("/health");
  return response.ok;
}
