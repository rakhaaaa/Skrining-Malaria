// Ganti BASE_URL dengan IP komputer kamu
// Cara cek IP: buka CMD â†’ ketik ipconfig â†’ lihat IPv4 Address
const BASE_URL = "http://192.168.110.238:9000";

export async function predictMalaria(formData) {
  const response = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  if (!response.ok) throw new Error("Gagal menghubungi server");
  return await response.json();
}

export async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  return response.ok;
}
