// src/utils/dashboardWidgets.js
//
// Lets the user hide Dashboard sections they don't care about. A UI
// preference, not user data, so localStorage is the right home for it.

const STORAGE_KEY = 'pw_dashboard_widgets';

export const WIDGETS = [
  { id: 'recurringBills',    label: 'Paulit-ulit na Bayarin' },
  { id: 'chart',             label: '7-Araw na Chart' },
  { id: 'healthScore',       label: 'Financial Health & Ipon' },
  { id: 'quickActions',      label: 'Mabilis na Aksyon' },
  { id: 'recentTransactions', label: 'Mga Kamakailang Transaksyon' },
  { id: 'quickLinks',        label: 'Quick Links' },
];

const DEFAULT_VISIBILITY = Object.fromEntries(WIDGETS.map(w => [w.id, true]));

export const getWidgetVisibility = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBILITY;
    // Merge with defaults so a newly-added widget (from an app update)
    // defaults to visible even if it's not in the person's saved preferences.
    return { ...DEFAULT_VISIBILITY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VISIBILITY;
  }
};

export const setWidgetVisibility = (visibility) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility)); } catch { /* ignore */ }
};
