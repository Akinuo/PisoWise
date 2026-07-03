// src/utils/formatters.js
import { HEALTH_SCORE_RANGES } from './constants';

// ─── Currency ─────────────────────────────────────────────────────────────
export const formatPeso = (amount, decimals = 2) => {
  const num = Number(amount) || 0;
  return `₱${num.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatPesoCompact = (amount) => {
  const num = Number(amount) || 0;
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)    return `₱${(num / 1_000).toFixed(1)}K`;
  return `₱${num.toFixed(0)}`;
};

export const parsePesoInput = (str) => {
  // Remove ₱, commas, spaces — return float
  const cleaned = String(str).replace(/[₱,\s]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
};

// ─── Dates ────────────────────────────────────────────────────────────────
export const formatDate = (date, format = 'medium') => {
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d)) return '—';

  if (format === 'short')  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  if (format === 'medium') return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  if (format === 'long')   return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  if (format === 'month')  return d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  if (format === 'time')   return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  if (format === 'relative') return formatRelativeDate(d);
  return d.toLocaleDateString('en-PH');
};

const formatRelativeDate = (date) => {
  const now  = new Date();
  const diff = now - date;
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs  / 60);
  const hrs  = Math.floor(mins  / 60);
  const days = Math.floor(hrs   / 24);

  if (secs  < 60)  return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hrs   < 24)  return `${hrs}h ago`;
  if (days  === 1) return 'yesterday';
  if (days  < 7)   return `${days}d ago`;
  return formatDate(date, 'short');
};

export const toFirestoreTimestamp = (date) => {
  const { Timestamp } = require('firebase/firestore');
  return Timestamp.fromDate(new Date(date));
};

export const nowTimestamp = () => {
  const { Timestamp } = require('firebase/firestore');
  return Timestamp.now();
};

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

// ─── Percentages ──────────────────────────────────────────────────────────
export const formatPercent = (value, total) => {
  if (!total || total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

export const getPercent = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
};

// ─── Financial Health Score ───────────────────────────────────────────────
export const calculateHealthScore = ({ monthlyIncome, monthlyExpenses, totalSavings, totalDebt, savingsGoals = [], debts = [] }) => {
  let score = 0;

  // 1. Savings rate (0-30 pts)
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  if (savingsRate >= 0.20)      score += 30;
  else if (savingsRate >= 0.10) score += 20;
  else if (savingsRate >= 0.05) score += 10;
  else if (savingsRate >= 0)    score += 5;
  // Negative (spending more than earning) = 0 points for this category

  // 2. Emergency fund (0-25 pts)
  const monthsOfExpenses = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;
  if (monthsOfExpenses >= 6) score += 25;
  else if (monthsOfExpenses >= 3) score += 18;
  else if (monthsOfExpenses >= 1) score += 10;
  else if (monthsOfExpenses >= 0.25) score += 5;

  // 3. Debt-to-income ratio (0-25 pts)
  const debtToIncome = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 1;
  if (debtToIncome === 0)       score += 25;
  else if (debtToIncome < 0.1)  score += 22;
  else if (debtToIncome < 0.25) score += 15;
  else if (debtToIncome < 0.5)  score += 8;
  else if (debtToIncome < 1.0)  score += 3;

  // 4. Active savings goals (0-10 pts)
  if (savingsGoals.length >= 3)       score += 10;
  else if (savingsGoals.length >= 1)  score += 6;

  // 5. Expense ratio (0-10 pts)
  const expenseRatio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 1;
  if (expenseRatio <= 0.5)      score += 10;
  else if (expenseRatio <= 0.7) score += 7;
  else if (expenseRatio <= 0.85) score += 4;
  else if (expenseRatio <= 1.0) score += 1;

  return Math.min(100, Math.max(0, score));
};

export const getHealthScoreInfo = (score) => {
  return HEALTH_SCORE_RANGES.find(r => score >= r.min) || HEALTH_SCORE_RANGES[HEALTH_SCORE_RANGES.length - 1];
};

// ─── Chart Data Helpers ────────────────────────────────────────────────────
export const groupByCategory = (transactions, type = 'expense') => {
  const filtered = transactions.filter(t => t.type === type);
  const grouped  = filtered.reduce((acc, t) => {
    const cat = t.category || 'other';
    acc[cat]  = (acc[cat] || 0) + (t.amount || 0);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const groupByDay = (transactions, days = 7) => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toDateString();
    const dayTxs = transactions.filter(t => {
      const txDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return txDate.toDateString() === dayKey;
    });
    result.push({
      date:    d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      income:  dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }
  return result;
};

// ─── String Helpers ───────────────────────────────────────────────────────
export const truncate = (str, len = 20) =>
  str && str.length > len ? str.slice(0, len) + '...' : str;

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export const maskCardNumber = (lastFour) =>
  `•••• •••• •••• ${String(lastFour).padStart(4, '•')}`;

// ─── OFW / Philippine context helpers ────────────────────────────────────
export const getPesoWordAmount = (amount) => {
  // Very simplified — for display purposes
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} milyon`;
  if (amount >= 1_000)    return `${(amount / 1_000).toFixed(1)} libo`;
  return `${amount} piso`;
};
