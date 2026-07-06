// src/utils/lessonStreaks.js
//
// Lightweight gamification for the Lessons feature — streaks and badges.
// Stored in localStorage, same pattern as the existing completed-lessons
// tracking (this is UI/engagement state, not financial data, so localStorage
// is a fine place for it — nothing here needs to sync across devices).

const STREAK_KEY = 'pw_lesson_streak';

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const getStreakData = () => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { currentStreak: 0, longestStreak: 0, lastCompletionDate: null };
    return JSON.parse(raw);
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastCompletionDate: null };
  }
};

/**
 * Call this whenever a lesson is passed (score >= 75%). Returns the updated
 * streak data. Only the first completion of a given day advances the streak
 * — repeating lessons the same day doesn't inflate it.
 */
export const recordStreakActivity = () => {
  const today = todayStr();
  const data  = getStreakData();

  if (data.lastCompletionDate === today) return data; // already counted today

  const gap = data.lastCompletionDate ? daysBetween(data.lastCompletionDate, today) : null;
  const currentStreak = gap === 1 ? data.currentStreak + 1 : 1; // consecutive day vs reset
  const longestStreak = Math.max(currentStreak, data.longestStreak || 0);
  const updated = { currentStreak, longestStreak, lastCompletionDate: today };

  try { localStorage.setItem(STREAK_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  return updated;
};

/**
 * A streak is only "alive" if the last completion was today or yesterday.
 * Call this on page load to reset display if the user missed a day, without
 * needing to wait for their next completion to find out.
 */
export const getActiveStreak = () => {
  const data = getStreakData();
  if (!data.lastCompletionDate) return 0;
  const gap = daysBetween(data.lastCompletionDate, todayStr());
  return gap <= 1 ? data.currentStreak : 0;
};

export const BADGES = [
  { id: 'first_lesson', emoji: '🌱', name: 'Unang Hakbang',    check: (c) => c.completedCount >= 1 },
  { id: 'five_lessons',  emoji: '📚', name: 'Masipag na Estudyante', check: (c) => c.completedCount >= 5 },
  { id: 'all_lessons',   emoji: '🎓', name: 'Financial Literacy Graduate', check: (c) => c.completedCount >= c.totalLessons },
  { id: 'streak_3',      emoji: '🔥', name: '3-Araw na Streak', check: (c) => c.longestStreak >= 3 },
  { id: 'streak_7',      emoji: '⚡', name: '7-Araw na Streak', check: (c) => c.longestStreak >= 7 },
  { id: 'perfect_score', emoji: '💯', name: 'Perfect Score',    check: (c) => c.hasPerfectScore },
];

/** Returns the subset of BADGES the user has earned given their current stats. */
export const getEarnedBadges = (context) => BADGES.filter(b => b.check(context));
