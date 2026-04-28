import { clearScreenings, createScreening, getScreenings, replaceScreenings } from "./api";

export async function saveHistory(recordOrArray) {
  try {
    if (Array.isArray(recordOrArray)) {
      const response = await replaceScreenings(recordOrArray);
      return response.items || [];
    }

    const response = await createScreening(recordOrArray);
    return response.item || null;
  } catch (e) {
    console.error("Gagal menyimpan riwayat:", e);
    throw e;
  }
}

export async function getHistory() {
  try {
    const response = await getScreenings();
    return response.items || [];
  } catch (e) {
    return [];
  }
}

export async function clearHistory() {
  await clearScreenings();
}
