/**
 * Theme Manager Module
 * Manages visual themes: dark (default), pixel (retro 8-bit), oled (deep black), sepia (paper mode).
 */

export const THEMES = [
  { id: 'dark', name: 'Ciemny', icon: '🌙' },
  { id: 'pixel', name: 'Pixel RPG', icon: '👾' },
  { id: 'oled', name: 'OLED Black', icon: '🖤' },
  { id: 'sepia', name: 'Sepia Paper', icon: '📜' },
];

const STORAGE_KEY = 'app_theme';

export function getTheme() {
  const saved = window.localStorage?.getItem(STORAGE_KEY);
  if (saved && THEMES.some((t) => t.id === saved)) {
    return saved;
  }
  return 'dark';
}

export function setTheme(themeId) {
  if (!THEMES.some((t) => t.id === themeId)) {
    return;
  }
  window.localStorage?.setItem(STORAGE_KEY, themeId);
  document.documentElement.setAttribute('data-theme', themeId);
}

export function initTheme() {
  const current = getTheme();
  document.documentElement.setAttribute('data-theme', current);
  return current;
}
