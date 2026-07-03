// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import {
  getTransactions, getSavingsGoals, getDebts, getInsights,
} from '../services/firebase';
import { formatPeso, formatPesoCompact, calculateHealthScore, getHealthScoreInfo, getPercent, formatDate } from '../utils/formatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import {
  HiArrowTrendingUp, HiArrowTrendingDown, HiBanknotes,
  HiShieldCheck, HiSparkles, HiCreditCard, HiChevronRight,
  HiArrowsRightLeft, HiAcademicCap, HiChartBar,
} from 'react-icons/hi2';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { groupByDay } from '../utils/formatters';

const container = {
  hidden:  {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const {
    transactions, setTransactions, transactionsLoaded,
    savings, setSavings, savingsLoaded,
    debts, setDebts, debtsLoaded,
    insights, setInsights,
    getMonthlyStats, getTotalSavings, getTotalDebt,
  } = useStore();

  const [loading, setLoading] = useState(!transactionsLoaded);

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  // Load data
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [txs, savs, dbs, ins] = await Promise.all([
          transactionsLoaded ? Promise.resolve(transactions) : getTransactions(user.uid, 60),
          savingsLoaded      ? Promise.resolve(savings)      : getSavingsGoals(user.uid),
          debtsLoaded        ? Promise.resolve(debts)        : getDebts(user.uid),
          getInsights(user.uid, 1),
        ]);
        if (!transactionsLoaded) setTransactions(txs);
        if (!savingsLoaded)      setSavings(savs);
        if (!debtsLoaded)        setDebts(dbs);
        setInsights(ins);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const stats      = getMonthlyStats(year, month);
  const totalSavings = getTotalSavings();
  const totalDebt  = getTotalDebt();

  const monthlyIncome = profile?.monthlyIncome || stats.income || 0;

  const healthScore = calculateHealthScore({
    monthlyIncome:    monthlyIncome,
    monthlyExpenses:  stats.expenses,
    totalSavings,
    totalDebt,
    savingsGoals:     savings,
    debts,
  });
  const scoreInfo = getHealthScoreInfo(healthScore);

  const chartData = groupByDay(transactions, 7);
  const recentTxs = transactions.slice(0, 5);

  const getCatLabel = (id, type) => {
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return cats.find(c => c.id === id) || { label: id, icon: '📦' };
  };

  const firstName = profile?.displayName?.split(' ')[0] || 'Kaibigan';
  const greeting  = now.getHours() < 12 ? 'Magandang umaga' : now.getHours() < 17 ? 'Magandang hapon' : 'Magandang gabi';

  return (
    <div className="page">
      <div className="page-content">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

          {/* ── Header ── */}
          <motion.div variants={item} className="flex items-start justify-between pt-2">
            <div>
              <p className="text-pw-muted text-sm">{greeting},</p>
              <h1 className="font-display text-2xl font-bold text-white">{firstName}! 👋</h1>
            </div>
            <Link to="/profile">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pw-blue to-pw-blue-light flex items-center justify-center text-sm font-bold text-white shadow-blue">
                {firstName[0].toUpperCase()}
              </div>
            </Link>
          </motion.div>

          {/* ── Balance Hero Card ── */}
          <motion.div variants={item}>
            <div
              className="relative rounded-3xl p-5 overflow-hidden card-shine"
              style={{
                background: 'linear-gradient(135deg, #1B4FD8 0%, #0C1628 60%, #1e3a8a 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Background sun rays */}
              <div className="absolute -top-8 -right-8 w-40 h-40 opacity-10 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute inset-0 flex items-start justify-center"
                    style={{ transform: `rotate(${i * 45}deg)` }}>
                    <div className="w-0.5 h-20 bg-pw-gold rounded-full" />
                  </div>
                ))}
                <div className="absolute inset-12 rounded-full bg-pw-gold" />
              </div>

              <div className="relative">
                <p className="text-blue-200 text-xs font-medium mb-1">{now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</p>
                <p className="text-white/70 text-sm mb-0.5">Natitirang Balanse</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-white/60 text-xl font-display font-bold">₱</span>
                  <span className="text-white text-4xl font-display font-black peso-amount">
                    {(stats.income - stats.expenses).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <HiArrowTrendingUp className="w-3 h-3 text-pw-emerald" />
                      <span className="text-xs text-white/60">Kita</span>
                    </div>
                    <p className="text-pw-emerald font-bold font-display text-sm peso-amount">
                      {formatPesoCompact(stats.income)}
                    </p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <HiArrowTrendingDown className="w-3 h-3 text-pw-rose" />
                      <span className="text-xs text-white/60">Gastos</span>
                    </div>
                    <p className="text-pw-rose font-bold font-display text-sm peso-amount">
                      {formatPesoCompact(stats.expenses)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── 7-Day Chart ── */}
          {chartData.some(d => d.income > 0 || d.expense > 0) && (
            <motion.div variants={item}>
              <div className="glass p-4">
                <p className="text-xs text-pw-muted mb-3 font-medium">Gastos nitong 7 Araw</p>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F43F5E" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ background: 'rgba(12,22,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      labelStyle={{ color: '#fff', marginBottom: '4px' }}
                      formatter={(v, n) => [formatPeso(v), n === 'expense' ? 'Gastos' : 'Kita']}
                    />
                    <Area type="monotone" dataKey="income"  stroke="#10B981" fill="url(#incGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="expense" stroke="#F43F5E" fill="url(#expGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ── Health Score + Quick Stats Row ── */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            {/* Health Score */}
            <Link to="/insights" className="glass p-4 flex flex-col items-center gap-2 hover:border-pw-gold/20 transition-colors">
              <div className="w-16 h-16">
                <CircularProgressbar
                  value={healthScore}
                  text={`${healthScore}`}
                  styles={buildStyles({
                    textSize:       '28px',
                    textColor:      scoreInfo.color,
                    pathColor:      scoreInfo.color,
                    trailColor:     'rgba(255,255,255,0.06)',
                    pathTransitionDuration: 1,
                  })}
                />
              </div>
              <p className="text-xs text-pw-muted text-center">Financial Health {scoreInfo.emoji}</p>
              <span className="text-xs font-semibold" style={{ color: scoreInfo.color }}>{scoreInfo.label}</span>
            </Link>

            {/* Savings */}
            <Link to="/savings" className="glass p-4 flex flex-col justify-between hover:border-pw-emerald/20 transition-colors">
              <div className="w-9 h-9 rounded-2xl bg-pw-emerald-dim flex items-center justify-center mb-2">
                <HiBanknotes className="w-4 h-4 text-pw-emerald" />
              </div>
              <div>
                <p className="text-xs text-pw-muted mb-0.5">Kabuuang Ipon</p>
                <p className="text-white font-bold font-display peso-amount">{formatPesoCompact(totalSavings)}</p>
                <p className="text-xs text-pw-muted mt-0.5">{savings.length} goals</p>
              </div>
            </Link>
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div variants={item}>
            <p className="section-title">Mabilis na Aksyon</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: '/transactions?tab=expense', icon: HiArrowTrendingDown, label: 'Idagdag Gastos',  color: '#F43F5E', bg: 'rgba(244,63,94,0.10)' },
                { to: '/transactions?tab=income',  icon: HiArrowTrendingUp,   label: 'Idagdag Kita',   color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
                { to: '/budget',                   icon: HiSparkles,          label: 'AI Budget',      color: '#F7C13A', bg: 'rgba(247,193,58,0.10)' },
                { to: '/debts',                    icon: HiShieldCheck,       label: 'Pamamahala ng Utang', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
              ].map(({ to, icon: Icon, label, color, bg }) => (
                <Link key={to} to={to}>
                  <motion.div whileTap={{ scale: 0.96 }}
                    className="glass p-4 flex items-center gap-3 hover:border-white/15 transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: bg }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <p className="text-sm text-white font-medium leading-tight">{label}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ── AI Insight Preview ── */}
          {insights.length > 0 && (
            <motion.div variants={item}>
              <Link to="/insights">
                <div className="glass-gold p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HiSparkles className="w-4 h-4 text-pw-gold" />
                      <p className="text-xs font-semibold text-pw-gold">AI Insight</p>
                    </div>
                    <HiChevronRight className="w-4 h-4 text-pw-gold/60" />
                  </div>
                  <p className="text-white text-sm line-clamp-3 leading-relaxed">
                    {insights[0]?.content?.slice(0, 140)}...
                  </p>
                </div>
              </Link>
            </motion.div>
          )}

          {/* ── Recent Transactions ── */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <p className="section-title mb-0">Mga Kamakailang Transaksyon</p>
              <Link to="/transactions" className="text-xs text-pw-blue-light hover:underline">Tingnan Lahat</Link>
            </div>

            {recentTxs.length === 0 ? (
              <div className="glass p-8 text-center">
                <HiArrowsRightLeft className="w-8 h-8 text-pw-muted mx-auto mb-2" />
                <p className="text-pw-muted text-sm">Walang transaksyon pa.</p>
                <Link to="/transactions" className="text-pw-gold text-xs mt-1 inline-block">Mag-dagdag ngayon →</Link>
              </div>
            ) : (
              <div className="glass overflow-hidden">
                {recentTxs.map((tx, i) => {
                  const cat = getCatLabel(tx.category, tx.type);
                  return (
                    <div key={tx.id}
                      className={`flex items-center gap-3 p-4 ${i < recentTxs.length - 1 ? 'border-b border-white/5' : ''}`}>
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)' }}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{tx.description || cat.label}</p>
                        <p className="text-pw-muted text-xs mt-0.5">{formatDate(tx.date, 'relative')}</p>
                      </div>
                      <p className={`font-bold text-sm peso-amount flex-shrink-0 ${tx.type === 'income' ? 'text-pw-emerald' : 'text-pw-rose'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatPeso(tx.amount, 0)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ── Bottom quick links ── */}
          <motion.div variants={item} className="grid grid-cols-3 gap-3 pb-4">
            {[
              { to: '/cards',   icon: HiCreditCard,   label: 'Mga Card' },
              { to: '/lessons', icon: HiAcademicCap,  label: 'Aralin' },
              { to: '/insights',icon: HiChartBar,     label: 'AI Insights' },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}>
                <div className="glass-sm p-3 flex flex-col items-center gap-2 hover:border-white/15 transition-all">
                  <Icon className="w-5 h-5 text-pw-muted" />
                  <p className="text-xs text-pw-muted text-center">{label}</p>
                </div>
              </Link>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
