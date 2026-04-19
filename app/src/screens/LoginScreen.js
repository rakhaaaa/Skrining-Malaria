import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { loginUser, registerUser } from "../utils/api";
import { saveSession } from "../utils/auth";

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isRegister = mode === "register";

  const resetForm = () => {
    setFullName("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRole("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    resetForm();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Data belum lengkap", "Isi username dan password terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const session = await loginUser({ username: username.trim(), password });
      await saveSession(session);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (error) {
      Alert.alert("Login gagal", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !password || !confirmPassword) {
      Alert.alert("Data belum lengkap", "Lengkapi semua data registrasi terlebih dahulu.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password tidak cocok", "Konfirmasi password harus sama dengan password.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        full_name: fullName.trim(),
        username: username.trim(),
        password,
        role: role.trim() || "Pengguna",
      });
      Alert.alert("Registrasi berhasil", "Akun sudah dibuat. Silakan login.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert("Registrasi gagal", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.logoBox}>
            <Ionicons name="medical" size={36} color="#B39DDB" />
          </View>
          <Text style={styles.title}>{isRegister ? "Registrasi Pengguna" : "Login Pengguna"}</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? "Buat akun pengguna untuk mengakses MalariaCheck."
              : "Masuk untuk menggunakan fitur skrining dan riwayat pemeriksaan."}
          </Text>

          <View style={styles.card}>
            {isRegister && (
              <>
                <Text style={styles.label}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: dr. Andi Pratama"
                  placeholderTextColor="#4A5568"
                  value={fullName}
                  onChangeText={setFullName}
                />

                <Text style={styles.label}>Role</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Dokter"
                  placeholderTextColor="#4A5568"
                  value={role}
                  onChangeText={setRole}
                />
              </>
            )}

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan username"
              placeholderTextColor="#4A5568"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Masukkan password"
                placeholderTextColor="#4A5568"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(prev => !prev)} activeOpacity={0.75}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#7B87A6" />
              </TouchableOpacity>
            </View>

            {isRegister && (
              <>
                <Text style={styles.label}>Konfirmasi Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Ulangi password"
                    placeholderTextColor="#4A5568"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(prev => !prev)} activeOpacity={0.75}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#7B87A6" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0A0F1E" />
              ) : (
                <>
                  <Ionicons name={isRegister ? "person-add" : "log-in"} size={18} color="#0A0F1E" />
                  <Text style={styles.btnPrimaryText}>{isRegister ? "Daftar Akun" : "Login"}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={switchMode} activeOpacity={0.85}>
              <Text style={styles.switchText}>
                {isRegister ? "Sudah punya akun? Login" : "Belum punya akun? Register"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0A0F1E" },
  body:            { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 48 },
  logoBox:         { width: 76, height: 76, borderRadius: 18, backgroundColor: "rgba(179,157,219,0.1)", borderWidth: 1, borderColor: "rgba(179,157,219,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  title:           { fontSize: 27, fontWeight: "800", color: "#EEF2FF", lineHeight: 34 },
  subtitle:        { fontSize: 13, color: "#7B87A6", lineHeight: 20, marginTop: 8, marginBottom: 24 },
  card:            { backgroundColor: "#141B2D", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  label:           { fontSize: 13, fontWeight: "600", color: "#EEF2FF", marginBottom: 8 },
  input:           { backgroundColor: "#0F1628", borderRadius: 12, padding: 14, fontSize: 14, color: "#EEF2FF", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14 },
  passwordWrap:    { minHeight: 50, flexDirection: "row", alignItems: "center", backgroundColor: "#0F1628", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14 },
  passwordInput:   { flex: 1, paddingVertical: 14, paddingLeft: 14, paddingRight: 8, fontSize: 14, color: "#EEF2FF" },
  eyeBtn:          { width: 48, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  btnPrimary:      { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#B39DDB", borderRadius: 14, padding: 15, marginTop: 4 },
  btnPrimaryText:  { fontSize: 15, fontWeight: "800", color: "#0A0F1E" },
  switchBtn:       { alignItems: "center", paddingTop: 16 },
  switchText:      { fontSize: 13, color: "#B39DDB", fontWeight: "700" },
});
