// src/pages/Reports.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import { getTransactions, getNetWorthHistory } from '../services/firebase';
import { formatPeso, groupByMonth } from '../utils/formatters';
import { getCategoryLabel } from '../utils/constants';
import LoadingScreen from '../components/common/LoadingScreen';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';
import { HiDocumentChartBar, HiArrowDownTray, HiArrowTrendingUp, HiArrowTrendingDown, HiArrowPath } from 'react-icons/hi2';

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(8,14,31,0.96)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '12px',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
  },
  labelStyle: { color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontSize: '11px' },
};

export default function Reports() {
  const { user } = useAuth();
  const { transactions, netWorthHistory, reportsLoaded, setReportsData } = useStore((s) => ({
    transactions: s.reportsTransactions,
    netWorthHistory: s.netWorthHistory,
    reportsLoaded: s.reportsLoaded,
    setReportsData: s.setReportsData,
  }), shallow);
  const [loading, setLoading] = useState(!reportsLoaded);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState('monthly'); // 'monthly' (6mo) | 'yearly' (12mo)

  // Reports needs a much larger, independent transaction history than the
  // ~60 the rest of the app caches for other pages, so it's kept in its own
  // store slice and fetched at most once per session — repeat visits reuse
  // the cache instead of re-reading up to 3000 docs from Firestore each
  // time (meaningful on Spark's daily read cap). Use the refresh button
  // below if you've just added something and want the numbers to reflect it.
  const loadReports = useCallback(async (uid) => {
    const [txs, nw] = await Promise.all([
      getTransactions(uid, 3000),
      getNetWorthHistory(uid),
    ]);
    setReportsData(txs, nw.sort((a, b) => a.date.localeCompare(b.date)));
  }, [setReportsData]);

  useEffect(() => {
    if (!user || reportsLoaded) { setLoading(false); return; }
    loadReports(user.uid).catch(e => console.error('Reports load error:', e)).finally(() => setLoading(false));
  }, [user, reportsLoaded, loadReports]);

  const handleRefresh = async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      await loadReports(user.uid);
    } catch (e) {
      console.error('Reports refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const months = range === 'yearly' ? 12 : 6;
  const trendData = useMemo(() => groupByMonth(transactions, months), [transactions, months]);

  const totals = useMemo(() => {
    const income   = trendData.reduce((s, m) => s + m.income, 0);
    const expenses = trendData.reduce((s, m) => s + m.expense, 0);
    const avgMonthlyExpense = trendData.length > 0 ? expenses / trendData.length : 0;
    return { income, expenses, net: income - expenses, avgMonthlyExpense };
  }, [trendData]);


  const topCategories = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const inRange = transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return t.type === 'expense' && d >= cutoff;
    });
    const byCategory = {};
    inRange.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + t.amount; });
    return Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({ label: getCategoryLabel(cat), amount: amt }));
  }, [transactions, months]);

  const netWorthChartData = useMemo(
    () => netWorthHistory.slice(-90).map(s => ({
      date: new Date(s.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      netWorth: s.netWorth,
    })),
    [netWorthHistory]
  );

  const handlePdfExport = async () => {
    if (transactions.length === 0) return;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const inRange = transactions.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return d >= cutoff;
    });
    const { generateMonthlyReportPdf } = await import('../utils/pdfExport');
    generateMonthlyReportPdf({
      monthLabel: range === 'yearly' ? 'Nakaraang 12 Buwan' : 'Nakaraang 6 Buwan',
      transactions: inRange,
      getCatLabel: getCategoryLabel,
    });
  };

  if (loading) return <LoadingScreen message="Kinukuha ang iyong ulat…" />;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="page">
      <div className="page-content">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

          {/* Header */}
          <div className="pt-2 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HiDocumentChartBar className="w-5 h-5 text-pw-gold" />
                <h1 className="font-display text-2xl font-bold text-white">Mga Ulat</h1>
              </div>
              <p className="text-pw-muted text-sm">Pagsusuri ng iyong pinansyal na kalagayan</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleRefresh} disabled={refreshing}
                className="w-9 h-9 rounded-full flex items-center justify-center text-pw-muted hover:text-white transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                aria-label="I-refresh ang datos">
                <HiArrowPath className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={handlePdfExport} disabled={transactions.length === 0}
                className="btn-secondary py-2 px-3 text-xs gap-1.5 disabled:opacity-40">
                <HiArrowDownTray className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* Range toggle */}
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'monthly', label: '6 Buwan' }, { id: 'yearly', label: '12 Buwan' }].map(r => (
              <button key={r.id} onClick={() => setRange(r.id)}
                className={`py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  range === r.id ? 'bg-pw-gold-dim text-pw-gold border border-pw-gold/25' : 'bg-white/[0.03] text-pw-muted border border-white/[0.07]'
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Summary stats */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            <div className="glass p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <HiArrowTrendingUp className="w-3.5 h-3.5 text-pw-emerald" />
                <p className="text-pw-muted text-xs">Kabuuang Kita</p>
              </div>
              <p className="text-white font-bold text-lg peso-amount">{formatPeso(totals.income, 0)}</p>
            </div>
            <div className="glass p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <HiArrowTrendingDown className="w-3.5 h-3.5 text-pw-rose" />
                <p className="text-pw-muted text-xs">Kabuuang Gastos</p>
              </div>
              <p className="text-white font-bold text-lg peso-amount">{formatPeso(totals.expenses, 0)}</p>
            </div>
            <div className="glass p-4">
              <p className="text-pw-muted text-xs mb-1">Netong Balanse</p>
              <p className={`font-bold text-lg peso-amount ${totals.net >= 0 ? 'text-pw-emerald' : 'text-pw-rose'}`}>
                {totals.net >= 0 ? '+' : '−'}{formatPeso(Math.abs(totals.net), 0)}
              </p>
            </div>
            <div className="glass p-4">
              <p className="text-pw-muted text-xs mb-1">Avg. Buwanang Gastos</p>
              <p className="text-white font-bold text-lg peso-amount">{formatPeso(totals.avgMonthlyExpense, 0)}</p>
            </div>
          </motion.div>

          {/* Income vs Expense trend */}
          <motion.div variants={item}>
            <div className="glass p-4">
              <p className="section-title mb-3">Kita vs Gastos ({range === 'yearly' ? '12' : '6'} Buwan)</p>
              {trendData.some(d => d.income > 0 || d.expense > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="repIncGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="repExpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip {...tooltipStyle} formatter={(v, n) => [formatPeso(v), n === 'expense' ? 'Gastos' : 'Kita']} />
                    <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#repIncGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expense" stroke="#F43F5E" fill="url(#repExpGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-pw-muted text-sm text-center py-8">Wala pang sapat na datos para sa chart na ito.</p>
              )}
            </div>
          </motion.div>

          {/* Net worth trend */}
          {netWorthChartData.length >= 2 && (
            <motion.div variants={item}>
              <div className="glass p-4">
                <p className="section-title mb-3">Net Worth Trend</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={netWorthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [formatPeso(v), 'Net Worth']} />
                    <Line type="monotone" dataKey="netWorth" stroke="#F5B731" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
          {netWorthChartData.length < 2 && (
            <motion.div variants={item}>
              <div className="glass-sm p-4 text-center">
                <p className="text-pw-muted text-xs leading-relaxed">
                  Magsisimulang mag-track ang Net Worth Trend habang gumagamit ka ng app araw-araw — bumalik pagkatapos ng ilang araw.
                </p>
              </div>
            </motion.div>
          )}

          {/* Top categories */}
          {topCategories.length > 0 && (
            <motion.div variants={item}>
              <div className="glass p-4">
                <p className="section-title mb-3">Pinakamalaking Gastos na Kategorya</p>
                <div className="space-y-2.5">
                  {topCategories.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">{c.label}</span>
                      <span className="text-white font-semibold text-sm peso-amount">{formatPeso(c.amount, 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
