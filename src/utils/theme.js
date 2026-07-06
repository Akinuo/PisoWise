// src/utils/theme.js
//
// Accent theme switching. Themes only override the --pw-gold CSS variable
// family (see index.css) — every other color (backgrounds, semantic
// success/error/warning) stays the same regardless of theme. This is a UI
// preference, not user data, so plain localStorage is the right place for
// it (no privacy concern, and it should apply instantly on load before any
// Firebase round-trip even happens).

const THEME_KEY = 'pw_theme';

export const THEMES = [
  { id: 'default', label: 'Ginto',   color: '#F5B731' }, // Gold — the original PisoWise look
  { id: 'blue',    label: 'Asul',    color: '#3B82F6' },
  { id: 'emerald', label: 'Emerald', color: '#10B981' },
  { id: 'purple',  label: 'Purple',  color: '#8B5CF6' },
];

export const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) || 'default';
  } catch {
    return 'default';
  }
};

/** Applies a theme to the document and persists the choice. */
export const applyTheme = (themeId) => {
  const valid = THEMES.some(t => t.id === themeId) ? themeId : 'default';
  if (valid === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', valid);
  }
  try { localStorage.setItem(THEME_KEY, valid); } catch { /* ignore */ }
};
