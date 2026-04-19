import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";

export default function AboutScreen() {
  // Dipakai untuk pindah halaman atau balik ke halaman sebelumnya.
  const navigation = useNavigation();

  // Mengambil tema yang sedang aktif supaya warna halaman ikut menyesuaikan.
  const { themeName, theme } = useTheme();

  // Menyimpan status buka/tutup untuk bagian Cara Kerja.
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Nama dosen pembimbing disimpan di sini supaya gampang dipakai di tampilan.
  const supervisorName = "- TENY HANDHAYANI S.Kom., M.Kom., Ph.D.\n- Dr. Ir. Meirista Wulandari, S.T., M.Eng";

  // Daftar langkah yang dipakai untuk menampilkan alur kerja aplikasi.
  const workflowSteps = [
    {
      title: "Mulai dan Isi Data",
      description:
        "Pengguna masuk ke menu Diagnosis, lalu mengisi data pasien dan hasil pemeriksaan darah yang diperlukan.",
      icon: "create-outline",
    },
    {
      title: "Cek dan Siapkan Data",
      description:
        "Aplikasi mengecek apakah data sudah lengkap dan angkanya sudah benar, lalu menyiapkannya agar bisa dibaca oleh model.",
      icon: "filter-outline",
    },
    {
      title: "Proses Prediksi",
      description:
        "Data dikirim ke backend Flask, lalu model machine learning menghitung kemungkinan malaria berdasarkan pola dari data yang sudah dipelajari sebelumnya.",
      icon: "analytics-outline",
    },
    {
      title: "Tampilkan Hasil",
      description:
        "Sistem menampilkan hasil skrining berupa Positive atau Negative, lengkap dengan confidence score sebagai gambaran keyakinan model.",
      icon: "pulse-outline",
    },
    {
      title: "Simpan ke Riwayat",
      description:
        "Hasil pemeriksaan disimpan ke riwayat agar bisa dilihat lagi kapan saja bila diperlukan.",
      icon: "save-outline",
    },
  ];

  return (
    // Wadah utama halaman About.
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <StatusBar barStyle={themeName === "dark" ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Bagian atas halaman: tombol kembali dan judul. */}
      <View style={styles.topnav}>
        <Ionicons
          name="arrow-back"
          size={20}
          color={theme.text}
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.topnavTitle, { color: theme.text }]}>Tentang</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Isi halaman dibuat scroll supaya tetap nyaman dibuka di layar kecil. */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        {/* Kartu ini menjelaskan fungsi utama aplikasi secara singkat. */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Tentang Aplikasi</Text>
          <Text style={[styles.bodyText, { color: theme.muted }]}> 
            MalariaCheck adalah aplikasi untuk membantu skrining awal malaria dari data pasien dan hasil pemeriksaan
            darah. Lewat aplikasi ini, pengguna bisa mendapat gambaran awal apakah hasil yang dimasukkan lebih
            mengarah ke Positive atau Negative.
          </Text>
        </View>

        {/* Kartu ini menjelaskan aplikasi dibuat untuk apa dan dibangun dengan apa. */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Pembuatan Aplikasi</Text>
          <Text style={[styles.bodyText, { color: theme.muted }]}> 
            Sistemnya terdiri dari aplikasi mobile React Native Expo untuk input
            dan tampilan hasil, serta backend Flask untuk menjalankan model machine learning.
          </Text>
          <Text style={[styles.bodyText, { color: theme.muted, marginTop: 8 }]}> 
            Hasil pemeriksaan juga bisa disimpan ke riwayat, jadi pengguna dapat membukanya kembali saat diperlukan.
          </Text>
        </View>

        {/* Kartu ini berisi penjelasan singkat soal metode yang dipakai di penelitian. */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Metode yang Dipakai</Text>
          <Text style={[styles.bodyText, { color: theme.muted }]}> 
            Penelitian ini memakai Light Gradient Boosting Machine (LightGBM) sebagai metode utama, dan CatBoost
            sebagai pembanding. Data yang digunakan antara lain jenis kelamin, usia, hemoglobin, WBC, neutrofil,
            limfosit, eosinofil, HTC/PCV, MCH, MCHC, RDW-CV, dan platelet count.
          </Text>
          <Text style={[styles.bodyText, { color: theme.muted, marginTop: 8 }]}> 
            Untuk melihat performa model, pengujian dilakukan dengan metrik Accuracy, Precision, Recall, F1-Score,
            dan k-fold cross validation.
          </Text>
        </View>

        {/* Bagian ini bisa dibuka dan ditutup supaya halaman About tidak terlalu panjang. */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowWorkflow((prev) => !prev)}
            activeOpacity={0.85}
          >
            <View style={styles.sectionToggleTextWrap}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 4 }]}>Cara Kerja</Text>
              <Text style={[styles.toggleHint, { color: theme.muted }]}> 
                Tekan untuk {showWorkflow ? "sembunyikan" : "lihat"} penjelasannya
              </Text>
            </View>
            <Ionicons
              name={showWorkflow ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.text}
            />
          </TouchableOpacity>

          {/* Isi langkah-langkah hanya muncul saat bagian Cara Kerja dibuka. */}
          {showWorkflow ? (
            <>
              <Text style={[styles.bodyText, { color: theme.muted, marginTop: 14 }]}> 
                Bagian ini menjelaskan alur kerja MalariaCheck dari data dimasukkan sampai hasil skrining muncul.
              </Text>

              {/* Badge kecil ini dipakai sebagai penanda visual untuk bagian alur kerja. */}
              <View style={styles.flowHeader}>
                <View style={styles.flowBadge}>
                  <Text style={styles.flowBadgeText}>Gimana cara kerjanya?</Text>
                </View>
              </View>

              {/* Langkah-langkah ditampilkan dari data workflowSteps di atas. */}
              <View style={styles.workflowContainer}>
                {workflowSteps.map((step, index) => (
                  <View key={step.title}>
                    <View style={[styles.workflowStep, { borderColor: theme.border, backgroundColor: theme.background }]}> 
                      <View style={styles.workflowTopRow}>
                        <View style={styles.workflowIconWrap}>
                          <Ionicons name={step.icon} size={18} color="#B39DDB" />
                        </View>
                        <Text style={[styles.workflowTitle, { color: theme.text }]}>{step.title}</Text>
                      </View>
                      <Text style={[styles.workflowText, { color: theme.muted }]}>{step.description}</Text>
                    </View>

                    {/* Panah ini dipakai sebagai penghubung antar langkah. */}
                    {index < workflowSteps.length - 1 ? (
                      <View style={styles.workflowArrow}>
                        <Ionicons name="arrow-down" size={18} color={theme.muted} />
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>

        {/* Kartu ini berisi identitas pengembang, pembimbing, dan judul skripsi. */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Informasi Skripsi</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Pengembang</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>Rakha Naufal Sujana</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>NPM</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>535220006</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Pembimbing</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{supervisorName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Judul</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}> 
              Klasifikasi Penyakit Malaria Menggunakan Light Gradient Boosting Machine (LightGBM) dan CatBoost
            </Text>
          </View>
        </View>

        {/* Catatan ini mengingatkan kalau aplikasi hanya dipakai sebagai bantuan awal. */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Catatan Klinis</Text>
          <Text style={[styles.bodyText, { color: theme.muted }]}> 
            Hasil dari aplikasi ini hanya sebagai bantuan awal, bukan pengganti diagnosis dokter. Untuk memastikan
            kondisi pasien, tetap diperlukan pemeriksaan klinis dan tes medis sesuai prosedur yang berlaku.
          </Text>
        </View>
      </ScrollView>

      {/* Navigasi bawah dipakai untuk pindah cepat ke halaman lain. */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Main")} activeOpacity={0.8}>
          <Ionicons name="home-outline" size={22} color="#7B87A6" />
          <Text style={styles.navLabel}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Form")} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={22} color="#7B87A6" />
          <Text style={styles.navLabel}>Diagnosis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("History")} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={22} color="#7B87A6" />
          <Text style={styles.navLabel}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
          <Ionicons name="information-circle" size={22} color="#B39DDB" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>About</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Tampilan header paling atas.
  topnav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  topnavTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", flex: 1 },
  backIcon: { width: 36, height: 36, textAlignVertical: "center" },

  // Gaya dasar untuk setiap kartu di halaman About.
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  bodyText: { fontSize: 13, lineHeight: 20 },

  // Bagian tombol buka/tutup untuk section Cara Kerja.
  sectionToggle: {
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionToggleTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  toggleHint: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Bagian badge dan daftar langkah pada alur kerja aplikasi.
  flowHeader: { marginTop: 14, marginBottom: 12 },
  flowBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(179,157,219,0.12)",
    borderColor: "rgba(179,157,219,0.28)",
  },
  flowBadgeText: { fontSize: 12, fontWeight: "700", color: "#B39DDB" },
  workflowContainer: { marginTop: 2 },
  workflowStep: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  workflowTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  workflowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(179,157,219,0.10)",
    marginRight: 10,
  },
  workflowTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  workflowText: {
    fontSize: 12,
    lineHeight: 18,
  },
  workflowArrow: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },

  // Gaya untuk baris informasi seperti nama pengembang dan pembimbing.
  infoRow: { marginTop: 10 },
  infoLabel: { fontSize: 11, fontWeight: "700", marginBottom: 3, textTransform: "uppercase" },
  infoValue: { fontSize: 13, lineHeight: 20, fontWeight: "600" },

  // Navigasi bawah yang tetap terlihat di bagian bawah layar.
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#0F1628",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    paddingBottom: 24,
    paddingTop: 12,
  },
  navItem: { flex: 1, alignItems: "center", gap: 4 },
  navLabel: { fontSize: 11, color: "#7B87A6", fontWeight: "500" },
  navLabelActive: { color: "#B39DDB" },
});
