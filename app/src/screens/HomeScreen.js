import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getHistory } from "../utils/storage";
import { checkHealth, logoutUser } from "../utils/api";
import { clearSession, getSession } from "../utils/auth";

export default function HomeScreen() {
  // navigation dipakai untuk pindah ke halaman lain.
  const navigation = useNavigation();

  // recent menyimpan beberapa riwayat terbaru untuk ditampilkan di beranda.
  const [recent, setRecent] = useState([]);

  // modelActive menyimpan status apakah backend/model bisa dihubungi.
  const [modelActive, setModelActive] = useState(false);
  const [user, setUser] = useState(null);
  const displayRole = user?.role
    ? user.role.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase())
    : "Pengguna";

  // Fungsi kecil ini dipakai untuk membuat tombol fitur utama agar tidak perlu menulis kode berulang.
  const renderQuickAction = ({ label, icon, target }) => (
    <Pressable
      key={target}
      onPress={() => navigation.navigate(target)}
      style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnActive]}
    >
      <Ionicons name={icon} size={28} color="#B39DDB" style={{ marginBottom: 8 }} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );

  // Fungsi ini mengecek apakah backend/model sedang bisa dihubungi.
  const refreshModelStatus = async () => {
    try {
      const isHealthy = await checkHealth();
      setModelActive(isHealthy);
    } catch (error) {
      setModelActive(false);
    }
  };

  useEffect(() => {
    // Setiap kali halaman ini kembali aktif, data riwayat terbaru diambil ulang.
    const unsubscribe = navigation.addListener("focus", async () => {
      const hist = await getHistory();
      const session = await getSession();
      setUser(session?.user || null);
      setRecent(hist.slice(0, 3));
      await refreshModelStatus();
    });
    return unsubscribe;
  }, [navigation]);

  
  useEffect(() => {
    // Status backend dicek setiap 5 detik agar tulisan Model Aktif/Tidak Aktif berubah otomatis.
    refreshModelStatus();
    const intervalId = setInterval(refreshModelStatus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Keluar dari akun tenaga medis?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutUser();
          } catch (error) {
            // Session lokal tetap dibersihkan meskipun backend sedang tidak bisa dihubungi.
          }
          await clearSession();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

return (
    // Wadah utama halaman beranda.
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />

      {/* ScrollView dipakai supaya isi halaman tetap bisa digeser jika layar kecil. */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Bagian header: sapaan singkat dan ikon aplikasi. */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Selamat datang, {user?.full_name || "Pengguna"} Sebagai {displayRole}
            </Text>
            <Text style={styles.heading}>Deteksi <Text style={styles.headingAccent}>Malaria</Text></Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color="#FF4F6B" />
            </TouchableOpacity>
            <View style={styles.headerIcon}>
              <Image source={require("../../assets/malaria.png")} style={{ width: 34, height: 34, borderRadius: 8 }} />
            </View>
          </View>
        </View>

        {/* Kartu utama berisi penjelasan singkat model dan tombol mulai diagnosis. */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <View style={[styles.heroDot, !modelActive && styles.heroDotInactive]} />
            <Text style={[styles.heroBadgeText, !modelActive && styles.heroBadgeTextInactive]}>
              {modelActive ? "Model Aktif" : "Model Tidak Aktif"}
            </Text>
          </View>
          <Text style={styles.heroTitle}>Klasifikasi Penyakit Malaria menggunakan Light Gradient Boosting Machine (LightGBM) dan CatBoost</Text>
          <Text style={styles.heroDesc}>Masukkan hasil pemeriksaan lab darah untuk mendeteksi kemungkinan malaria secara cepat dan akurat.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate("Form")} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#0A0F1E" />
            <Text style={styles.btnPrimaryText}>Mulai Diagnosis Baru</Text>
          </TouchableOpacity>
        </View>

        {/* Tombol cepat ke halaman utama aplikasi. */}
        <Text style={styles.sectionTitle}>Fitur Utama</Text>
        <View style={styles.quickActions}>
          {renderQuickAction({ label: "Diagnosis Baru", icon: "flask-outline", target: "Form" })}
          {renderQuickAction({ label: "Riwayat", icon: "document-text-outline", target: "History" })}
          {renderQuickAction({ label: "Tentang", icon: "information-circle-outline", target: "About" })}
        </View>

        {/* Bagian ini menampilkan ringkasan riwayat terbaru. */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Terbaru</Text>
          <TouchableOpacity onPress={() => navigation.navigate("History")}>
            <Text style={styles.sectionLink}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {/* Kalau belum ada data, tampilkan pesan kosong. Kalau ada, tampilkan daftar riwayat terbaru. */}
        {recent.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyRecentText}>Belum ada riwayat pemeriksaan</Text>
          </View>
        ) : (
          recent.map((item, idx) => {
            const isPos = item.result === "Positive";
            return (
              <TouchableOpacity key={idx} style={styles.histItem} onPress={() => navigation.navigate("Result", { result: item })} activeOpacity={0.8}>
                <View style={[styles.histIcon, isPos ? styles.histIconPos : styles.histIconNeg]}>
                  <Ionicons name={isPos ? "alert-circle" : "checkmark-circle"} size={22} color={isPos ? "#FF4F6B" : "#B39DDB"} />
                </View>
                <View style={styles.histInfo}>
                  <Text style={styles.histName}>{item.patientName || "Pasien"}</Text>
                  <Text style={styles.histDate}>{item.date}</Text>
                </View>
                <View style={[styles.histBadge, isPos ? styles.histBadgePos : styles.histBadgeNeg]}>
                  <Text style={[styles.histBadgeText, isPos ? styles.textPos : styles.textNeg]}>
                    {isPos ? "Positif" : "Negatif"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Navigasi bawah dipakai untuk pindah cepat ke halaman utama lain. */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
          <Ionicons name="home" size={22} color="#B39DDB" />
          <Text style={[styles.navLabel, { color: "#B39DDB" }]}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Form")} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={22} color="#7B87A6" />
          <Text style={styles.navLabel}>Diagnosis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("History")} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={22} color="#7B87A6" />
          <Text style={styles.navLabel}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("About")} activeOpacity={0.8}>
          <Ionicons name="information-circle-outline" size={22} color="#7B87A6" />
          <Text style={styles.navLabel}>About</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Gaya dasar halaman beranda.
  container:      { flex: 1, backgroundColor: "#0A0F1E" },

  // Gaya header paling atas.
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  greeting:       { maxWidth: 245, fontSize: 13, color: "#7B87A6", marginBottom: 4, lineHeight: 19 },
  heading:        { fontSize: 26, fontWeight: "800", color: "#EEF2FF", lineHeight: 34 },
  headingAccent:  { color: "#B39DDB" },
  headerActions:  { flexDirection: "row", alignItems: "center", gap: 10 },
  logoutBtn:      { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,79,107,0.1)", borderWidth: 1, borderColor: "rgba(255,79,107,0.2)", alignItems: "center", justifyContent: "center" },
  headerIcon:     { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(179,157,219,0.1)", borderWidth: 1, borderColor: "rgba(179,157,219,0.2)", alignItems: "center", justifyContent: "center" },

  // Gaya kartu utama di beranda.
  heroCard:       { marginHorizontal: 20, backgroundColor: "#141B2D", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", marginBottom: 24 },
  heroBadge:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  heroDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: "#B39DDB" },
  heroDotInactive:{ backgroundColor: "#FF4F6B" },
  heroBadgeText:  { fontSize: 12, color: "#B39DDB", fontWeight: "600" },
  heroBadgeTextInactive: { color: "#FF4F6B" },
  heroTitle:      { fontSize: 15, fontWeight: "700", color: "#EEF2FF", lineHeight: 22, marginBottom: 10 },
  heroDesc:       { fontSize: 13, color: "#7B87A6", lineHeight: 20, marginBottom: 18 },
  btnPrimary:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#B39DDB", borderRadius: 12, padding: 14 },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#0A0F1E" },

  // Gaya section title dan quick action.
  sectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:   { fontSize: 15, fontWeight: "700", color: "#EEF2FF", paddingHorizontal: 20, marginBottom: 12 },
  sectionLink:    { fontSize: 13, color: "#B39DDB" },
  quickActions:   { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  quickBtn:       { flex: 1, backgroundColor: "#141B2D", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  quickBtnActive: { borderColor: "rgba(179,157,219,0.3)", backgroundColor: "rgba(179,157,219,0.05)" },
  quickIcon:      { fontSize: 28, marginBottom: 8 },
  quickLabel:     { fontSize: 12, color: "#EEF2FF", fontWeight: "600" },

  // Gaya daftar riwayat terbaru.
  histItem:       { flexDirection: "row", alignItems: "center", backgroundColor: "#141B2D", marginHorizontal: 20, marginBottom: 10, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  histIcon:       { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  histIconPos:    { backgroundColor: "rgba(255,79,107,0.12)" },
  histIconNeg:    { backgroundColor: "rgba(179,157,219,0.1)" },
  histInfo:       { flex: 1 },
  histName:       { fontSize: 14, fontWeight: "600", color: "#EEF2FF" },
  histDate:       { fontSize: 12, color: "#7B87A6", marginTop: 2 },
  histBadge:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  histBadgePos:   { backgroundColor: "rgba(255,79,107,0.15)" },
  histBadgeNeg:   { backgroundColor: "rgba(179,157,219,0.1)" },
  histBadgeText:  { fontSize: 11, fontWeight: "700" },
  textPos:        { color: "#FF4F6B" },
  textNeg:        { color: "#B39DDB" },
  emptyRecent:    { marginHorizontal: 20, backgroundColor: "#141B2D", borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  emptyRecentText:{ color: "#7B87A6", fontSize: 13 },

  // Gaya navigasi bawah.
  bottomNav:      { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: "#0F1628", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingBottom: 24, paddingTop: 12 },
  navItem:        { flex: 1, alignItems: "center", gap: 4 },
  navLabel:       { fontSize: 11, color: "#7B87A6", fontWeight: "500" },
});
