import React from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme";

export default function UserGuideScreen() {
  const navigation = useNavigation();
  const { themeName, theme } = useTheme();

  const steps = [
    {
      title: "1. Siapkan data pasien",
      description:
        "Sebelum mulai mengisi, siapkan terlebih dahulu data dasar pasien dan hasil pemeriksaan darah. Pastikan setiap angka yang dimasukkan sudah sesuai dengan hasil laboratorium.",
      icon: "document-text-outline",
    },
    {
      title: "2. Isi data di menu Diagnosis",
      description:
        "Buka menu Diagnosis, lalu isi semua kolom yang dibutuhkan, seperti usia, jenis kelamin, hemoglobin, WBC, neutrofil, limfosit, dan parameter lainnya.",
      icon: "create-outline",
    },
    {
      title: "3. Periksa lagi sebelum analisis",
      description:
        "Periksa kembali data yang sudah diisi agar tidak ada kolom yang kosong atau salah input. Data yang kurang lengkap dapat memengaruhi hasil skrining.",
      icon: "checkmark-done-outline",
    },
    {
      title: "4. Jalankan skrining",
      description:
        "Tekan tombol analisis untuk mengirim data ke sistem. Setelah itu, aplikasi akan memproses data dan menampilkan hasil skrining awal.",
      icon: "pulse-outline",
    },
    {
      title: "5. Perhatikan hasil skrining",
      description:
        "Perhatikan hasil Positive atau Negative yang ditampilkan. Hasil ini digunakan sebagai bantuan awal dan bukan penentu diagnosis akhir.",
      icon: "analytics-outline",
    },
    {
      title: "6. Lihat atau simpan riwayat",
      description:
        "Bila diperlukan, buka menu Riwayat untuk melihat kembali hasil pemeriksaan yang sudah pernah dilakukan sebelumnya.",
      icon: "save-outline",
    },
  ];

  const notes = [
    "Gunakan hasil laboratorium yang terbaru dan dapat dibaca dengan jelas.",
    "Pastikan satuan dan angka yang dimasukkan sudah sesuai dengan hasil pemeriksaan.",
    "Jangan menggunakan hasil dari aplikasi ini sebagai satu-satunya dasar untuk menegakkan diagnosis.",
    "Tetap lakukan pemeriksaan klinis dan pemeriksaan lanjutan sesuai prosedur yang berlaku.",
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <StatusBar barStyle={themeName === "dark" ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <View style={styles.topnav}>
        <Ionicons
          name="arrow-back"
          size={20}
          color={theme.text}
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.topnavTitle, { color: theme.text }]}>Panduan Pengguna</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Untuk siapa halaman ini?</Text>
          <Text style={[styles.bodyText, { color: theme.muted }]}> 
            Halaman ini dibuat untuk membantu tenaga kesehatan menggunakan MalariaCheck dengan lebih mudah. Di dalamnya terdapat langkah penggunaan, hal-hal yang perlu diperhatikan, serta cara membaca hasil secara aman dan tepat.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Langkah Penggunaan</Text>
          <Text style={[styles.bodyText, { color: theme.muted }]}> 
            Ikuti langkah-langkah berikut saat menggunakan aplikasi untuk skrining awal malaria.
          </Text>

          <View style={styles.stepList}>
            {steps.map((step, index) => (
              <View key={step.title}>
                <View style={[styles.stepCard, { backgroundColor: theme.background, borderColor: theme.border }]}> 
                  <View style={styles.stepHeader}>
                    <View style={styles.stepIconWrap}>
                      <Ionicons name={step.icon} size={18} color="#B39DDB" />
                    </View>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: theme.muted }]}>{step.description}</Text>
                </View>
                {index < steps.length - 1 ? (
                  <View style={styles.stepArrow}>
                    <Ionicons name="arrow-down" size={18} color={theme.muted} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Hal yang Perlu Diperhatikan</Text>
          {notes.map((note) => (
            <View key={note} style={styles.noteRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#B39DDB" style={{ marginTop: 1 }} />
              <Text style={[styles.noteText, { color: theme.muted }]}>{note}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}> 
          <Text style={[styles.cardTitle, { color: theme.text }]}>Catatan Penting</Text>
          <Text style={[styles.bodyText, { color: theme.muted }]}> 
            Hasil dari MalariaCheck digunakan sebagai alat bantu skrining awal. Untuk memastikan kondisi pasien, keputusan klinis tetap perlu didukung oleh pemeriksaan dokter, evaluasi gejala, dan pemeriksaan lanjutan sesuai standar pelayanan medis.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  bodyText: { fontSize: 13, lineHeight: 20 },
  stepList: { marginTop: 14 },
  stepCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(179,157,219,0.10)",
    marginRight: 10,
  },
  stepTitle: { flex: 1, fontSize: 13, fontWeight: "700" },
  stepText: { fontSize: 12, lineHeight: 18 },
  stepArrow: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 10,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 20 },
});

