import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Modal } from "react-native";
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
  const [messageModal, setMessageModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error",
    onClose: null,
  });

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

  const showMessage = ({ title, message, type = "error", onClose = null }) => {
    setMessageModal({ visible: true, title, message, type, onClose });
  };

  const closeMessage = () => {
    const onClose = messageModal.onClose;
    setMessageModal(prev => ({ ...prev, visible: false, onClose: null }));
    if (onClose) onClose();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      showMessage({ title: "Data belum lengkap", message: "Isi username dan password terlebih dahulu." });
      return;
    }

    setLoading(true);
    try {
      const session = await loginUser({ username: username.trim(), password });
      await saveSession(session);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (error) {
      showMessage({ title: "Login gagal", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !username.trim() || !password || !confirmPassword) {
      showMessage({ title: "Data belum lengkap", message: "Lengkapi semua data registrasi terlebih dahulu." });
      return;
    }
    if (password !== confirmPassword) {
      showMessage({ title: "Password tidak cocok", message: "Konfirmasi password harus sama dengan password." });
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
      showMessage({
        title: "Registrasi berhasil",
        message: "Akun sudah dibuat. Silakan login.",
        type: "success",
        onClose: () => {
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        },
      });
    } catch (error) {
      showMessage({ title: "Registrasi gagal", message: error.message });
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
            <Image source={require("../../assets/malaria.png")} style={styles.logoImg} />
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

      <Modal
        transparent
        visible={messageModal.visible}
        animationType="fade"
        onRequestClose={closeMessage}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.messageModal}>
            <View style={[
              styles.modalIcon,
              messageModal.type === "success" ? styles.modalIconSuccess : styles.modalIconError,
            ]}>
              <Ionicons
                name={messageModal.type === "success" ? "checkmark-circle-outline" : "alert-circle-outline"}
                size={28}
                color={messageModal.type === "success" ? "#B39DDB" : "#FF4F6B"}
              />
            </View>
            <Text style={styles.modalTitle}>{messageModal.title}</Text>
            <Text style={styles.modalDesc}>{messageModal.message}</Text>
            <TouchableOpacity
              style={[
                styles.modalActionBtn,
                messageModal.type === "success" ? styles.modalActionSuccess : styles.modalActionError,
              ]}
              onPress={closeMessage}
              activeOpacity={0.85}
            >
              <Text style={styles.modalActionText}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0A0F1E" },
  body:            { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 48 },
  logoBox:         { width: 82, height: 82, borderRadius: 20, backgroundColor: "rgba(179,157,219,0.08)", borderWidth: 1, borderColor: "rgba(179,157,219,0.22)", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  logoImg:         { width: 68, height: 68, borderRadius: 16 },
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
  modalOverlay:    { flex: 1, backgroundColor: "rgba(10,15,30,0.78)", alignItems: "center", justifyContent: "center", padding: 24 },
  messageModal:    { width: "100%", maxWidth: 340, backgroundColor: "#141B2D", borderRadius: 18, padding: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  modalIcon:       { width: 54, height: 54, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1 },
  modalIconSuccess:{ backgroundColor: "rgba(179,157,219,0.1)", borderColor: "rgba(179,157,219,0.24)" },
  modalIconError:  { backgroundColor: "rgba(255,79,107,0.1)", borderColor: "rgba(255,79,107,0.24)" },
  modalTitle:      { fontSize: 18, fontWeight: "800", color: "#EEF2FF", marginBottom: 8 },
  modalDesc:       { fontSize: 13, color: "#7B87A6", lineHeight: 20, marginBottom: 20 },
  modalActionBtn:  { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalActionSuccess: { backgroundColor: "#B39DDB" },
  modalActionError:{ backgroundColor: "#FF4F6B" },
  modalActionText: { fontSize: 14, fontWeight: "800", color: "#0A0F1E" },
});
