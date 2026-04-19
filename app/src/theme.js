import React, { createContext, useContext, useState } from 'react';

// ThemeContext dipakai untuk membagikan tema ke banyak komponen sekaligus.
const ThemeContext = createContext();

// useTheme memudahkan komponen lain mengambil data tema yang sedang aktif.
export const useTheme = () => useContext(ThemeContext);

// Kumpulan warna untuk mode terang.
const lightTheme = {
  background: '#ffffff',
  text: '#000000',
  primary: '#4CAF50',
  secondary: '#03DAC6',
  card: '#F5F5F5',
  surface: '#F5F5F5',
  muted: '#5F6B7A',
  border: '#E0E0E0',
};

// Kumpulan warna untuk mode gelap.
const darkTheme = {
  background: '#0A0F1E',
  text: '#ffffff',
  primary: '#4CAF50',
  secondary: '#03DAC6',
  card: '#0F1628',
  surface: '#141B2D',
  muted: '#7B87A6',
  border: '#333333',
};

export const ThemeProvider = ({ children }) => {
  // themeName menyimpan mode yang sedang dipakai aplikasi.
  const [themeName, setThemeName] = useState('dark');

  // toggleTheme disiapkan kalau nanti aplikasi ingin diberi fitur ganti tema.
  const toggleTheme = () => {
    setThemeName((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  // Variabel theme berisi kumpulan warna sesuai mode yang sedang aktif.
  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  return (
    // Semua komponen di dalam ThemeProvider bisa memakai theme, themeName, dan toggleTheme.
    <ThemeContext.Provider value={{ themeName, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
