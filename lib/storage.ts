const TOKEN_KEY = "duitlog_token";
const THEME_KEY = "duitlog_theme";
const LOCALE_KEY = "duitlog_locale";

function canUseStorage() {
  return typeof window !== "undefined";
}

export const storage = {
  getToken() {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
  getTheme() {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(THEME_KEY);
  },
  setTheme(theme: string) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(THEME_KEY, theme);
  },
  getLocale() {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(LOCALE_KEY);
  },
  setLocale(locale: string) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(LOCALE_KEY, locale);
  },
};
