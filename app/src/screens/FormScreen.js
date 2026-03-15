import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { predictMalaria } from "../utils/api";
import { saveHistory } from "../utils/storage";

const FIELDS = [
  { key: "age",         label: "Usia",           unit: "tahun",   hint: "",                             group: "pasien" },
  { key: "hemoglobin",  label: "Hemoglobin",      unit: "g/dL",    hint: "Normal: 12-17 g/dL",          group: "hematologi" },
  { key: "wbc",         label: "Total WBC Count", unit: "x10/uL",  hint: "Normal: 4-10 x10/uL",         group: "hematologi" },
  { key: "neutrophils", label: "Neutrofil",        unit: "%",       hint: "Normal: 50-70%",              group: "hematologi" },
  { key: "lymphocytes", label: "Limfosit",         unit: "%",       hint: "Normal: 20-40%",              group: "hematologi" },
  { key: "eosinophils", label: "Total Eosinofil",  unit: "x10/uL",  hint: "Normal: 0.05-0.5",           group: "hematologi" },
  { key: "htc",         label: "HCT/PCV",          unit: "%",       hint: "Normal: 36-50%",              group: "eritrosit" },
  { key: "mch",         label: "MCH",              unit: "pg",      hint: "Normal: 27-33 pg",            group: "eritrosit" },
  { key: "mchc",        label: "MCHC",             unit: "g/dL",    hint: "Normal: 32-36 g/dL",         group: "eritrosit" },
  { key: "rdwcv",       label: "RDW-CV",           unit: "%",       hint: "Normal: 11.5-14.5%",          group: "eritrosit" },
  { key: "platelet",    label: "Platelet Count",   unit: "x10/uL",  hint: "Normal: 150-400 x10/uL",     group: "trombosit" },
];

export default function FormScreen() {
  const navigation = useNavigation();
  const [patientName, setPatientName] = useState("");
  const [sex, setSex] = useState("");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const totalFields = FIELDS.length + 2;
  const filled = [patientName, sex, ...FIELDS.map(f => form[f.key])].filter(v => v && v !== "").length;
  const progress = filled / totalFields;

  const validate = () => {
    const err = {};
    // patientName is optional
    if (!sex) err.sex = "Pilih jenis kelamin";
    FIELDS.forEach(f => {
      const val = form[f.key];
      if (!val || val.trim() === "") err[f.key] = "Wajib diisi";
      else if (isNaN(Number(val))) err[f.key] = "Harus angka";
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

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
        result: res.result, confidence: res.confidence,
        proba_pos: res.proba_pos, proba_neg: res.proba_neg,
        date: new Date().toLocaleString("id-ID"),
      };
      await saveHistory(record);
      navigation.navigate("Result", { result: record });
    } catch (e) {
      Alert.alert("Koneksi Gagal", "Pastikan server backend sudah berjalan dan IP sudah benar di src/utils/api.js");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F1E" />

      <View style={styles.topnav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#EEF2FF" />
        </TouchableOpacity>
        <Text style={styles.topnavTitle}>Input Data Lab</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setForm({}); setSex(""); setPatientName(""); setErrors({}); }}>
          <Ionicons name="trash-outline" size={18} color="#7B87A6" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrap}>
        {[0.25, 0.5, 0.75, 1].map((threshold, i) => (
          <View key={i} style={[styles.progDot, progress >= threshold && styles.progDotDone, progress >= threshold - 0.24 && progress < threshold && styles.progDotActive]} />
        ))}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color="#00B8FF" />
          <Text style={styles.infoText}>Masukkan hasil pemeriksaan darah lengkap pasien.</Text>
        </View>

        <Text style={styles.sectionTitle}>Data Pasien</Text>

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

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Jenis Kelamin <Text style={styles.required}>*</Text></Text>
          <View style={styles.sexRow}>
            {[["Male", "Laki-laki"], ["Female", "Perempuan"]].map(([val, label]) => (
              <TouchableOpacity key={val} style={[styles.sexBtn, sex === val && styles.sexBtnActive]} onPress={() => setSex(val)}>
                <Text style={[styles.sexText, sex === val && styles.sexTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
        </View>

        <FieldRow field={FIELDS[0]} form={form} setForm={setForm} errors={errors} />

        <Text style={styles.sectionTitle}>Parameter Hematologi</Text>
        {FIELDS.filter(f => f.group === "hematologi").map(f => (
          <FieldRow key={f.key} field={f} form={form} setForm={setForm} errors={errors} />
        ))}

        <Text style={styles.sectionTitle}>Indeks Eritrosit</Text>
        {FIELDS.filter(f => f.group === "eritrosit").map(f => (
          <FieldRow key={f.key} field={f} form={form} setForm={setForm} errors={errors} />
        ))}

        <Text style={styles.sectionTitle}>Trombosit</Text>
        {FIELDS.filter(f => f.group === "trombosit").map(f => (
          <FieldRow key={f.key} field={f} form={form} setForm={setForm} errors={errors} />
        ))}

        <View style={{ height: 140 }} />
      </ScrollView>

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

function FieldRow({ field, form, setForm, errors }) {
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
        onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
      />
      {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#0A0F1E" },
  topnav:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: "#0F1628", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  topnavTitle:   { fontSize: 16, fontWeight: "700", color: "#EEF2FF" },
  backBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "#141B2D", alignItems: "center", justifyContent: "center" },
  progressWrap:  { flexDirection: "row", gap: 8, padding: 16, paddingHorizontal: 20, backgroundColor: "#0F1628" },
  progDot:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#192035" },
  progDotActive: { backgroundColor: "rgba(179,157,219,0.4)" },
  progDotDone:   { backgroundColor: "#B39DDB" },
  body:          { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  infoCard:      { flexDirection: "row", gap: 10, backgroundColor: "rgba(0,184,255,0.08)", borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "rgba(0,184,255,0.2)" },
  infoText:      { flex: 1, fontSize: 12, color: "#7B87A6", lineHeight: 18 },
  sectionTitle:  { fontSize: 11, fontWeight: "700", color: "#7B87A6", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14, marginTop: 8 },
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
  fixedBottom:   { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: "#0A0F1E", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  btnSubmit:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#B39DDB", borderRadius: 14, padding: 18 },
  btnSubmitText: { fontSize: 16, fontWeight: "700", color: "#0A0F1E" },
});
