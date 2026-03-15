import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "screening_history";

export async function saveHistory(recordOrArray) {
  try {
    if (Array.isArray(recordOrArray)) {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(recordOrArray));
    } else {
      const existing = await getHistory();
      const updated = [recordOrArray, ...existing].slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Gagal menyimpan riwayat:", e);
  }
}

export async function getHistory() {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
