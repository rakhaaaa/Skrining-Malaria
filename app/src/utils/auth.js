// Mengimpor AsyncStorage utk simpan dan mengambil data secara lokal di perangkat.
import AsyncStorage from "@react-native-async-storage/async-storage";

// AUTH_KEY adalah nama key penyimpanan sesi login di memori lokal perangkat.
const AUTH_KEY = "auth_session";

export async function saveSession(session) {
  // Menyimpan data sesi login seperti token, user, dan waktu kedaluwarsa.
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export async function getSession() {
  try {
    // Mengambil data sesi login yang terakhir disimpan.
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Jika data rusak atau gagal dibaca, kembalikan null agar aplikasi meminta login ulang.
    return null;
  }
}

export async function getAuthToken() {
  // Mengambil hanya token autentikasi dari sesi yang tersimpan.
  const session = await getSession();
  return session?.token || null;
}

export async function clearSession() {
  // Menghapus sesi login dari penyimpanan lokal saat user logout.
  await AsyncStorage.removeItem(AUTH_KEY);
}
