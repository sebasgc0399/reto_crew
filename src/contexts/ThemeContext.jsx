import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1) Estado del tema: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    // al montar: lee localStorage o usa preferencia de sistema
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // 2) Al cambiar theme, actualiza atributo y guarda
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3) Función para alternar
  const toggleTheme = () =>
    setTheme(curr => (curr === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para usar en componentes
export const useTheme = () => useContext(ThemeContext);
