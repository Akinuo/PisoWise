// src/utils/spendingTrends.js
//
// Deterministic, client-side spending analysis — no Groq API call needed.
// Runs instantly on already-loaded transaction data, so it costs nothing
// and works even if the AI insight hasn't been generated yet.

import { EXPENSE_CATEGORIES } from './constants';

const toDate = (t) => t.date?.toDate ? t.date.toDate() : new Date(t.date);

const sumByCategory = (transactions) => {
  const map = {};
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return map;
};

const getCatLabel = (id) => EXPENSE_CATEGORIES.find(c => c.id === id)?.label || id;

/**
 * Compares this calendar month's spending per category against last month's.
 * Only returns changes that are both meaningfully large in percentage (>=25%)
 * AND meaningfully large in absolute pesos (>=₱200) — filters out noise like
 * "₱20 more on Load this month" which isn't actually informative.
 */
export const detectCategoryTrends = (transactions) => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = thisMonthStart;

  const thisMonthTxs = transactions.filter(t => toDate(t) >= thisMonthStart);
  const lastMonthTxs = transactions.filter(t => { const d = toDate(t); return d >= lastMonthStart && d < lastMonthEnd; });

  const thisMonthByCategory = sumByCategory(thisMonthTxs);
  const lastMonthByCategory = sumByCategory(lastMonthTxs);

  const allCategories = new Set([...Object.keys(thisMonthByCategory), ...Object.keys(lastMonthByCategory)]);
  const trends = [];

  allCategories.forEach(cat => {
    const current  = thisMonthByCategory[cat] || 0;
    const previous = lastMonthByCategory[cat] || 0;
    const diff = current - previous;
    if (Math.abs(diff) < 200) return; // too small to matter

    // If there was no spending last month, treat any new spending as a
    // 100% "new category" trend rather than a divide-by-zero infinity.
    const percentChange = previous > 0 ? Math.round((diff / previous) * 100) : 100;
    if (Math.abs(percentChange) < 25) return;

    trends.push({
      category: cat,
      label: getCatLabel(cat),
      current,
      previous,
      diff,
      percentChange,
      direction: diff > 0 ? 'up' : 'down',
    });
  });

  // Biggest absolute swings first — those matter most regardless of direction.
  return trends.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};

/**
 * Rule-based proactive tips — no AI call, just straightforward checks
 * against data already loaded in the app. Each tip has a type used for
 * styling (warning/positive/info) so the UI doesn't have to guess tone.
 */
export const generateProactiveTips = ({ transactions, savings, debts, monthlyIncome }) => {
  const tips = [];
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTxs = transactions.filter(t => toDate(t) >= thisMonthStart);
  const thisMonthExpenses = thisMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const thisMonthIncome   = thisMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  // Biggest expense category this month
  const byCategory = sumByCategory(thisMonthTxs);
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && thisMonthExpenses > 0) {
    const [topCat, topAmount] = sorted[0];
    const pct = Math.round((topAmount / thisMonthExpenses) * 100);
    if (pct >= 30) {
      tips.push({
        type: 'info',
        icon: '📊',
        message: `Ang pinakamalaking gastos mo ngayong buwan ay sa ${getCatLabel(topCat)} — ${pct}% ng iyong kabuuang gastos.`,
      });
    }
  }

  // Category trend tips (reuse detectCategoryTrends, cap to top 2 to avoid noise)
  const trends = detectCategoryTrends(transactions).slice(0, 2);
  trends.forEach(t => {
    if (t.direction === 'up') {
      tips.push({
        type: 'warning',
        icon: '⚠️',
        message: `Tumaas ng ${Math.abs(t.percentChange)}% ang gastos mo sa ${t.label} kumpara noong nakaraang buwan.`,
      });
    } else {
      tips.push({
        type: 'positive',
        icon: '👏',
        message: `Bumaba ng ${Math.abs(t.percentChange)}% ang gastos mo sa ${t.label} — galing!`,
      });
    }
  });

  // No savings goals set
  if (savings.length === 0) {
    tips.push({
      type: 'info',
      icon: '🎯',
      message: 'Wala ka pang savings goal. Magsimula man lang sa maliit — kahit ₱500 kada buwan ay malaking tulong sa hinaharap.',
    });
  }

  // High debt relative to income
  if (monthlyIncome > 0 && debts.length > 0) {
    const totalMinPayments = debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0);
    const debtToIncomeRatio = totalMinPayments / monthlyIncome;
    if (debtToIncomeRatio > 0.4) {
      tips.push({
        type: 'warning',
        icon: '⛓️',
        message: 'Mahigit 40% ng iyong buwanang kita ay napupunta sa bayad ng utang. Subukan tingnan ang Debt Payoff Calculator para makahanap ng mas mabilis na paraan.',
      });
    }
  }

  // Positive: saving more than spending this month
  if (thisMonthIncome > 0 && thisMonthExpenses > 0 && thisMonthIncome > thisMonthExpenses * 1.2) {
    tips.push({
      type: 'positive',
      icon: '💪',
      message: 'Mas malaki ang kita mo kaysa gastos ngayong buwan — magandang oras para magdagdag sa savings goal.',
    });
  }

  return tips;
};
