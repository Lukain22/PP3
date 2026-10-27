import type { Language } from './i18n';

export interface UiPreferences {
  theme: 'light' | 'dark';
  language: Language;
}

const STORAGE_KEY = 'pp3-ui';
const CHANGE_EVENT = 'pp3-ui';

const defaults: UiPreferences = { theme: 'light', language: 'es' };

export function readUiPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      language: parsed.language === 'en' ? 'en' : 'es'
    };
  } catch {
    return defaults;
  }
}

export function writeUiPreferences(patch: Partial<UiPreferences>): UiPreferences {
  const next = { ...readUiPreferences(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return next;
}

export function subscribeUiPreferences(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
