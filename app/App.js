import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import FormScreen from "./src/screens/FormScreen";
import ResultScreen from "./src/screens/ResultScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import AboutScreen from "./src/screens/AboutScreen";
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
