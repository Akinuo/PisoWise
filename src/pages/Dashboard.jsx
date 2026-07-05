// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import LoadingScreen from '../components/common/LoadingScreen';
import {
  getTransactions, getSavingsGoals, getDebts, getInsights,
} from '../services/firebase';
import { formatPeso, formatPesoCompact, calculateHealthScore, getHealthScoreInfo, formatDate } from '../utils/formatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import {
  HiArrowTrendingUp, HiArrowTrendingDown, HiBanknotes,
  HiShieldCheck, HiSparkles, HiCreditCard, HiChevronRight,
  HiArrowsRightLeft, HiAcademicCap, HiChartBar,
} from 'react-icons/hi2';
import CategoryIcon from '../components/common/CategoryIcon';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { groupByDay } from '../utils/formatters';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4,0,0.2,1] } },
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const {
    transactions, setTransactions, transactionsLoaded,
    savings, setSavings, savingsLoaded,
    debts, setDebts, debtsLoaded,
    insights, setInsights,
    getMonthlyStats, getTotalSavings, getTotalDebt,
  } = useStore((s) => ({
    transactions: s.transactions, setTransactions: s.setTransactions, transactionsLoaded: s.transactionsLoaded,
    savings: s.savings, setSavings: s.setSavings, savingsLoaded: s.savingsLoaded,
    debts: s.debts, setDebts: s.setDebts, debtsLoaded: s.debtsLoaded,
    insights: s.insights, setInsights: s.setInsights,
    getMonthlyStats: s.getMonthlyStats, getTotalSavings: s.getTotalSavings, getTotalDebt: s.getTotalDebt,
  }), shallow);

  const [loading, setLoading] = useState(!transactionsLoaded);

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  // Fetch once per user session — deliberately depends on [user] only. Each
  // fetch is already individually guarded by its own `xLoaded` flag, and
  // Zustand setters are stable, so adding them here would only cause this
  // effect to re-fire (and re-fetch insights, which has no guard) every time
  // one of the loaded flags flips from false to true during this same load.
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // transactions/savings/debts aren't referenced lexically inside these
  // callbacks (getMonthlyStats/getTotalSavings/getTotalDebt read them via
  // Zustand's get() internally), but they must stay as deps — otherwise
  // these values go stale whenever the underlying data changes. Don't remove.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats        = useMemo(() => getMonthlyStats(year, month), [getMonthlyStats, year, month, transactions]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totalSavings = useMemo(() => getTotalSavings(), [getTotalSavings, savings]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const totalDebt    = useMemo(() => getTotalDebt(), [getTotalDebt, debts]);
  const monthlyIncome = profile?.monthlyIncome || stats.income || 0;

  const healthScore = useMemo(() => calculateHealthScore({
    monthlyIncome,
    monthlyExpenses: stats.expenses,
    totalSavings,
    totalDebt,
    savingsGoals: savings,
    debts,
  }), [monthlyIncome, stats.expenses, totalSavings, totalDebt, savings, debts]);
  const scoreInfo = getHealthScoreInfo(healthScore);

  const chartData = useMemo(() => groupByDay(transactions, 7), [transactions]);
  const recentTxs = useMemo(() => transactions.slice(0, 5), [transactions]);
  const balance   = stats.income - stats.expenses;

  const getCatLabel = (id, type) => {
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return cats.find(c => c.id === id) || { id, label: id, color: '#6B7280' };
  };

  const firstName = profile?.displayName?.split(' ')[0] || 'Kaibigan';
  const greeting  = now.getHours() < 12 ? 'Magandang umaga' : now.getHours() < 17 ? 'Magandang hapon' : 'Magandang gabi';
  const monthLabel = now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  if (loading) return <LoadingScreen message="Kinukuha ang iyong datos…" />;

  return (
    <div className="page">
      <div className="page-content">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

          {/* ── Header ── */}
          <motion.div variants={item} className="flex items-start justify-between pt-2">
            <div>
              <p className="text-pw-muted text-xs font-medium uppercase tracking-widest mb-1">{greeting}</p>
              <h1 className="font-display text-3xl text-white leading-none">{firstName}</h1>
            </div>
            <Link to="/profile">
              <motion.div
                whileTap={{ scale: 0.92 }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.08), 0 4px 12px rgba(29,78,216,0.35)',
                }}
              >
                {firstName[0].toUpperCase()}
              </motion.div>
            </Link>
          </motion.div>

          {/* ── Hero Balance Card ── */}
          <motion.div variants={item}>
            <div
              className="relative rounded-3xl p-6 overflow-hidden card-shine"
              style={{
                background: 'linear-gradient(145deg, #1a3fa8 0%, #0D1526 55%, #112060 100%)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 20px 56px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              {/* Ambient glow */}
              <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(245,183,49,0.07) 0%, transparent 70%)' }} />

              {/* Subtle grid lines — luxury card texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, transparent 1px, transparent 28px, rgba(255,255,255,0.5) 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px, transparent 1px, transparent 28px, rgba(255,255,255,0.5) 28px)',
                  backgroundSize: '28px 28px',
                }} />

              <div className="relative">
                {/* Month label */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-blue-200/60 text-[11px] font-medium uppercase tracking-[0.12em]">{monthLabel}</p>
                  <span className="label-blue text-[10px] py-0.5">Balance</span>
                </div>

                {/* Main balance */}
                <div className="mb-5">
                  <p className="text-white/50 text-xs font-medium mb-1">Natitirang Balanse</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white/50 text-2xl font-display">₱</span>
                    <span className="text-white text-5xl font-display leading-none peso-amount">
                      {balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Income / Expense row */}
                <div className="flex gap-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <HiArrowTrendingUp className="w-3.5 h-3.5 text-pw-emerald" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">Kita</p>
                      <p className="text-pw-emerald font-mono font-semibold text-sm peso-amount">{formatPesoCompact(stats.income)}</p>
                    </div>
                  </div>
                  <div className="w-px bg-white/8" />
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.15)' }}>
                      <HiArrowTrendingDown className="w-3.5 h-3.5 text-pw-rose" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-0.5">Gastos</p>
                      <p className="text-pw-rose font-mono font-semibold text-sm peso-amount">{formatPesoCompact(stats.expenses)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── 7-Day Chart ── */}
          {chartData.some(d => d.income > 0 || d.expense > 0) && (
            <motion.div variants={item}>
              <div className="glass p-4">
                <p className="section-title mb-3">7-Araw na Gastos</p>
                <ResponsiveContainer width="100%" height={72}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F43F5E" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(8,14,31,0.96)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontSize: '11px' }}
                      formatter={(v, n) => [formatPeso(v), n === 'expense' ? 'Gastos' : 'Kita']}
                    />
                    <Area type="monotone" dataKey="income"  stroke="#10B981" fill="url(#incGrad)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="expense" stroke="#F43F5E" fill="url(#expGrad)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ── Health Score + Savings Stats ── */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            <Link to="/insights">
              <motion.div whileTap={{ scale: 0.97 }} className="glass p-4 flex flex-col items-center gap-3 h-full cursor-pointer hover:border-pw-gold/20 transition-colors">
                <div className="w-14 h-14">
                  <CircularProgressbar
                    value={healthScore}
                    text={`${healthScore}`}
                    styles={buildStyles({
                      textSize:       '26px',
                      textColor:      scoreInfo.color,
                      pathColor:      scoreInfo.color,
                      trailColor:     'rgba(255,255,255,0.06)',
                      pathTransitionDuration: 1.2,
                    })}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-pw-muted font-medium uppercase tracking-wide">Financial Health</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: scoreInfo.color }}>{scoreInfo.label}</p>
                </div>
              </motion.div>
            </Link>

            <Link to="/savings">
              <motion.div whileTap={{ scale: 0.97 }} className="glass p-4 flex flex-col justify-between h-full cursor-pointer hover:border-pw-emerald/20 transition-colors">
                <div className="icon-box" style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <HiBanknotes className="w-4.5 h-4.5 text-pw-emerald" style={{ width: 18, height: 18 }} />
                </div>
                <div className="mt-3">
                  <p className="section-title mb-1">Kabuuang Ipon</p>
                  <p className="text-white font-semibold text-lg peso-amount">{formatPesoCompact(totalSavings)}</p>
                  <p className="text-pw-muted text-xs mt-0.5">{savings.length} {savings.length === 1 ? 'goal' : 'goals'}</p>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div variants={item}>
            <p className="section-title">Mabilis na Aksyon</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { to: '/transactions?tab=expense', icon: HiArrowTrendingDown, label: 'Idagdag Gastos',     color: '#F43F5E', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.16)' },
                { to: '/transactions?tab=income',  icon: HiArrowTrendingUp,   label: 'Idagdag Kita',      color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.16)' },
                { to: '/budget',                   icon: HiSparkles,          label: 'AI Budget',         color: '#F5B731', bg: 'rgba(245,183,49,0.10)', border: 'rgba(245,183,49,0.16)' },
                { to: '/debts',                    icon: HiShieldCheck,       label: 'Pamamahala ng Utang', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.16)' },
              ].map(({ to, icon: Icon, label, color, bg, border }) => (
                <Link key={to} to={to}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <div className="icon-box-sm flex-shrink-0" style={{ background: `${color}1A` }}>
                      <Icon style={{ width: 16, height: 16, color }} />
                    </div>
                    <p className="text-white text-sm font-medium leading-tight">{label}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ── AI Insight Preview ── */}
          {insights.length > 0 && (
            <motion.div variants={item}>
              <Link to="/insights">
                <motion.div whileTap={{ scale: 0.98 }} className="glass-gold p-4 cursor-pointer">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(245,183,49,0.2)' }}>
                        <HiSparkles className="w-3 h-3 text-pw-gold" />
                      </div>
                      <p className="text-xs font-semibold text-pw-gold uppercase tracking-wider">AI Insight</p>
                    </div>
                    <HiChevronRight className="w-4 h-4 text-pw-gold/50" />
                  </div>
                  <p className="text-white/80 text-sm line-clamp-3 leading-relaxed">
                    {insights[0]?.content?.slice(0, 140)}…
                  </p>
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* ── Recent Transactions ── */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <p className="section-title mb-0">Mga Kamakailang Transaksyon</p>
              <Link to="/transactions" className="text-xs text-pw-blue-light hover:underline font-medium">Lahat →</Link>
            </div>

            {recentTxs.length === 0 ? (
              <div className="glass p-8 text-center">
                <div className="icon-box mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.05)', width: 48, height: 48, borderRadius: 16 }}>
                  <HiArrowsRightLeft className="w-5 h-5 text-pw-muted" style={{ width: 20, height: 20 }} />
                </div>
                <p className="text-white/70 font-medium text-sm mb-1">Walang transaksyon pa</p>
                <Link to="/transactions" className="text-pw-gold text-xs hover:underline">Mag-dagdag ngayon →</Link>
              </div>
            ) : (
              <div className="glass overflow-hidden">
                {recentTxs.map((tx, i) => {
                  const cat = getCatLabel(tx.category, tx.type);
                  return (
                    <div key={tx.id}
                      className={`flex items-center gap-3 px-4 py-3.5 ${i < recentTxs.length - 1 ? 'border-b border-white/[0.045]' : ''}`}>
                      <div
                        className="icon-box-sm flex-shrink-0 flex items-center justify-center"
                        style={{ background: `${cat.color}1e` }}
                      >
                        <CategoryIcon id={tx.category} color={cat.color} size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{tx.description || cat.label}</p>
                        <p className="text-pw-muted text-xs mt-0.5">{formatDate(tx.date, 'relative')}</p>
                      </div>
                      <p className={`font-semibold text-sm peso-amount flex-shrink-0 ${tx.type === 'income' ? 'text-pw-emerald' : 'text-pw-rose'}`}>
                        {tx.type === 'income' ? '+' : '−'}{formatPeso(tx.amount, 0)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ── Quick links footer ── */}
          <motion.div variants={item} className="grid grid-cols-3 gap-2.5 pb-4">
            {[
              { to: '/cards',    icon: HiCreditCard,  label: 'Mga Card' },
              { to: '/lessons',  icon: HiAcademicCap, label: 'Aralin' },
              { to: '/insights', icon: HiChartBar,    label: 'AI Insights' },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="glass-sm p-3.5 flex flex-col items-center gap-2 hover:border-white/12 transition-all cursor-pointer"
                >
                  <Icon className="w-4.5 h-4.5 text-pw-muted" style={{ width: 18, height: 18 }} />
                  <p className="text-[11px] text-pw-muted text-center font-medium">{label}</p>
                </motion.div>
              </Link>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
