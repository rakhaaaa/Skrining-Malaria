import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { predictMalaria } from "../utils/api";
import { saveHistory } from "../utils/storage";
import { useTheme } from "../theme";

// Daftar semua input yang dipakai di form diagnosis.
const FIELDS = [
  { key: "age",         label: "Usia",           unit: "tahun",   hint: "Contoh: 25",                        group: "pasien" },
  { key: "hemoglobin",  label: "Hemoglobin",      unit: "Hb%",     hint: "Normal: 12-17 Hb%",                group: "hematologi" },
  { key: "wbc",         label: "Total WBC Count", unit: "/cumm",   hint: "Normal: 4000-10000 /cumm",         group: "hematologi" },
  { key: "neutrophils", label: "Neutrofil",        unit: "%",       hint: "Normal: 50-70%",                   group: "hematologi" },
  { key: "lymphocytes", label: "Limfosit",         unit: "%",       hint: "Normal: 20-40%",                   group: "hematologi" },
  { key: "eosinophils", label: "Total Eosinofil",  unit: "/cumm",   hint: "Normal: 50-500 /cumm",             group: "hematologi" },
  { key: "htc",         label: "HCT/PCV",          unit: "%",       hint: "Normal: 36-50%",                   group: "eritrosit" },
  { key: "mch",         label: "MCH",              unit: "pg",      hint: "Normal: 27-33 pg",                 group: "eritrosit" },
  { key: "mchc",        label: "MCHC",             unit: "g/dl",    hint: "Normal: 32-36 g/dl",               group: "eritrosit" },
  { key: "rdwcv",       label: "RDW-CV",           unit: "%",       hint: "Normal: 11.5-14.5%",               group: "eritrosit" },
  { key: "platelet",    label: "Platelet Count",   unit: "/cumm",   hint: "Normal: 150000-400000 /cumm",      group: "trombosit" },
];

const SYMPTOMS = [
  "Demam tinggi",
  "Menggigil",
  "Berkeringat",
  "Sakit kepala",
  "Mual atau muntah",
  "Nyeri otot",
  "Lemas",
  "Penurunan kesadaran sebagai tanda bahaya",
];

export default function FormScreen() {
  // navigation dipakai untuk pindah halaman.
  const navigation = useNavigation();

  // State berikut menyimpan isi form yang diinput pengguna.
  const [patientName, setPatientName] = useState("");
  const [sex, setSex] = useState("");
  const [form, setForm] = useState({});
  const [symptoms, setSymptoms] = useState([]);
  const [symptomOpen, setSymptomOpen] = useState(false);

  // loading dipakai untuk menandai proses prediksi sedang berjalan.
  const [loading, setLoading] = useState(false);

  // errors dipakai untuk menyimpan pesan error tiap input.
  const [errors, setErrors] = useState({});

  // Mengambil tema warna yang sedang dipakai aplikasi.
  const { themeName, theme } = useTheme();

  const toggleSymptom = (symptom) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(item => item !== symptom)
        : [...prev, symptom]
    );
  };

  const clearError = (key) => {
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSexChange = (value) => {
    setSex(value);
    clearError("sex");
  };

  const handleFieldChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const symptomLabel = symptoms.length > 0 ? `${symptoms.length} gejala dipilih` : "Pilih gejala pasien";

  // Menghitung progres pengisian form.
  const totalFields = FIELDS.length + 2;
  const filled = [patientName, sex, ...FIELDS.map(f => form[f.key])].filter(v => v && v !== "").length;
  const progress = filled / totalFields;

  // Fungsi ini mengecek apakah semua input wajib sudah benar.
  const validate = () => {
    const err = {};
    // Nama pasien boleh kosong.
    if (!sex) err.sex = "Pilih jenis kelamin";
    FIELDS.forEach(f => {
      const val = form[f.key];
      if (!val || val.trim() === "") err[f.key] = "Wajib diisi";
      else if (isNaN(Number(val))) err[f.key] = "Harus angka";
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Fungsi ini mengirim data ke backend lalu menyimpan hasilnya ke riwayat.
  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert("Data Tidak Lengkap", "Lengkapi semua data terlebih dahulu.");
      return;
    }
    setLoading(true);
    try {
      const payload = { sex, ...Object.fromEntries(FIELDS.map(f => [f.key, form[f.key]])) };
      const res = await predictMalaria(payload);
      const record = {
        patientName: patientName.trim() || "Pasien Anonim", sex, ...payload,
        symptoms,
        result: res.result, confidence: res.confidence,
        proba_pos: res.proba_pos, proba_neg: res.proba_neg,
        date: new Date().toLocaleString("id-ID"),
      };
      await saveHistory(record);
      navigation.navigate("Result", { result: record });
    } catch (e) {
      Alert.alert("Analisis Gagal", e.message || "Pastikan server backend sudah berjalan dan IP sudah benar di src/utils/api.js");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Wadah utama halaman form.
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={themeName === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header berisi tombol kembali, judul, dan tombol reset form. */}
      <View style={styles.topnav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#EEF2FF" />
        </TouchableOpacity>
        <Text style={styles.topnavTitle}>Input Data Lab</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setForm({}); setSex(""); setPatientName(""); setSymptoms([]); setSymptomOpen(false); setErrors({}); }}>
          <Ionicons name="trash-outline" size={18} color="#7B87A6" />
        </TouchableOpacity>
      </View>

      {/* Titik progres ini membantu menunjukkan seberapa banyak form yang sudah diisi. */}
      <View style={styles.progressWrap}>
        {[0.25, 0.5, 0.75, 1].map((threshold, i) => (
          <View key={i} style={[styles.progDot, progress >= threshold && styles.progDotDone, progress >= threshold - 0.24 && progress < threshold && styles.progDotActive]} />
        ))}
      </View>

      {/* Isi form dibuat scroll supaya tetap nyaman di layar kecil. */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color="#00B8FF" />
          <Text style={styles.infoText}>Masukkan data pasien, gejala yang tampak, dan hasil pemeriksaan darah lengkap.</Text>
        </View>

        <Text style={styles.sectionTitle}>Data Pasien</Text>

        {/* Input nama pasien. */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Nama Pasien <Text style={styles.optional}>(Opsional)</Text></Text>
          <TextInput
            style={[styles.input, errors.patientName && styles.inputError]}
            placeholder="Masukkan nama pasien"
            placeholderTextColor="#4A5568"
            value={patientName}
            onChangeText={setPatientName}
          />
          {errors.patientName && <Text style={styles.errorText}>{errors.patientName}</Text>}
        </View>

        {/* Pilihan jenis kelamin. */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Jenis Kelamin <Text style={styles.required}>*</Text></Text>
          <View style={styles.sexRow}>
            {[["Male", "Laki-laki"], ["Female", "Perempuan"]].map(([val, label]) => (
              <TouchableOpacity key={val} style={[styles.sexBtn, sex === val && styles.sexBtnActive]} onPress={() => handleSexChange(val)}>
                <Text style={[styles.sexText, sex === val && styles.sexTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
        </View>

        {/* Usia ditampilkan lebih dulu sebelum kelompok data lab lainnya. */}
        <FieldRow field={FIELDS[0]} form={form} onChange={handleFieldChange} errors={errors} />

        <Text style={[styles.sectionTitle, styles.symptomSectionTitle]}>Gejala Pasien</Text>
        <View style={styles.dropdownWrap}>
          <TouchableOpacity
            style={[styles.dropdownBtn, symptomOpen && styles.dropdownBtnActive]}
            onPress={() => setSymptomOpen(prev => !prev)}
            activeOpacity={0.85}
          >
            <View style={styles.dropdownLabelWrap}>
              <Text style={[styles.dropdownLabel, symptoms.length > 0 && styles.dropdownLabelActive]}>{symptomLabel}</Text>
              {symptoms.length > 0 && (
                <Text style={styles.dropdownSummary} numberOfLines={1}>{symptoms.join(", ")}</Text>
              )}
            </View>
            <Ionicons name={symptomOpen ? "chevron-up" : "chevron-down"} size={20} color="#B39DDB" />
          </TouchableOpacity>

          {symptomOpen && (
            <View style={styles.dropdownMenu}>
              {SYMPTOMS.map(symptom => {
                const active = symptoms.includes(symptom);
                return (
                  <TouchableOpacity
                    key={symptom}
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => toggleSymptom(symptom)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={active ? "checkbox" : "square-outline"}
                      size={18}
                      color={active ? "#B39DDB" : "#7B87A6"}
                    />
                    <Text style={[styles.symptomText, active && styles.symptomTextActive]}>{symptom}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Parameter Hematologi</Text>
        {FIELDS.filter(f => f.group === "hematologi").map(f => (
          <FieldRow key={f.key} field={f} form={form} onChange={handleFieldChange} errors={errors} />
        ))}

        <Text style={styles.sectionTitle}>Indeks Eritrosit</Text>
        {FIELDS.filter(f => f.group === "eritrosit").map(f => (
          <FieldRow key={f.key} field={f} form={form} onChange={handleFieldChange} errors={errors} />
        ))}

        <Text style={styles.sectionTitle}>Trombosit</Text>
        {FIELDS.filter(f => f.group === "trombosit").map(f => (
          <FieldRow key={f.key} field={f} form={form} onChange={handleFieldChange} errors={errors} />
        ))}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Tombol submit dibuat tetap di bawah supaya mudah ditekan. */}
      <View style={styles.fixedBottom}>
        <TouchableOpacity style={[styles.btnSubmit, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#0A0F1E" />
            : <><Ionicons name="shield-checkmark-outline" size={20} color="#0A0F1E" /><Text style={styles.btnSubmitText}>Analisis Sekarang</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Komponen kecil ini dipakai berulang untuk setiap input angka pada form.
function FieldRow({ field, form, onChange, errors }) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{field.label} <Text style={styles.required}>*</Text></Text>
        <Text style={styles.unit}>{field.unit}</Text>
      </View>
      <TextInput
        style={[styles.input, errors[field.key] && styles.inputError]}
        placeholder={field.hint || "Masukkan nilai"}
        placeholderTextColor="#4A5568"
        keyboardType="numeric"
        value={form[field.key] || ""}
        onChangeText={v => onChange(field.key, v)}
      />
      {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  // Gaya dasar halaman form.
  container:     { flex: 1, backgroundColor: "#0A0F1E" },
  topnav:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: "#0F1628", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  topnavTitle:   { fontSize: 16, fontWeight: "700", color: "#EEF2FF" },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "#141B2D", alignItems: "center", justifyContent: "center" },

  // Gaya progress pengisian form.
  progressWrap:  { flexDirection: "row", gap: 8, padding: 16, paddingHorizontal: 20, backgroundColor: "#0F1628" },
  progDot:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#192035" },
  progDotActive: { backgroundColor: "rgba(179,157,219,0.4)" },
  progDotDone:   { backgroundColor: "#B39DDB" },

  // Gaya area isi form.
  body:          { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  infoCard:      { flexDirection: "row", gap: 10, backgroundColor: "rgba(0,184,255,0.08)", borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "rgba(0,184,255,0.2)" },
  infoText:      { flex: 1, fontSize: 12, color: "#7B87A6", lineHeight: 18 },
  sectionTitle:  { fontSize: 11, fontWeight: "700", color: "#7B87A6", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14, marginTop: 8 },
  symptomSectionTitle: { color: "#EEF2FF" },
  fieldWrap:     { marginBottom: 14 },
  labelRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label:         { fontSize: 13, fontWeight: "600", color: "#EEF2FF" },
  optional:      { color: "#7B87A6", fontWeight: "400", fontSize: 12 },
  unit:          { fontSize: 12, color: "#7B87A6" },
  input:         { backgroundColor: "#141B2D", borderRadius: 12, padding: 14, fontSize: 14, color: "#EEF2FF", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  inputError:    { borderColor: "#FF4F6B" },
  errorText:     { fontSize: 11, color: "#FF4F6B", marginTop: 4 },
  sexRow:        { flexDirection: "row", gap: 10 },
  sexBtn:        { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "#141B2D", alignItems: "center" },
  sexBtnActive:  { borderColor: "#B39DDB", backgroundColor: "rgba(179,157,219,0.1)" },
  sexText:       { fontSize: 13, fontWeight: "600", color: "#7B87A6" },
  sexTextActive: { color: "#B39DDB" },
  dropdownWrap:  { marginBottom: 18 },
  dropdownBtn:   { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, backgroundColor: "#141B2D", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  dropdownBtnActive: { borderColor: "#B39DDB", backgroundColor: "rgba(179,157,219,0.08)" },
  dropdownLabelWrap: { flex: 1 },
  dropdownLabel: { fontSize: 13, fontWeight: "600", color: "#EEF2FF" },
  dropdownLabelActive: { color: "#EEF2FF" },
  dropdownSummary: { marginTop: 3, fontSize: 11, color: "#7B87A6" },
  dropdownMenu:  { marginTop: 8, overflow: "hidden", backgroundColor: "#141B2D", borderRadius: 12, borderWidth: 1, borderColor: "rgba(179,157,219,0.2)" },
  dropdownItem:  { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  dropdownItemActive: { backgroundColor: "rgba(179,157,219,0.1)" },
  symptomText:   { flex: 1, fontSize: 13, fontWeight: "600", color: "#EEF2FF", lineHeight: 18 },
  symptomTextActive: { color: "#EEF2FF" },

  // Gaya tombol submit di bawah.
  fixedBottom:   { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: "#0A0F1E", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  btnSubmit:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#B39DDB", borderRadius: 14, padding: 18 },
  btnSubmitText: { fontSize: 16, fontWeight: "700", color: "#0A0F1E" },
});
