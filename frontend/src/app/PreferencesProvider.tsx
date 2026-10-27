import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { apiFetch } from '../lib/api';
import { getToken } from '../lib/auth';
import { translate, type Language, type MessageKey } from '../lib/i18n';
import {
  readUiPreferences,
  subscribeUiPreferences,
  writeUiPreferences,
  type UiPreferences
} from '../lib/uiPreferences';
import { createAppTheme, type ThemeMode } from './theme';

interface PreferencesContextValue extends UiPreferences {
  t: (key: MessageKey) => string;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

async function persist(patch: Partial<UiPreferences>) {
  const token = getToken();
  if (!token) return;
  const response = await apiFetch('/auth/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
  if (!response.ok) {
    throw new Error('No se pudieron guardar las preferencias');
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UiPreferences>(readUiPreferences);

  useEffect(() => subscribeUiPreferences(() => setPreferences(readUiPreferences())), []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
    document.documentElement.lang = preferences.language;
    document.documentElement.style.colorScheme = preferences.theme;
  }, [preferences]);

  const theme = useMemo(() => createAppTheme(preferences.theme), [preferences.theme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...preferences,
      t: (key) => translate(preferences.language, key),
      setTheme: async (next) => {
        const previous = readUiPreferences().theme;
        writeUiPreferences({ theme: next });
        try {
          await persist({ theme: next });
        } catch (error) {
          writeUiPreferences({ theme: previous });
          throw error;
        }
      },
      setLanguage: async (next) => {
        const previous = readUiPreferences().language;
        writeUiPreferences({ language: next });
        try {
          await persist({ language: next });
        } catch (error) {
          writeUiPreferences({ language: previous });
          throw error;
        }
      }
    }),
    [preferences]
  );

  return (
    <PreferencesContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences debe usarse dentro de PreferencesProvider');
  return value;
}
