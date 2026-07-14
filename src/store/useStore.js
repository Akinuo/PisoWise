// src/store/useStore.js
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ── Transactions ─────────────────────────────────────────────────────
  transactions: [],
  transactionsLoaded: false,
  setTransactions: (transactions) => set({ transactions, transactionsLoaded: true }),
  addTransactionLocal: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
  updateTransactionLocal: (id, data) =>
    set((s) => ({ transactions: s.transactions.map(t => t.id === id ? { ...t, ...data } : t) })),
  removeTransactionLocal: (id) =>
    set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) })),

  // ── Savings Goals ────────────────────────────────────────────────────
  savings: [],
  savingsLoaded: false,
  setSavings: (savings) => set({ savings, savingsLoaded: true }),
  addSavingLocal: (goal) => set((s) => ({ savings: [goal, ...s.savings] })),
  updateSavingLocal: (id, data) =>
    set((s) => ({ savings: s.savings.map(g => g.id === id ? { ...g, ...data } : g) })),
  removeSavingLocal: (id) =>
    set((s) => ({ savings: s.savings.filter(g => g.id !== id) })),

  // ── Debts ────────────────────────────────────────────────────────────
  debts: [],
  debtsLoaded: false,
  setDebts: (debts) => set({ debts, debtsLoaded: true }),
  addDebtLocal: (debt) => set((s) => ({ debts: [debt, ...s.debts] })),
  updateDebtLocal: (id, data) =>
    set((s) => ({ debts: s.debts.map(d => d.id === id ? { ...d, ...data } : d) })),
  removeDebtLocal: (id) =>
    set((s) => ({ debts: s.debts.filter(d => d.id !== id) })),

  // ── Language (UI translation) ──────────────────────────────────────────
  language: (() => {
    try { return localStorage.getItem('pw_language') || 'fil'; } catch { return 'fil'; }
  })(),
  setLanguage: (language) => {
    try { localStorage.setItem('pw_language', language); } catch { /* ignore */ }
    set({ language });
  },

  // ── Cards ────────────────────────────────────────────────────────────
  cards: [],
  cardsLoaded: false,
  setCards: (cards) => set({ cards, cardsLoaded: true }),
  addCardLocal: (card) => set((s) => ({ cards: [...s.cards, card] })),
  updateCardLocal: (id, data) =>
    set((s) => ({ cards: s.cards.map(c => c.id === id ? { ...c, ...data } : c) })),
  removeCardLocal: (id) =>
    set((s) => ({ cards: s.cards.filter(c => c.id !== id) })),

  // ── Recurring Transactions (bills/income that repeat) ─────────────────
  recurringTransactions: [],
  recurringTransactionsLoaded: false,
  setRecurringTransactions: (recurringTransactions) => set({ recurringTransactions, recurringTransactionsLoaded: true }),
  addRecurringLocal: (r) => set((s) => ({ recurringTransactions: [...s.recurringTransactions, r] })),
  updateRecurringLocal: (id, data) =>
    set((s) => ({ recurringTransactions: s.recurringTransactions.map(r => r.id === id ? { ...r, ...data } : r) })),
  removeRecurringLocal: (id) =>
    set((s) => ({ recurringTransactions: s.recurringTransactions.filter(r => r.id !== id) })),

  // ── Reports (much larger transaction history than the ~60 cached above,
  // kept separate so it doesn't bloat every other page's dataset) ────────
  reportsTransactions: [],
  reportsLoaded: false,
  netWorthHistory: [],
  netWorthHistoryLoaded: false,
  setReportsData: (reportsTransactions, netWorthHistory) =>
    set({ reportsTransactions, reportsLoaded: true, netWorthHistory, netWorthHistoryLoaded: true }),

  // ── Insights ─────────────────────────────────────────────────────────
  insights: [],
  insightsLoaded: false,
  setInsights: (insights) => set({ insights, insightsLoaded: true }),
  addInsightLocal: (insight) => set((s) => ({ insights: [insight, ...s.insights] })),

  // ── AI Chat ──────────────────────────────────────────────────────────
  chatHistory: [],
  addChatMessage: (message) =>
    set((s) => ({ chatHistory: [...s.chatHistory.slice(-20), message] })), // Keep last 20
  clearChatHistory: () => set({ chatHistory: [] }),

  // ── Active Budget ─────────────────────────────────────────────────────
  activeBudget: null,
  setActiveBudget: (budget) => set({ activeBudget: budget }),

  // ── UI State ─────────────────────────────────────────────────────────
  isAILoading: false,
  setAILoading: (v) => set({ isAILoading: v }),

  // ── Computed: financial summary ───────────────────────────────────────
  getMonthlyStats: (year, month) => {
    const { transactions } = get();
    const monthTxs = transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
    const income   = monthTxs.filter(t => t.type === 'income')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const expenses = monthTxs.filter(t => t.type === 'expense')
      .reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expenses, net: income - expenses, transactions: monthTxs };
  },

  getTotalSavings: () => {
    return get().savings.reduce((s, g) => s + (g.currentAmount || 0), 0);
  },

  getTotalDebt: () => {
    return get().debts.reduce((s, d) => s + (d.remainingAmount || 0), 0);
  },

  // ── Reset (on logout) ─────────────────────────────────────────────────
  reset: () => set({
    transactions:       [],
    transactionsLoaded: false,
    savings:            [],
    savingsLoaded:      false,
    debts:              [],
    debtsLoaded:        false,
    cards:              [],
    cardsLoaded:        false,
    recurringTransactions:       [],
    recurringTransactionsLoaded: false,
    reportsTransactions:      [],
    reportsLoaded:            false,
    netWorthHistory:          [],
    netWorthHistoryLoaded:    false,
    insights:           [],
    insightsLoaded:     false,
    chatHistory:        [],
    activeBudget:       null,
    isAILoading:        false,
  }),
}));

export default useStore;
