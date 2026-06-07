import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES, DEFAULT_THEME_ID } from "../constants/themes";
import type { ThemeId, AppTheme } from "../constants/themes";

const STORAGE_KEY = "ss_theme_id";

interface ThemeContextValue {
  themeId: ThemeId;
  theme: AppTheme;
  setTheme: (id: ThemeId) => void;
  colors: AppTheme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);

  // Load saved theme from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setThemeId(saved as ThemeId);
        }
      } catch {
        // Silently ignore storage errors; fall back to default
      }
    })();
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {
      // Silently ignore storage errors
    });
  }, []);

  const theme: AppTheme = THEMES[themeId];

  const value: ThemeContextValue = {
    themeId,
    theme,
    setTheme,
    colors: theme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
