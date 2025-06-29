
import React, { createContext, useState, useEffect, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const storedSettings = localStorage.getItem("userSettings");
    if (storedSettings) {
      try {
        const { theme } = JSON.parse(storedSettings);
        return theme || "light";
      } catch (e) {
        console.error("Failed to parse stored settings", e);
      }
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);


  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    try {
      const storedSettings = localStorage.getItem("userSettings");
      const settings = storedSettings ? JSON.parse(storedSettings) : {};
      localStorage.setItem(
        "userSettings",
        JSON.stringify({
          ...settings,
          theme: newTheme,
        })
      );
    } catch (e) {
      console.error("Failed to update theme in settings", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
