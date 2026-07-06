// src/utils/recurring.js
// Small date-math helpers for recurring transactions (bills/income that
// repeat on a schedule). Kept separate from formatters.js since this is a
// distinct, self-contained concern.

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

/** Human-readable Filipino label for a due date's status. */
export const getDueLabel = (dueDateStr) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDateStr + 'T00:00:00');
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return `${Math.abs(diffDays)} araw na overdue`;
  if (diffDays === 0) return 'Due ngayon';
  if (diffDays === 1) return 'Due bukas';
  return `Due sa ${diffDays} araw`;
};

export const FREQUENCY_LABELS = {
  weekly:  'Lingguhan',
  monthly: 'Buwanan',
  yearly:  'Taunan',
};
