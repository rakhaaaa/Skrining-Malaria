// Mengimpor React utk buat komponen utama aplikasi.
import React from "react";
// Mengimpor NavigationContainer sebagai wadah utama sistem navigasi aplikasi.
import { NavigationContainer } from "@react-navigation/native";
// Mengimpor createNativeStackNavigator utk mengatur perpindahan antar halaman dgn model stack.
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// Mengimpor halaman splash yg tampil pas aplikasi pertama kali dibuka.
import SplashScreen from "./src/screens/SplashScreen";
// Mengimpor halaman login utk proses masuk pengguna.
import LoginScreen from "./src/screens/LoginScreen";
// Mengimpor halaman beranda utama aplikasi.
import HomeScreen from "./src/screens/HomeScreen";
// Mengimpor halaman form utk input data pasien dan hasil pemeriksaan.
import FormScreen from "./src/screens/FormScreen";
// Mengimpor halaman hasil utk menampilkan output prediksi.
import ResultScreen from "./src/screens/ResultScreen";
// Mengimpor halaman riwayat utk lihat data pemeriksaan sebelumnya.
import HistoryScreen from "./src/screens/HistoryScreen";
// Mengimpor halaman tentang yg isi nya informasi aplikasi.
import AboutScreen from "./src/screens/AboutScreen";
// Mengimpor ThemeProvider supaya tema aplikasi bisa dipakai di semua halaman.
import { ThemeProvider } from "./src/theme";

// Stack dipakai untuk mengatur perpindahan antar halaman aplikasi.
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // ThemeProvider membuat warna tema bisa dipakai di semua halaman.
    <ThemeProvider>
      {/* NavigationContainer wajib ada supaya navigasi antar screen bisa berjalan. */}
      <NavigationContainer>
        {/*
          Stack.Navigator adalah daftar semua halaman utama aplikasi.
          Splash dijadikan halaman pertama, dan header bawaan React Navigation disembunyikan.
        */}
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          {/* Halaman pembuka saat aplikasi baru dijalankan. */}
          <Stack.Screen name="Splash" component={SplashScreen} />

          {/* Halaman login dan register tenaga medis. */}
          <Stack.Screen name="Login" component={LoginScreen} />

          {/* Halaman beranda utama aplikasi. */}
          <Stack.Screen name="Main" component={HomeScreen} />

          {/* Halaman form untuk input data pasien dan hasil lab. */}
          <Stack.Screen name="Form" component={FormScreen} />

          {/* Halaman yang menampilkan hasil prediksi. */}
          <Stack.Screen name="Result" component={ResultScreen} />

          {/* Halaman untuk melihat riwayat pemeriksaan dan statistik. */}
          <Stack.Screen name="History" component={HistoryScreen} />

          {/* Halaman yang menjelaskan informasi tentang aplikasi. */}
          <Stack.Screen name="About" component={AboutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
