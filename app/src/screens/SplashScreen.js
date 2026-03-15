import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, StatusBar, Animated, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function SplashScreen() {
  const navigation = useNavigation();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.iconWrapper}>
          <Ionicons name="medical" size={44} color="#B39DDB" />
        </View>
        <Text style={styles.title}>Skrining <Text style={styles.titleAccent}>Malaria</Text></Text>
        <Text style={styles.subtitle}>Klasifikasi Penyakit Malaria menggunakan{"\n"}Light Gradient Boosting Machine (LightGBM)</Text>
        <View style={styles.pills}>
          <View style={[styles.pill, styles.pillGreen]}><Text style={styles.pillTextGreen}>Rakha Naufal Sujana - 535220006</Text></View>
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.replace("Main")} activeOpacity={0.85}>
          <Ionicons name="arrow-forward" size={18} color="#0A0F1E" />
          <Text style={styles.btnPrimaryText}>Mulai Pemeriksaan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.replace("History")} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>Lihat Riwayat</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#0A0F1E", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  content:         { alignItems: "center", width: "100%" },
  iconWrapper:     { width: 88, height: 88, borderRadius: 26, backgroundColor: "rgba(179,157,219,0.12)", borderWidth: 1, borderColor: "rgba(179,157,219,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  title:           { fontSize: 38, fontWeight: "800", color: "#EEF2FF", letterSpacing: 1 },
  titleAccent:     { color: "#B39DDB" },
  subtitle:        { fontSize: 14, color: "#7B87A6", textAlign: "center", marginTop: 14, lineHeight: 22 },
  pills:           { flexDirection: "row", gap: 8, marginTop: 24, marginBottom: 36, flexWrap: "wrap", justifyContent: "center" },
  pill:            { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#141B2D", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  pillGreen:       { backgroundColor: "rgba(179,157,219,0.1)", borderColor: "rgba(179,157,219,0.3)" },
  pillText:        { fontSize: 12, color: "#7B87A6" },
  pillTextGreen:   { fontSize: 12, color: "#B39DDB", fontWeight: "600" },
  btnPrimary:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#B39DDB", borderRadius: 14, padding: 18, width: "100%", marginBottom: 12 },
  btnPrimaryText:  { fontSize: 16, fontWeight: "700", color: "#0A0F1E" },
  btnSecondary:    { width: "100%", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center" },
  btnSecondaryText:{ fontSize: 15, color: "#7B87A6", fontWeight: "500" },
});
