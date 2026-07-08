// src/utils/netWorth.js
import { addNetWorthSnapshot } from '../services/firebase';

const LAST_SNAPSHOT_KEY = 'pw_last_networth_snapshot';

/**
 * Writes a net worth snapshot for today if one hasn't been written yet
 * (checked via localStorage first, so a Dashboard visit doesn't cost an
 * extra Firestore read just to check — worst case, if localStorage was
 * cleared, we write one extra snapshot for the day, which is harmless).
 */
export const maybeSnapshotNetWorth = async (userId, { totalSavings, totalDebt }) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (localStorage.getItem(LAST_SNAPSHOT_KEY) === today) return;
  } catch { /* localStorage unavailable — fall through and snapshot anyway */ }

  const netWorth = totalSavings - totalDebt;
  try {
    await addNetWorthSnapshot(userId, { date: today, netWorth, totalSavings, totalDebt });
    localStorage.setItem(LAST_SNAPSHOT_KEY, today);
  } catch (e) {
    console.error('Net worth snapshot failed:', e);
  }
};
