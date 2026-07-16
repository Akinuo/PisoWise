// src/utils/recurring.js
// Small date-math helpers for recurring transactions (bills/income that
// repeat on a schedule). Kept separate from formatters.js since this is a
// distinct, self-contained concern.
//
// Language-aware the same way getCategoryInfo() is (see constants.js) —
// reads the current language directly from the store since these are plain
// functions, not hooks.
import useStore from '../store/useStore';
import { TRANSLATIONS } from '../i18n/translations';

const getDict = () => {
  const language = useStore.getState().language;
  return TRANSLATIONS[language]?.recurring || TRANSLATIONS.fil.recurring;
};

/**
 * Given a 'YYYY-MM-DD' due date and a frequency, return the next due date
 * (also 'YYYY-MM-DD') after this one.
 */
export const advanceDueDate = (dueDateStr, frequency) => {
  const d = new Date(dueDateStr + 'T00:00:00');
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  if (frequency === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Classify a recurring item's status relative to today:
 * 'overdue' (past due), 'due-soon' (within the next 3 days), or 'upcoming'.
 */
export const getDueStatus = (dueDateStr) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDateStr + 'T00:00:00');
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'overdue';
  if (diffDays <= 3) return 'due-soon';
  return 'upcoming';
};

/** Human-readable label for a due date's status, in the current language. */
export const getDueLabel = (dueDateStr) => {
  const dict = getDict();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDateStr + 'T00:00:00');
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return dict.overdueDays.replace('{days}', Math.abs(diffDays));
  if (diffDays === 0) return dict.dueToday;
  if (diffDays === 1) return dict.dueTomorrow;
  return dict.dueInDays.replace('{days}', diffDays);
};

/** Human-readable frequency label ('weekly'/'monthly'/'yearly') in the current language. */
export const getFrequencyLabel = (frequency) => {
  const dict = getDict();
  return dict[frequency] || frequency;
};
