// Mengimpor fungsi-fungsi API utk mengambil, menambah, menghapus, dan mengganti data screening.
import { clearScreenings, createScreening, getScreenings, replaceScreenings } from "./api";

export async function saveHistory(recordOrArray) {
  try {
    // Jika yang diterima array, seluruh riwayat akun akan diganti sekaligus.
    if (Array.isArray(recordOrArray)) {
      const response = await replaceScreenings(recordOrArray);
      return response.items || [];
    }

    // Jika yang diterima satu objek, buat satu data skrining baru di backend.
    const response = await createScreening(recordOrArray);
    return response.item || null;
  } catch (e) {
    console.error("Gagal menyimpan riwayat:", e);
    throw e;
  }
}

export async function getHistory() {
  try {
    // Mengambil seluruh riwayat skrining milik akun yang sedang login dari backend.
    const response = await getScreenings();
    return response.items || [];
  } catch (e) {
    // Kalau backend gagal dihubungi, kembalikan array kosong supaya layar tetap aman dirender.
    return [];
  }
}

export async function clearHistory() {
  // Menghapus semua riwayat skrining milik akun yang sedang login di backend.
  await clearScreenings();
}
