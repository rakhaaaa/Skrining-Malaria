import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function ResultScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const result     = route.params?.result || {};
  const isPositive = result.result === "Positive";
  const color      = isPositive ? "#FF4F6B" : "#B39DDB";
  const bgColor    = isPositive ? "rgba(255,79,107,0.1)" : "rgba(179,157,219,0.08)";

  const features = [
    { name: "Hemoglobin",      val: `${result.hemoglobin || "-"} g/dL`,    pct: Math.min((parseFloat(result.hemoglobin)||0) / 18 * 100, 100) },
    { name: "Platelet Count",  val: `${result.platelet || "-"} ×10³`,      pct: Math.min((parseFloat(result.platelet)||0) / 400 * 100, 100) },
    { name: "WBC Count",       val: `${result.wbc || "-"} ×10³`,           pct: Math.min((parseFloat(result.wbc)||0) / 12 * 100, 100) },
    { name: "Neutrofil",       val: `${result.neutrophils || "-"}%`,       pct: Math.min(parseFloat(result.neutrophils)||0, 100) },
    { name: "Limfosit",        val: `${result.lymphocytes || "-"}%`,       pct: Math.min(parseFloat(result.lymphocytes)||0, 100) },
    { name: "RDW-CV",          val: `${result.rdwcv || "-"}%`,             pct: Math.min((parseFloat(result.rdwcv)||0) / 20 * 100, 100) },
  ];

  const handleDownloadPDF = async () => {
    try {
      const html = generateHTML(result);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Laporan Skrining Malaria" });
    } catch (e) {
      Alert.alert("Gagal", "Tidak dapat membuat PDF: " + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />

      <View style={styles.topnav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#EEF2FF" />
        </TouchableOpacity>
        <Text style={styles.topnavTitle}>Hasil Diagnosis</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

        {/* Result Ring */}
        <View style={[styles.resultHero, { backgroundColor: bgColor }]}>
          <View style={[styles.ring, { borderColor: color }]}>
            <Text style={[styles.ringPct, { color }]}>{result.confidence || "--"}%</Text>
            <Text style={styles.ringLabel}>RISIKO</Text>
          </View>
          <Text style={[styles.resultStatus, { color }]}>
            {isPositive ? "POSITIF MALARIA" : "NEGATIF MALARIA"}
          </Text>
          <Text style={styles.resultDesc}>
            {isPositive
              ? "Hasil analisis menunjukkan indikasi positif malaria. Segera lakukan konfirmasi dengan pemeriksaan apusan darah."
              : "Hasil analisis tidak menunjukkan indikasi malaria berdasarkan parameter laboratorium yang dimasukkan."}
          </Text>
        </View>

        {/* Recommendation */}
        <View style={[styles.recCard, isPositive ? styles.recCardPos : styles.recCardNeg]}>
          <Text style={[styles.recTitle, { color }]}>
            {isPositive ? "Tindakan Segera Diperlukan" : "Tidak Terindikasi Malaria"}
          </Text>
          {isPositive ? (
            <>
              <RecStep num="1" text="Lakukan pemeriksaan apusan darah tebal dan tipis untuk konfirmasi parasit Plasmodium" color="#FF4F6B" />
              <RecStep num="2" text="Konsultasikan dengan dokter spesialis atau dokter umum segera" color="#FF4F6B" />
              <RecStep num="3" text="Pantau tanda-tanda malaria berat: demam tinggi, menggigil, penurunan kesadaran" color="#FF4F6B" />
              <RecStep num="4" text="Jika dikonfirmasi positif, mulai pengobatan antimalaria sesuai protokol WHO" color="#FF4F6B" />
            </>
          ) : (
            <>
              <RecStep num="1" text="Parameter darah tidak menunjukkan tanda-tanda infeksi malaria" color="#B39DDB" />
              <RecStep num="2" text="Jika gejala masih ada, pertimbangkan pemeriksaan untuk penyakit lain (DBD, Tifoid)" color="#B39DDB" />
              <RecStep num="3" text="Tetap waspada jika berada di area endemis malaria — ulangi tes jika gejala berlanjut" color="#B39DDB" />
            </>
          )}
        </View>

        {/* Feature List */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Ringkasan Data Input</Text>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureName}>{f.name}</Text>
              <Text style={styles.featureVal}>{f.val}</Text>
              <View style={styles.featureBarWrap}>
                <View style={[styles.featureBar, { width: `${f.pct.toFixed(0)}%`, backgroundColor: isPositive ? "#FF4F6B" : "#B39DDB" }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Patient Data */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Data Pasien</Text>
          <DataRow label="Nama Pasien" value={result.patientName || "-"} />
          <DataRow label="Jenis Kelamin" value={result.sex || "-"} />
          <DataRow label="Usia" value={result.age ? `${result.age} Tahun` : "-"} />
          <DataRow label="Tanggal" value={result.date || "-"} />
        </View>


      </ScrollView>

      {/* Fixed Bottom */}
      <View style={styles.fixedBottom}>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleDownloadPDF} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={18} color="#0A0F1E" />
            <Text style={styles.btnPrimaryText}>Unduh PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDark} onPress={() => navigation.navigate("Form")} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#EEF2FF" />
            <Text style={styles.btnDarkText}>Baru</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate("Main")} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RecStep({ num, text, color }) {
  return (
    <View style={styles.recStep}>
      <View style={[styles.recNum, { backgroundColor: color + "20" }]}>
        <Text style={[styles.recNumText, { color }]}>{num}</Text>
      </View>
      <Text style={styles.recText}>{text}</Text>
    </View>
  );
}

function DataRow({ label, value }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

function generateHTML(r) {
  const isPos = r.result === "Positive";
  const color = isPos ? "#FF4F6B" : "#B39DDB";

  const now = new Date();
  const hariList = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const bulanList = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const hari = hariList[now.getDay()];
  const tgl = now.getDate();
  const bulan = bulanList[now.getMonth()];
  const tahun = now.getFullYear();
  const jam = String(now.getHours()).padStart(2,"0");
  const menit = String(now.getMinutes()).padStart(2,"0");
  const detik = String(now.getSeconds()).padStart(2,"0");
  const tanggalStr = `${hari}, ${tgl} ${bulan} ${tahun}`;
  const waktuStr = `${jam}.${menit}.${detik}`;

  const rekPos = [
    "Segera lakukan pemeriksaan apusan darah tebal dan tipis untuk konfirmasi parasit Plasmodium.",
    "Konsultasikan dengan dokter spesialis penyakit dalam atau dokter umum sesegera mungkin.",
    "Pantau tanda-tanda malaria berat: demam tinggi, menggigil hebat, dan penurunan kesadaran.",
    "Jika dikonfirmasi positif, mulai pengobatan antimalaria sesuai protokol WHO.",
  ];
  const rekNeg = [
    "Parameter darah tidak menunjukkan tanda-tanda infeksi malaria saat ini.",
    "Jika gejala masih ada, pertimbangkan pemeriksaan untuk penyakit lain seperti DBD atau Tifoid.",
    "Tetap waspada jika berada di area endemis malaria, ulangi tes jika gejala berlanjut.",
  ];
  const pencegahan = [
    "Gunakan kelambu berinsektisida saat tidur, terutama di daerah endemis.",
    "Pakai pakaian lengan panjang dan celana panjang saat beraktivitas di luar malam hari.",
    "Gunakan obat nyamuk (losion/semprot) yang mengandung DEET atau Picaridin.",
    "Pastikan lingkungan bebas dari genangan air sebagai tempat berkembang biak nyamuk.",
    "Konsumsi obat antimalaria profilaksis jika bepergian ke daerah endemis malaria.",
  ];
  const rekom = isPos ? rekPos : rekNeg;

  return `<html><body style="font-family:Arial;padding:32px;background:#0A0F1E;color:#EEF2FF">
    <div style="text-align:center;margin-bottom:24px">
      <h2 style="color:#B39DDB;margin:0">MalariaCheck</h2>
      <p style="color:#7B87A6;margin:4px 0">Laporan Skrining Awal Malaria</p>
      <p style="color:#7B87A6;font-size:12px">Hari, Tanggal: ${tanggalStr}</p>
      <p style="color:#7B87A6;font-size:12px">Waktu: ${waktuStr}</p>
    </div>
    <div style="background:${isPos ? "rgba(255,79,107,0.15)" : "rgba(179,157,219,0.1)"};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid ${color}">
      <h1 style="color:${color};margin:0">Malaria ${r.result}</h1>
      <p style="margin:8px 0;color:#EEF2FF">Tingkat Risiko: <strong>${r.confidence}%</strong></p>
      <p style="margin:4px 0;color:#7B87A6;font-size:13px">${isPos ? "Hasil analisis menunjukkan indikasi positif malaria. Segera lakukan konfirmasi dengan pemeriksaan apusan darah." : "Hasil analisis tidak menunjukkan indikasi malaria berdasarkan parameter laboratorium yang dimasukkan."}</p>
    </div>
    <h3 style="color:#EEF2FF;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-top:24px">Data Pasien</h3>
    <table width="100%" style="border-collapse:collapse;font-size:13px;color:#EEF2FF">
      ${[["Nama Pasien",r.patientName],["Jenis Kelamin",r.sex],["Usia",r.age+" Tahun"],
        ["Hemoglobin",r.hemoglobin+" g/dL"],["Total WBC Count",r.wbc+" x10/uL"],
        ["Neutrofil",r.neutrophils+"%"],["Limfosit",r.lymphocytes+"%"],
        ["Eosinofil",r.eosinophils+" x10/uL"],["HCT/PCV",r.htc+"%"],
        ["MCH",r.mch+" pg"],["MCHC",r.mchc+" g/dL"],
        ["RDW-CV",r.rdwcv+"%"],["Platelet Count",r.platelet+" x10/uL"],
      ].map(([l,v],i)=>`<tr style="background:${i%2===0?"#141B2D":"#192035"}">
        <td style="padding:8px 12px;border:1px solid rgba(255,255,255,0.07)"><strong>${l}</strong></td>
        <td style="padding:8px 12px;border:1px solid rgba(255,255,255,0.07)">${v||"-"}</td>
      </tr>`).join("")}
    </table>
    <h3 style="color:#EEF2FF;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-top:24px">${isPos ? "Tindakan yang Disarankan" : "Rekomendasi"}</h3>
    <ul style="color:#7B87A6;font-size:13px;line-height:1.8;padding-left:20px">
      ${rekom.map(item => `<li style="margin-bottom:6px">${item}</li>`).join("")}
    </ul>
    <h3 style="color:#EEF2FF;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;margin-top:24px">Pencegahan Malaria</h3>
    <ul style="color:#7B87A6;font-size:13px;line-height:1.8;padding-left:20px">
      ${pencegahan.map(p => `<li style="margin-bottom:6px">${p}</li>`).join("")}
    </ul>
    <p style="text-align:center;color:#7B87A6;font-size:11px;margin-top:32px">
      MalariaCheck - Universitas Tarumanagara 2026<br/>
      <em>Hasil ini bersifat pendukung, bukan pengganti diagnosis klinis.</em>
    </p>
  </body></html>`;
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#0A0F1E" },
  topnav:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: "#0F1628", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  topnavTitle:    { fontSize: 16, fontWeight: "700", color: "#EEF2FF" },
  backBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: "#141B2D", alignItems: "center", justifyContent: "center" },
  resultHero:     { margin: 20, borderRadius: 20, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  ring:           { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  ringPct:        { fontSize: 28, fontWeight: "800" },
  ringLabel:      { fontSize: 10, color: "#7B87A6", fontWeight: "700", letterSpacing: 1.5 },
  resultStatus:   { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  resultDesc:     { fontSize: 13, color: "#7B87A6", textAlign: "center", lineHeight: 20 },
  recCard:        { marginHorizontal: 20, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1 },
  recCardPos:     { backgroundColor: "rgba(255,79,107,0.08)", borderColor: "rgba(255,79,107,0.2)" },
  recCardNeg:     { backgroundColor: "rgba(179,157,219,0.05)", borderColor: "rgba(179,157,219,0.2)" },
  recTitle:       { fontSize: 14, fontWeight: "700", marginBottom: 14 },
  recStep:        { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  recNum:         { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recNumText:     { fontSize: 12, fontWeight: "700" },
  recText:        { flex: 1, fontSize: 13, color: "#7B87A6", lineHeight: 20 },
  card:           { marginHorizontal: 20, backgroundColor: "#141B2D", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  cardHeader:     { fontSize: 14, fontWeight: "700", color: "#EEF2FF", marginBottom: 16 },
  featureRow:     { marginBottom: 12 },
  featureName:    { fontSize: 12, color: "#7B87A6", marginBottom: 4 },
  featureVal:     { fontSize: 13, fontWeight: "600", color: "#EEF2FF", marginBottom: 6 },
  featureBarWrap: { height: 4, backgroundColor: "#192035", borderRadius: 2, overflow: "hidden" },
  featureBar:     { height: 4, borderRadius: 2 },
  dataRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  dataLabel:      { fontSize: 13, color: "#7B87A6" },
  dataValue:      { fontSize: 13, fontWeight: "600", color: "#EEF2FF" },
  modelInfo:      { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 20, backgroundColor: "#141B2D", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(0,184,255,0.15)" },
  modelIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(0,184,255,0.1)", alignItems: "center", justifyContent: "center" },
  modelName:      { fontSize: 13, fontWeight: "700", color: "#EEF2FF" },
  modelStat:      { fontSize: 11, color: "#7B87A6", marginTop: 3 },
  fixedBottom:    { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: "#0A0F1E", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  btnRow:         { flexDirection: "row", gap: 10, marginBottom: 10 },
  btnPrimary:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#B39DDB", borderRadius: 14, padding: 16 },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#0A0F1E" },
  btnDark:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#141B2D", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  btnDarkText:    { fontSize: 14, fontWeight: "600", color: "#EEF2FF" },
  btnSecondary:   { alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  btnSecondaryText: { fontSize: 14, color: "#7B87A6", fontWeight: "500" },
});
