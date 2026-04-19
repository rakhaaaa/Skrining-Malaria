import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert, ScrollView, Dimensions, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getHistory, clearHistory, saveHistory } from "../utils/storage";
import { PieChart, BarChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { useTheme } from "../theme";

// Lebar layar dipakai untuk menyesuaikan ukuran grafik.
const SCREEN_W = Dimensions.get("window").width;

export default function HistoryScreen() {
  // Ini dipakai untuk pindah halaman.
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [activeTab, setActiveTab] = useState("riwayat");
  const { themeName, theme } = useTheme();

  // Mengambil semua data riwayat yang tersimpan.
  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  useEffect(() => {
    // Saat halaman ini dibuka lagi, data riwayat diambil ulang.
    const unsubscribe = navigation.addListener("focus", loadHistory);
    return unsubscribe;
  }, [navigation]);

  const handleClearAll = () => {
    // Menghapus semua riwayat setelah pengguna menekan setuju.
    Alert.alert("Hapus Semua Riwayat", "Apakah Anda yakin ingin menghapus seluruh riwayat skrining?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await clearHistory(); setHistory([]); setSelected([]); setSelectMode(false); } }
    ]);
  };

  const handleDeleteSelected = () => {
    // Menghapus data yang sedang dipilih.
    Alert.alert("Hapus Riwayat", `Hapus ${selected.length} riwayat yang dipilih?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive", onPress: async () => {
          const updated = history.filter((_, i) => !selected.includes(i));
          await saveHistory(updated);
          setHistory(updated);
          setSelected([]);
          setSelectMode(false);
        }
      }
    ]);
  };

  const toggleSelect = (index) => {
    // Menandai atau membatalkan pilihan pada satu data.
    setSelected(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const toggleSelectAll = () => {
    // Memilih semua data atau membatalkan semua pilihan.
    if (selected.length === history.length) setSelected([]);
    else setSelected(history.map((_, i) => i));
  };

  const handleExportExcel = async () => {
    // Menyimpan riwayat ke file Excel lalu membagikannya.
    if (history.length === 0) {
      Alert.alert("Tidak ada data", "Belum ada riwayat untuk diekspor.");
      return;
    }
    try {
      const wsData = [
        ["No", "Nama Pasien", "Tanggal", "Jenis Kelamin", "Usia", "Hasil", "Confidence (%)",
         "Gejala", "Hemoglobin", "WBC", "Neutrofil", "Limfosit", "Eosinofil", "HCT/PCV", "MCH", "MCHC", "RDW-CV", "Platelet"],
        ...history.map((item, i) => [
          i + 1,
          item.patientName || "Pasien Anonim",
          item.date || "-",
          item.sex || "-",
          item.age || "-",
          item.result || "-",
          item.confidence || "-",
          Array.isArray(item.symptoms) && item.symptoms.length > 0 ? item.symptoms.join(", ") : "-",
          item.hemoglobin || "-",
          item.wbc || "-",
          item.neutrophils || "-",
          item.lymphocytes || "-",
          item.eosinophils || "-",
          item.htc || "-",
          item.mch || "-",
          item.mchc || "-",
          item.rdwcv || "-",
          item.platelet || "-",
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Riwayat");
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const uri = FileSystem.documentDirectory + "riwayat_malaria.xlsx";
      await FileSystem.writeAsStringAsync(uri, wbout, { encoding: "base64" });
      await Sharing.shareAsync(uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: "Export Riwayat Malaria" });
    } catch (e) {
      Alert.alert("Gagal", "Tidak dapat mengekspor data: " + e.message);
    }
  };

  // Bagian ini menyaring data sesuai pencarian dan filter hasil.
  const filtered = history.filter(item => {
    const matchName = item.patientName
      ? item.patientName.toLowerCase().includes(search.toLowerCase())
      : "pasien anonim".includes(search.toLowerCase());
    if (search.trim() && !matchName) return false;
    if (filter === "Positif") return item.result?.toLowerCase().includes("pos");
    if (filter === "Negatif") return item.result?.toLowerCase().includes("neg");
    return true;
  });

  // Stats
  // Ringkasan jumlah data untuk tab statistik.
  const totalPos = history.filter(i => i.result?.toLowerCase().includes("pos")).length;
  const totalNeg = history.filter(i => i.result?.toLowerCase().includes("neg")).length;
  const avgConf = history.length > 0 ? (history.reduce((s, i) => s + (parseFloat(i.confidence) || 0), 0) / history.length).toFixed(1) : 0;

  const pieData = [
    { name: "Positif", population: totalPos || 0, color: "#FF4F6B", legendFontColor: "#EEF2FF", legendFontSize: 12 },
    { name: "Negatif", population: totalNeg || 0, color: "#B39DDB", legendFontColor: "#EEF2FF", legendFontSize: 12 },
  ];

  // Grafik batang dibuat dari jumlah diagnosis 7 hari terakhir.
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const count = history.filter(h => {
      if (!h.date) return false;
      const hd = new Date(h.date.split(",")[0].split("/").reverse().join("-"));
      return hd.getDate() === d.getDate() && hd.getMonth() === d.getMonth();
    }).length;
    return { label, count };
  });

  const barData = {
    labels: last7.map(d => d.label),
    datasets: [{ data: last7.map(d => d.count || 0) }]
  };

  const chartConfig = {
    backgroundColor: "#141B2D",
    backgroundGradientFrom: "#141B2D",
    backgroundGradientTo: "#141B2D",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(179,157,219,${opacity})`,
    labelColor: () => "#7B87A6",
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#B39DDB" },
    barPercentage: 0.6,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={themeName === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <View style={styles.topnav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectMode(false); setSelected([]); navigation.navigate("Main"); }}>
          <Ionicons name="arrow-back" size={20} color="#EEF2FF" />
        </TouchableOpacity>
        <Text style={styles.topnavTitle}>
          {selectMode ? `${selected.length} dipilih` : "Riwayat Pemeriksaan"}
        </Text>
        <View style={styles.topnavRight}>
          {!selectMode ? (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectMode(true)}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#00B8FF" />
              </TouchableOpacity>
              {history.length > 0 && (
                <TouchableOpacity style={[styles.backBtn, { marginLeft: 8 }]} onPress={handleClearAll}>
                  <Ionicons name="trash-outline" size={18} color="#FF4F6B" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={toggleSelectAll}>
                <Ionicons name={selected.length === history.length ? "checkbox" : "square-outline"} size={18} color="#B39DDB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.backBtn, { marginLeft: 8 }]} onPress={() => { setSelectMode(false); setSelected([]); }}>
                <Ionicons name="close" size={18} color="#7B87A6" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Tombol tab untuk pindah antara riwayat dan statistik. */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === "riwayat" && styles.tabActive]} onPress={() => setActiveTab("riwayat")}>
          <Text style={[styles.tabText, activeTab === "riwayat" && styles.tabTextActive]}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "statistik" && styles.tabActive]} onPress={() => setActiveTab("statistik")}>
          <Text style={[styles.tabText, activeTab === "statistik" && styles.tabTextActive]}>Statistik</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "riwayat" ? (
        <>
          {!selectMode && (
            <>
              {/* Filter hasil dan pencarian nama pasien. */}
              <View style={styles.filterRow}>
                {["Semua", "Positif", "Negatif"].map(tab => (
                  <TouchableOpacity key={tab} style={[styles.filterTab, filter === tab && styles.filterTabActive]} onPress={() => setFilter(tab)}>
                    <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color="#7B87A6" style={{ marginHorizontal: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari nama pasien..."
                  placeholderTextColor="#4A5568"
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")} style={{ paddingHorizontal: 8 }}>
                    <Ionicons name="close-circle" size={18} color="#7B87A6" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={64} color="#192035" />
              <Text style={styles.emptyText}>Belum ada riwayat pemeriksaan</Text>
              <TouchableOpacity style={styles.btnStart} onPress={() => navigation.navigate("Form")}>
                <Text style={styles.btnStartText}>Mulai Diagnosis Pertama</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={{ padding: 20, paddingBottom: selectMode ? 100 : 80 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isPos = item.result === "Positive";
                const realIndex = history.indexOf(item);
                const isSelected = selected.includes(realIndex);
                return (
                  <TouchableOpacity
                    style={[styles.card, isSelected && styles.cardSelected]}
                    onPress={() => selectMode ? toggleSelect(realIndex) : navigation.navigate("Result", { result: item })}
                    activeOpacity={0.8}
                  >
                    {selectMode && (
                      <View style={styles.checkbox}>
                        <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={22} color={isSelected ? "#B39DDB" : "#7B87A6"} />
                      </View>
                    )}
                    <View style={[styles.cardIcon, isPos ? styles.cardIconPos : styles.cardIconNeg]}>
                      <Ionicons name={isPos ? "alert-circle" : "checkmark-circle"} size={22} color={isPos ? "#FF4F6B" : "#B39DDB"} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{item.patientName || "Pasien"}</Text>
                      <Text style={styles.cardDate}>{item.date} · {item.sex === "Male" ? "L" : "P"} · {item.age} thn</Text>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={[styles.badge, isPos ? styles.badgePos : styles.badgeNeg]}>
                        <Text style={[styles.badgeText, isPos ? styles.textPos : styles.textNeg]}>{isPos ? "Positif" : "Negatif"}</Text>
                      </View>
                      <Text style={styles.confidence}>{item.confidence}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {selectMode && selected.length > 0 && (
            <View style={styles.fixedBottom}>
              <TouchableOpacity style={styles.btnDelete} onPress={handleDeleteSelected}>
                <Ionicons name="trash-outline" size={18} color="#0A0F1E" />
                <Text style={styles.btnDeleteText}>Hapus {selected.length} Riwayat</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          {/* Kotak ringkasan jumlah data. */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{history.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { borderColor: "rgba(255,79,107,0.3)" }]}>
              <Text style={[styles.statNum, { color: "#FF4F6B" }]}>{totalPos}</Text>
              <Text style={styles.statLabel}>Positif</Text>
            </View>
            <View style={[styles.statCard, { borderColor: "rgba(179,157,219,0.3)" }]}>
              <Text style={[styles.statNum, { color: "#B39DDB" }]}>{totalNeg}</Text>
              <Text style={styles.statLabel}>Negatif</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{avgConf}%</Text>
              <Text style={styles.statLabel}>Rata-rata</Text>
            </View>
          </View>

          {/* Tombol untuk export riwayat ke Excel. */}
          <TouchableOpacity style={styles.btnExport} onPress={handleExportExcel}>
            <Ionicons name="download-outline" size={18} color="#0A0F1E" />
            <Text style={styles.btnExportText}>Export Excel (.xlsx)</Text>
          </TouchableOpacity>

          {history.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bar-chart-outline" size={64} color="#192035" />
              <Text style={styles.emptyText}>Belum ada data untuk ditampilkan</Text>
            </View>
          ) : (
            <>
              {/* Pie Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Distribusi Hasil Diagnosis</Text>
                <PieChart
                  data={pieData}
                  width={SCREEN_W - 72}
                  height={180}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="16"
                  absolute
                />
              </View>

              {/* Bar Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Diagnosis 7 Hari Terakhir</Text>
                <BarChart
                  data={barData}
                  width={SCREEN_W - 72}
                  height={180}
                  chartConfig={chartConfig}
                  style={{ borderRadius: 12 }}
                  showValuesOnTopOfBars
                  fromZero
                />
              </View>
            </>
          )}
        </ScrollView>
      )}

      {!selectMode && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Main")} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={22} color="#7B87A6" />
            <Text style={styles.navLabel}>Beranda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Form")} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={22} color="#7B87A6" />
            <Text style={styles.navLabel}>Diagnosis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="document-text" size={22} color="#B39DDB" />
            <Text style={[styles.navLabel, { color: "#B39DDB" }]}>Riwayat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("About")} activeOpacity={0.8}>
            <Ionicons name="information-circle-outline" size={22} color="#7B87A6" />
            <Text style={styles.navLabel}>About</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0A0F1E" },
  topnav:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: "#0F1628", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  topnavTitle:      { fontSize: 16, fontWeight: "700", color: "#EEF2FF", flex: 1, textAlign: "center" },
  topnavRight:      { flexDirection: "row", alignItems: "center" },
  backBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: "#141B2D", alignItems: "center", justifyContent: "center" },
  tabRow:           { flexDirection: "row", backgroundColor: "#0F1628", paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  tab:              { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: "#141B2D", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  tabActive:        { backgroundColor: "rgba(179,157,219,0.15)", borderColor: "rgba(179,157,219,0.4)" },
  tabText:          { fontSize: 13, color: "#7B87A6", fontWeight: "600" },
  tabTextActive:    { color: "#B39DDB" },
  filterRow:        { flexDirection: "row", gap: 8, padding: 16, paddingHorizontal: 20, backgroundColor: "#0F1628" },
  filterTab:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#141B2D", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  filterTabActive:  { backgroundColor: "rgba(179,157,219,0.1)", borderColor: "rgba(179,157,219,0.3)" },
  filterText:       { fontSize: 12, color: "#7B87A6", fontWeight: "500" },
  filterTextActive: { color: "#B39DDB", fontWeight: "700" },
  card:             { flexDirection: "row", alignItems: "center", backgroundColor: "#141B2D", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  cardSelected:     { borderColor: "#B39DDB", backgroundColor: "rgba(179,157,219,0.05)" },
  checkbox:         { marginRight: 10 },
  cardIcon:         { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  cardIconPos:      { backgroundColor: "rgba(255,79,107,0.12)" },
  cardIconNeg:      { backgroundColor: "rgba(179,157,219,0.1)" },
  cardInfo:         { flex: 1 },
  cardName:         { fontSize: 14, fontWeight: "600", color: "#EEF2FF" },
  cardDate:         { fontSize: 11, color: "#7B87A6", marginTop: 3 },
  cardRight:        { alignItems: "flex-end", gap: 4 },
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgePos:         { backgroundColor: "rgba(255,79,107,0.15)" },
  badgeNeg:         { backgroundColor: "rgba(179,157,219,0.1)" },
  badgeText:        { fontSize: 11, fontWeight: "700" },
  textPos:          { color: "#FF4F6B" },
  textNeg:          { color: "#B39DDB" },
  confidence:       { fontSize: 11, color: "#7B87A6" },
  empty:            { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80, paddingTop: 60 },
  emptyText:        { fontSize: 14, color: "#7B87A6", marginTop: 16, marginBottom: 24, textAlign: "center" },
  searchRow:        { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, backgroundColor: "#141B2D", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  searchInput:      { flex: 1, paddingVertical: 10, color: "#EEF2FF", fontSize: 13 },
  btnStart:         { backgroundColor: "#B39DDB", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnStartText:     { color: "#0A0F1E", fontWeight: "700", fontSize: 14 },
  fixedBottom:      { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: "#0A0F1E", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  btnDelete:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FF4F6B", borderRadius: 14, padding: 16 },
  btnDeleteText:    { fontSize: 15, fontWeight: "700", color: "#0A0F1E" },
  btnExport:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#B39DDB", borderRadius: 14, padding: 14, marginBottom: 20 },
  btnExportText:    { fontSize: 14, fontWeight: "700", color: "#0A0F1E" },
  statCard:         { flex: 1, backgroundColor: "#141B2D", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  statNum:          { fontSize: 22, fontWeight: "800", color: "#EEF2FF" },
  statLabel:        { fontSize: 11, color: "#7B87A6", marginTop: 4 },
  chartCard:        { backgroundColor: "#141B2D", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  chartTitle:       { fontSize: 14, fontWeight: "700", color: "#EEF2FF", marginBottom: 16 },
  bottomNav:        { flexDirection: "row", backgroundColor: "#0F1628", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingBottom: 24, paddingTop: 12 },
  navItem:          { flex: 1, alignItems: "center", gap: 4 },
  navLabel:         { fontSize: 11, color: "#7B87A6", fontWeight: "500" },
});
