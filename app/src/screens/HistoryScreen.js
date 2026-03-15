import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getHistory, clearHistory, saveHistory } from "../utils/storage";

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("Semua");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadHistory);
    return unsubscribe;
  }, [navigation]);

  const handleClearAll = () => {
    Alert.alert("Hapus Semua Riwayat", "Apakah Anda yakin ingin menghapus seluruh riwayat skrining?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await clearHistory(); setHistory([]); setSelected([]); setSelectMode(false); } }
    ]);
  };

  const handleDeleteSelected = () => {
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
    setSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === history.length) {
      setSelected([]);
    } else {
      setSelected(history.map((_, i) => i));
    }
  };

  const filtered = history.filter(item => {
    if (filter === "Positif") return item.result?.toLowerCase().includes("pos");
    if (filter === "Negatif") return item.result?.toLowerCase().includes("neg");
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />

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

      {!selectMode && (
        <View style={styles.filterRow}>
          {["Semua", "Positif", "Negatif"].map(tab => (
            <TouchableOpacity key={tab} style={[styles.filterTab, filter === tab && styles.filterTabActive]} onPress={() => setFilter(tab)}>
              <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
          contentContainerStyle={{ padding: 20, paddingBottom: selectMode ? 100 : 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
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
                  <Text style={{ fontSize: 20 }}>{isPos ? "🦟" : "✅"}</Text>
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
  empty:            { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 },
  emptyText:        { fontSize: 14, color: "#7B87A6", marginTop: 16, marginBottom: 24 },
  btnStart:         { backgroundColor: "#B39DDB", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  btnStartText:     { color: "#0A0F1E", fontWeight: "700", fontSize: 14 },
  fixedBottom:      { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: "#0A0F1E", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  btnDelete:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FF4F6B", borderRadius: 14, padding: 16 },
  btnDeleteText:    { fontSize: 15, fontWeight: "700", color: "#0A0F1E" },
  bottomNav:        { flexDirection: "row", backgroundColor: "#0F1628", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingBottom: 24, paddingTop: 12 },
  navItem:          { flex: 1, alignItems: "center", gap: 4 },
  navLabel:         { fontSize: 11, color: "#7B87A6", fontWeight: "500" },
});
