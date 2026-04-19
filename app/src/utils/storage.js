import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSession } from "./auth";

// Riwayat disimpan per akun supaya data pasien antar user tidak tercampur.
const HISTORY_KEY_PREFIX = "screening_history";

async function getHistoryKey() {
  const session = await getSession();
  const userId = session?.user?.id;
  return userId ? `${HISTORY_KEY_PREFIX}_${userId}` : `${HISTORY_KEY_PREFIX}_guest`;
}

export async function saveHistory(recordOrArray) {
  try {
    const historyKey = await getHistoryKey();
    // Kalau yang dikirim array, berarti semua isi riwayat akan diganti sekaligus.
    if (Array.isArray(recordOrArray)) {
      await AsyncStorage.setItem(historyKey, JSON.stringify(recordOrArray));
    } else {
      // Kalau yang dikirim satu data, data baru disimpan di urutan paling atas.
      const existing = await getHistory();
      const updated = [recordOrArray, ...existing].slice(0, 50);
      await AsyncStorage.setItem(historyKey, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Gagal menyimpan riwayat:", e);
  }
}

export async function getHistory() {
  try {
    const historyKey = await getHistoryKey();
    // Fungsi ini mengambil semua data riwayat dari penyimpanan lokal.
    const data = await AsyncStorage.getItem(historyKey);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    // Kalau terjadi error saat membaca data, kembalikan array kosong supaya aplikasi tetap aman.
    return [];
  }
}

export async function clearHistory() {
  const historyKey = await getHistoryKey();
  // Fungsi ini dipakai untuk menghapus seluruh riwayat yang tersimpan.
  await AsyncStorage.removeItem(historyKey);
}
