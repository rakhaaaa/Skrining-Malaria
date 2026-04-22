import { getAuthToken } from "./auth";

// BASE_URL adalah alamat backend Flask yang dipakai aplikasi saat mengirim data.
const BASE_URL = "http://172.16.59.245:5000";

async function request(path, options = {}) {
  try {
    // Semua request ke backend dilewatkan ke fungsi ini supaya penanganannya rapi di satu tempat.
    const { auth, ...fetchOptions } = options;
    const token = auth ? await getAuthToken() : null;
    const headers = {
      ...(fetchOptions.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const response = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Gagal menghubungi server");
    }
    return response;
  } catch (error) {
    if (error.message && error.message !== "Failed to fetch" && error.message !== "Network request failed") {
      throw error;
    }
    // Pesan ini ditampilkan kalau aplikasi tidak bisa tersambung ke backend.
    throw new Error(
      "Tidak bisa terhubung ke backend. Pastikan server Flask aktif, perangkat satu jaringan, dan BASE_URL di src/utils/api.js sudah benar."
    );
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
  const response = await request("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return await response.json();
}

export async function loginUser(formData) {
  const response = await request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  return await response.json();
}

export async function getCurrentUser() {
  const response = await request("/me", { auth: true });
  return await response.json();
}

export async function logoutUser() {
  const response = await request("/logout", {
    method: "POST",
    auth: true,
  });
  return await response.json();
}

export async function checkHealth() {
  // Fungsi ini dipakai untuk mengecek apakah backend sedang aktif.
  const response = await request("/health");
  return response.ok;
}
