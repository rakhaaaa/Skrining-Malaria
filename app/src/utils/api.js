import { getAuthToken } from "./auth";

// BASE_URL adalah alamat backend Flask yang dipakai aplikasi saat mengirim data.
const BASE_URL = "http://192.168.110.238:5000";
const REQUEST_TIMEOUT_MS = 8000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Semua request ke backend dilewatkan ke fungsi ini supaya penanganannya rapi di satu tempat.
    const { auth, ...fetchOptions } = options;
    const token = auth ? await getAuthToken() : null;
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
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Gagal menghubungi server");
    }
    return response;
  } catch (error) {
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

export async function createScreening(record) {
  const response = await request("/screenings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    auth: true,
  });
  return await response.json();
}

export async function getScreenings() {
  const response = await request("/screenings", { auth: true });
  return await response.json();
}

export async function replaceScreenings(items) {
  const response = await request("/screenings/replace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
    auth: true,
  });
  return await response.json();
}

export async function clearScreenings() {
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
