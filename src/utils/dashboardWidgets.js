// src/utils/dashboardWidgets.js
//
// Lets the user hide Dashboard sections they don't care about. A UI
// preference, not user data, so localStorage is the right home for it.

const STORAGE_KEY = 'pw_dashboard_widgets';

// Labels are translated in Dashboard.jsx via t('dashboard.widgets.' + id) —
// kept out of this config so this file doesn't need to know about i18n.
export const WIDGET_IDS = [
  'recurringBills', 'chart', 'healthScore', 'quickActions', 'recentTransactions', 'quickLinks',
];

const DEFAULT_VISIBILITY = Object.fromEntries(WIDGET_IDS.map(id => [id, true]));

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
