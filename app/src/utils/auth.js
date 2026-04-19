import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "auth_session";

export async function saveSession(session) {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export async function getSession() {
  try {
    const data = await AsyncStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

export async function getAuthToken() {
  const session = await getSession();
  return session?.token || null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(AUTH_KEY);
}
