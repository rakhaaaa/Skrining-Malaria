import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function ResultScreen() {
  // Ini dipakai untuk pindah halaman dan mengambil data dari halaman sebelumnya.
  const navigation = useNavigation();
  const route      = useRoute();
  // Data hasil dikirim dari halaman form ke halaman ini.
  const result     = route.params?.result || {};
  // Nilai ini dipakai untuk menentukan warna dan status hasil.
  const isPositive = result.result === "Positive";
  const color      = isPositive ? "#FF4F6B" : "#B39DDB";
  const bgColor    = isPositive ? "rgba(255,79,107,0.1)" : "rgba(179,157,219,0.08)";
  const symptoms   = Array.isArray(result.symptoms) ? result.symptoms : [];
  const sexLabel   = formatSex(result.sex);
  const resultLabel = formatResultLabel(result.result);
  const [messageModal, setMessageModal] = React.useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const showMessage = ({ title, message, type = "success" }) => {
    setMessageModal({ visible: true, title, message, type });
  };

  const closeMessage = () => {
    setMessageModal(prev => ({ ...prev, visible: false }));
  };

  // Beberapa data input ditampilkan lagi dalam bentuk ringkasan.
  const features = [
    { name: "Hemoglobin",      val: `${result.hemoglobin || "-"} g/dL`,    pct: Math.min((parseFloat(result.hemoglobin)||0) / 18 * 100, 100) },
    { name: "Platelet Count",  val: `${result.platelet || "-"} x10^3`,      pct: Math.min((parseFloat(result.platelet)||0) / 400 * 100, 100) },
    { name: "WBC Count",       val: `${result.wbc || "-"} x10^3`,           pct: Math.min((parseFloat(result.wbc)||0) / 12 * 100, 100) },
    { name: "Neutrofil",       val: `${result.neutrophils || "-"}%`,       pct: Math.min(parseFloat(result.neutrophils)||0, 100) },
    { name: "Limfosit",        val: `${result.lymphocytes || "-"}%`,       pct: Math.min(parseFloat(result.lymphocytes)||0, 100) },
    { name: "RDW-CV",          val: `${result.rdwcv || "-"}%`,             pct: Math.min((parseFloat(result.rdwcv)||0) / 20 * 100, 100) },
  ];

  const buildPdfFile = async () => {
    const html = generateHTML(result);
    return await Print.printToFileAsync({ html });
  };

  const handleDownloadPDF = async () => {
    try {
      // Membuat PDF lalu menyimpannya ke folder pilihan pengguna di Android.
      const { uri } = await buildPdfFile();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `laporan_malaria_${timestamp}.pdf`;

      if (Platform.OS === "android") {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          showMessage({ title: "Batal", message: "Pemilihan folder penyimpanan dibatalkan.", type: "error" });
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf"
        );
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        showMessage({ title: "Berhasil", message: `PDF berhasil disimpan dengan nama ${fileName}.`, type: "success" });
        return;
      }

      const targetUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: targetUri });
      showMessage({ title: "Berhasil", message: "PDF berhasil disimpan.", type: "success" });
    } catch (e) {
      showMessage({ title: "Gagal", message: "Tidak dapat menyimpan PDF.", type: "error" });
    }
  };

  const handleSharePDF = async () => {
    try {
      // Membuat PDF lalu membuka menu bagikan.
      const { uri } = await buildPdfFile();
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Laporan Skrining Malaria" });
    } catch (e) {
      showMessage({ title: "Gagal", message: "Tidak dapat membagikan PDF.", type: "error" });
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

        {/* Bagian ini menampilkan tingkat keyakinan dan hasil utama. */}
        <View style={[styles.resultHero, { backgroundColor: bgColor }]}>
          <View style={[styles.ring, { borderColor: color }]}>
            <Text style={[styles.ringPct, { color }]}>{result.confidence || "--"}%</Text>
            <Text style={styles.ringLabel}>RISIKO</Text>
          </View>
          <Text style={[styles.resultStatus, { color }]}>
            {resultLabel.toUpperCase()}
          </Text>
          <Text style={styles.resultDesc}>
            {isPositive
              ? "Hasil skrining mengarah ke risiko malaria. Pemeriksaan apusan darah atau RDT tetap diperlukan untuk memastikan hasil."
              : "Parameter yang dimasukkan belum menunjukkan pola yang kuat ke arah malaria. Jika gejala berlanjut, lakukan pemeriksaan lanjutan."}
          </Text>
        </View>

        {/* Bagian ini menampilkan saran sesuai hasil prediksi. */}
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
              <RecStep num="3" text="Tetap waspada jika berada di area endemis malaria - ulangi tes jika gejala berlanjut" color="#B39DDB" />
            </>
          )}
        </View>

        {/* Bagian ini menampilkan ringkasan data input. */}
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

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Gejala Pasien</Text>
          {symptoms.length > 0 ? (
            <View style={styles.symptomList}>
              {symptoms.map(symptom => (
                <View key={symptom} style={styles.symptomItem}>
                  <Ionicons name="checkmark-circle" size={16} color={color} />
                  <Text style={styles.symptomText}>{symptom}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySymptoms}>Tidak ada gejala yang dipilih.</Text>
          )}
        </View>

        {/* Bagian ini menampilkan data dasar pasien. */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Data Pasien</Text>
          <DataRow label="Nama Pasien" value={result.patientName || "-"} />
          <DataRow label="Jenis Kelamin" value={sexLabel} />
          <DataRow label="Usia" value={result.age ? `${result.age} Tahun` : "-"} />
          <DataRow label="Tanggal" value={result.date || "-"} />
        </View>


      </ScrollView>

      {/* Tombol utama setelah hasil keluar diletakkan di bagian bawah. */}
      <View style={styles.fixedBottom}>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleDownloadPDF} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={18} color="#0A0F1E" />
            <Text style={styles.btnPrimaryText}>Unduh PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDark} onPress={handleSharePDF} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={18} color="#EEF2FF" />
            <Text style={styles.btnDarkText}>Bagikan PDF</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnDark} onPress={() => navigation.navigate("Form")} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#EEF2FF" />
            <Text style={styles.btnDarkText}>Baru</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate("Main")} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>

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
              <Text style={styles.modalActionText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RecStep({ num, text, color }) {
  // Bagian kecil ini dipakai untuk menampilkan satu poin saran.
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
  // Bagian kecil ini dipakai untuk menampilkan label dan nilainya.
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

function formatSex(sex) {
  if (sex === "Male") return "Laki-laki";
  if (sex === "Female") return "Perempuan";
  return sex || "-";
}

function formatResultLabel(result) {
  if (result === "Positive") return "Positif";
  if (result === "Negative") return "Negatif";
  return result || "-";
}

function generateHTML(r) {
  // Fungsi ini membuat isi laporan PDF.
  const isPos = r.result === "Positive";
  const color = isPos ? "#FF4F6B" : "#B39DDB";
  const symptoms = Array.isArray(r.symptoms) ? r.symptoms : [];
  const resultLabel = formatResultLabel(r.result);

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
    "Sebaiknya pasien segera melakukan pemeriksaan lanjutan, seperti apusan darah atau RDT.",
    "Bawa hasil ini saat berkonsultasi dengan dokter atau tenaga kesehatan.",
    "Perhatikan tanda bahaya seperti demam tinggi, menggigil berat, sangat lemas, atau penurunan kesadaran.",
    "Pengobatan hanya diberikan setelah hasil dipastikan oleh tenaga kesehatan.",
  ];
  const rekNeg = [
    "Hasil skrining belum mengarah kuat ke malaria berdasarkan data yang dimasukkan.",
    "Jika demam atau keluhan lain masih berlanjut, pasien tetap perlu diperiksa kembali.",
    "Jika pasien tinggal atau baru bepergian dari daerah endemis malaria, pemeriksaan ulang tetap disarankan.",
  ];
  const pencegahan = [
    "Gunakan kelambu saat tidur, terutama jika tinggal di daerah rawan malaria.",
    "Pakai baju lengan panjang dan celana panjang saat keluar rumah pada malam hari.",
    "Gunakan losion atau semprotan antinyamuk sesuai petunjuk pemakaian.",
    "Bersihkan genangan air di sekitar rumah agar nyamuk tidak mudah berkembang biak.",
    "Jika akan bepergian ke daerah endemis malaria, konsultasikan dulu dengan tenaga kesehatan.",
  ];
  const rekom = isPos ? rekPos : rekNeg;

  return `<html>
  <head>
    <style>
      @page { margin: 0; background: #F8FAFC; }
      html, body {
        margin: 0;
        padding: 0;
        background: #F8FAFC !important;
        color: #111827 !important;
        font-family: Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .pdf-page {
        min-height: 100vh;
        padding: 32px;
        background: #F8FAFC;
        color: #111827;
      }
      .pdf-section {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .pdf-section-spacious {
        padding-top: 14px;
      }
      .pdf-title-spacious {
        margin-top: 32px !important;
      }
      .pdf-list {
        margin: 0;
        padding-left: 20px;
        color: #475569;
        font-size: 13px;
        line-height: 1.8;
      }
      .pdf-list li {
        margin-bottom: 6px;
      }
    </style>
  </head>
  <body>
  <div class="pdf-page">
    <div style="text-align:center;margin-bottom:24px">
      <h2 style="color:#4F46E5;margin:0">MalariaCheck</h2>
      <p style="color:#64748B;margin:4px 0">Laporan Skrining Awal Malaria</p>
      <p style="color:#64748B;font-size:12px">Hari, Tanggal: ${tanggalStr}</p>
      <p style="color:#64748B;font-size:12px">Waktu: ${waktuStr}</p>
    </div>
    <div style="background:${isPos ? "#FFF1F2" : "#EEF2FF"};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid ${color}">
      <h1 style="color:${color};margin:0">${resultLabel}</h1>
      <p style="margin:8px 0;color:#111827">Tingkat Risiko: <strong>${r.confidence}%</strong></p>
      <p style="margin:4px 0;color:#475569;font-size:13px">${isPos ? "Hasil skrining ini mengarah ke risiko malaria. Pasien tetap perlu pemeriksaan lanjutan agar hasilnya lebih pasti." : "Hasil skrining ini belum mengarah kuat ke malaria. Jika keluhan masih ada, pasien sebaiknya tetap diperiksa kembali."}</p>
    </div>
    <h3 style="color:#111827;margin-top:24px;margin-bottom:8px">Data Pasien</h3>
    <table width="100%" style="border-collapse:collapse;font-size:13px;color:#111827">
      ${[["Nama Pasien",r.patientName],["Jenis Kelamin",formatSex(r.sex)],["Usia",r.age+" Tahun"],
        ["Hemoglobin",r.hemoglobin+" g/dL"],["Total WBC Count",r.wbc+" x10/uL"],
        ["Neutrofil",r.neutrophils+"%"],["Limfosit",r.lymphocytes+"%"],
        ["Eosinofil",r.eosinophils+" x10/uL"],["HCT/PCV",r.htc+"%"],
        ["MCH",r.mch+" pg"],["MCHC",r.mchc+" g/dL"],
        ["RDW-CV",r.rdwcv+"%"],["Platelet Count",r.platelet+" x10/uL"],
      ].map(([l,v],i)=>`<tr style="background:${i%2===0?"#FFFFFF":"#F1F5F9"}">
        <td style="padding:8px 12px;border:1px solid #E2E8F0"><strong>${l}</strong></td>
        <td style="padding:8px 12px;border:1px solid #E2E8F0">${v||"-"}</td>
      </tr>`).join("")}
    </table>
    <div class="pdf-section">
      <h3 style="color:#111827;margin-top:24px;margin-bottom:8px">Gejala Pasien</h3>
      ${symptoms.length > 0
        ? `<ul class="pdf-list">${symptoms.map(item => `<li>${item}</li>`).join("")}</ul>`
        : `<p style="color:#475569;font-size:13px">Tidak ada gejala yang dipilih.</p>`}
    </div>
    <div class="pdf-section">
      <h3 style="color:#111827;margin-top:24px;margin-bottom:8px">${isPos ? "Tindakan yang Disarankan" : "Rekomendasi"}</h3>
      <ul class="pdf-list">
        ${rekom.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
    <div class="pdf-section pdf-section-spacious">
      <h3 class="pdf-title-spacious" style="color:#111827;margin-top:24px;margin-bottom:8px">Pencegahan Malaria</h3>
      <ul class="pdf-list">
        ${pencegahan.map(p => `<li>${p}</li>`).join("")}
      </ul>
    </div>
    <p style="text-align:center;color:#64748B;font-size:11px;margin-top:32px">
      MalariaCheck<br/>
      <em>Hasil ini bersifat pendukung, bukan pengganti diagnosis klinis.</em>
    </p>
  </div>
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
  symptomList:    { gap: 10 },
  symptomItem:    { flexDirection: "row", alignItems: "center", gap: 10 },
  symptomText:    { flex: 1, fontSize: 13, color: "#EEF2FF", lineHeight: 20 },
  emptySymptoms:  { fontSize: 13, color: "#7B87A6", lineHeight: 20 },
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
