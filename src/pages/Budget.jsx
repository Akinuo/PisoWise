// src/pages/Budget.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import { saveBudget, getBudget, getBudgetHistory, getTransactions } from '../services/firebase';
import { generateBudget } from '../services/groq';
import { formatPeso, parsePesoInput, getCurrentMonthYear, getPercent } from '../utils/formatters';
import { computeCategoryLimits } from '../utils/budgetAlerts';
import { EXPENSE_CATEGORIES, MONTHS_PH } from '../utils/constants';
import {
  HiSparkles, HiUsers, HiDocumentText, HiArrowPath, HiClock,
} from 'react-icons/hi2';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#F7C13A','#3B82F6','#10B981','#F43F5E','#8B5CF6','#F97316','#06B6D4','#EC4899'];

export default function Budget() {
  const { user, profile } = useAuth();
  const { transactions, setTransactions, transactionsLoaded, activeBudget, setActiveBudget } = useStore((s) => ({ transactions: s.transactions, setTransactions: s.setTransactions, transactionsLoaded: s.transactionsLoaded, activeBudget: s.activeBudget, setActiveBudget: s.setActiveBudget, }), shallow);

  const { month, year } = getCurrentMonthYear();
  const [income,      setIncome]      = useState(String(profile?.monthlyIncome || ''));
  const [familySize,  setFamilySize]  = useState('4');
  const [goals,       setGoals]       = useState('');
  const [aiResult,    setAiResult]    = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [history,      setHistory]      = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);

  // Load transactions and existing budget
  // Fetch once per user session — see Dashboard.jsx for why deps stay [user] only.
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (!transactionsLoaded) {
        const txs = await getTransactions(user.uid, 60);
        setTransactions(txs);
      }
      const existing = await getBudget(user.uid, month, year);
      if (existing) { setActiveBudget(existing); setAiResult(existing.aiContent || ''); }
    };
    load().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Build expense summary from transactions this month
  const monthExpenses = transactions.filter(t => {
    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return t.type === 'expense' && d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const expenseSummary = monthExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const totalExpenses = Object.values(expenseSummary).reduce((s, v) => s + v, 0);
  const incomeNum     = parsePesoInput(income);
  const activeCategoryLimits =
    (activeBudget?.month === month && activeBudget?.year === year) ? (activeBudget.categoryLimits || {}) : {};

  // Chart data
  const chartData = Object.entries(expenseSummary).map(([cat, val]) => ({
    name:  EXPENSE_CATEGORIES.find(c => c.id === cat)?.label || cat,
    value: val,
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  const loadHistory = async () => {
    setShowHistory(true);
    if (historyLoaded || !user) return;
    try {
      const all = await getBudgetHistory(user.uid);
      setHistory(all.sort((a, b) => (b.year - a.year) || (b.month - a.month)));
      setHistoryLoaded(true);
    } catch {
      toast.error('Hindi na-load ang kasaysayan.');
    }
  };

  // ── Generate AI Budget ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!incomeNum || incomeNum <= 0) {
      toast.error('Maglagay ng iyong buwanang kita.');
      return;
    }
    setGenerating(true);
    setAiResult('');
    try {
      const result = await generateBudget({
        monthlyIncome: incomeNum,
        expenses:      expenseSummary,
        familySize:    Number(familySize) || 4,
        goals,
      });
      setAiResult(result);
      toast.success('AI Budget nagawa na! 🎉');
    } catch (e) {
      toast.error(e.message || 'Hindi nagawa ang AI Budget. Subukan ulit.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Save Budget ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!aiResult) return;
    setSaving(true);
    try {
      const categoryLimits = computeCategoryLimits(expenseSummary, incomeNum);
      await saveBudget(user.uid, {
        month, year,
        totalIncome:   incomeNum,
        totalExpenses,
        categories:    expenseSummary,
        categoryLimits,
        aiContent:     aiResult,
        familySize:    Number(familySize),
      });
      setActiveBudget({ month, year, totalIncome: incomeNum, totalExpenses, categories: expenseSummary, categoryLimits, aiContent: aiResult });
      setHistoryLoaded(false); // force a refresh next time history is opened
      toast.success('Budget na-save!');
    } catch (e) {
      toast.error('Hindi na-save. Subukan ulit.');
    } finally {
      setSaving(false);
    }
  };

  const renderAIContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />;
      if (line.startsWith('# ')) return (
        <h2 key={i} className="font-display font-bold text-lg text-white mt-4 mb-2">{line.slice(2)}</h2>
      );
      if (line.startsWith('## ')) return (
        <h3 key={i} className="font-display font-semibold text-base text-pw-gold mt-3 mb-1.5">{line.slice(3)}</h3>
      );
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) return (
        <div key={i} className="flex gap-2 my-1">
          <span className="text-pw-gold mt-0.5 flex-shrink-0">•</span>
          <p className="text-white/85 text-sm leading-relaxed">{line.slice(2)}</p>
        </div>
      );
      if (/^\d+\./.test(line)) return (
        <div key={i} className="flex gap-2 my-1">
          <span className="text-pw-blue-light text-sm font-bold flex-shrink-0 w-5">{line.match(/^\d+/)[0]}.</span>
          <p className="text-white/85 text-sm leading-relaxed">{line.replace(/^\d+\.\s*/, '')}</p>
        </div>
      );
      return <p key={i} className="text-white/85 text-sm leading-relaxed my-1">{line}</p>;
    });
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">
          {/* Header */}
          <div className="pt-2 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HiSparkles className="w-5 h-5 text-pw-gold" />
                <h1 className="font-display text-2xl font-bold text-white">AI Budget</h1>
              </div>
              <p className="text-pw-muted text-sm">
                {MONTHS_PH[month - 1]} {year} — Hayaan ang AI na gumawa ng budget para sa inyo
              </p>
            </div>
            <button onClick={loadHistory}
              className="btn-secondary py-2 px-3 text-xs gap-1.5 flex-shrink-0">
              <HiClock className="w-3.5 h-3.5" /> Kasaysayan
            </button>
          </div>

          {/* This month's expense breakdown */}
          {chartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass p-4">
                <p className="text-xs text-pw-muted font-medium mb-3">Gastos Ngayong Buwan</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-display font-bold text-white peso-amount">{formatPeso(totalExpenses, 0)}</p>
                    {incomeNum > 0 && (
                      <p className="text-xs text-pw-muted mt-0.5">
                        {getPercent(totalExpenses, incomeNum)}% ng kita
                        <span className={`ml-2 font-semibold ${totalExpenses > incomeNum ? 'text-pw-rose' : 'text-pw-emerald'}`}>
                          {totalExpenses > incomeNum ? '⚠️ Over budget' : '✅ OK'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      paddingAngle={3} dataKey="value">
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(12,22,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(v) => [formatPeso(v), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  {chartData.slice(0, 6).map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs text-pw-muted truncate">{d.name}</span>
                      <span className="text-xs text-white font-medium ml-auto">{formatPeso(d.value, 0)}</span>
                    </div>
                  ))}
                </div>

                {/* Category limits vs. current spending — only shows once a budget with limits has been saved */}
                {Object.keys(activeCategoryLimits).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/08 space-y-2.5">
                    <p className="text-xs text-pw-muted font-semibold uppercase tracking-wide mb-1">Budget Limits Ngayong Buwan</p>
                    {Object.entries(activeCategoryLimits).map(([cat, limitAmt]) => {
                      const spent = expenseSummary[cat] || 0;
                      const pct = Math.min(100, Math.round((spent / limitAmt) * 100));
                      const isOver = spent > limitAmt;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/80">{EXPENSE_CATEGORIES.find(c => c.id === cat)?.label || cat}</span>
                            <span className={`text-[11px] font-medium ${isOver ? 'text-pw-rose' : 'text-pw-muted'}`}>
                              {formatPeso(spent, 0)} / {formatPeso(limitAmt, 0)}
                            </span>
                          </div>
                          <div className="progress-bar h-1.5">
                            <div className={`progress-fill ${isOver ? 'bg-pw-rose' : pct >= 90 ? 'bg-pw-amber' : 'bg-pw-emerald'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Budget Generator Form */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass p-4 space-y-4">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <HiSparkles className="w-4 h-4 text-pw-gold" /> Gumawa ng AI Budget
              </p>

              <div>
                <label className="block text-xs text-pw-muted mb-1.5">Buwanang Kita</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pw-gold font-bold">₱</span>
                  <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                    placeholder="15000" min="0" className="input-glass pl-8"
                    inputMode="numeric" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-pw-muted mb-1.5">
                  <HiUsers className="inline w-3.5 h-3.5 mr-1" />Bilang ng Miyembro ng Pamilya
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['1','2','3','4','5+'].map(n => (
                    <button key={n} onClick={() => setFamilySize(n === '5+' ? '5' : n)}
                      className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                        familySize === (n === '5+' ? '5' : n)
                          ? 'bg-pw-gold text-pw-navy border-pw-gold'
                          : 'bg-pw-subtle border-white/08 text-pw-muted hover:text-white'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-pw-muted mb-1.5">Mga Layunin (opsyonal)</label>
                <textarea rows={2} value={goals} onChange={e => setGoals(e.target.value)}
                  placeholder="hal. Mag-ipon para sa school ng anak, bumayad ng utang sa bangko..."
                  className="input-glass resize-none text-sm" />
              </div>

              <button onClick={handleGenerate} disabled={generating}
                className="btn-primary w-full">
                {generating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                    Ginagawa ng AI ang budget...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <HiSparkles className="w-4 h-4" />
                    Gumawa ng AI Budget
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* AI Result */}
          <AnimatePresence>
            {(aiResult || generating) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-pw-gold-dim flex items-center justify-center">
                        <HiSparkles className="w-4 h-4 text-pw-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">AI Budget Plan</p>
                        <p className="text-xs text-pw-muted">Llama 3.3 70B · Personalized para sa inyo</p>
                      </div>
                    </div>
                    {aiResult && (
                      <button onClick={handleGenerate} disabled={generating}
                        className="w-8 h-8 rounded-xl bg-pw-subtle flex items-center justify-center text-pw-muted hover:text-white transition-all">
                        <HiArrowPath className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>

                  {generating && !aiResult ? (
                    <div className="space-y-3 py-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className={`shimmer h-4 rounded-lg ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="prose-sm">
                      {renderAIContent(aiResult)}
                    </div>
                  )}

                  {aiResult && (
                    <div className="flex gap-2 mt-5 pt-4 border-t border-white/08">
                      <button onClick={handleSave} disabled={saving}
                        className="btn-secondary flex-1 py-2 text-sm gap-2">
                        <HiDocumentText className="w-4 h-4" />
                        {saving ? 'Nagse-save...' : 'I-save ang Budget'}
                      </button>
                      <button onClick={handleGenerate} disabled={generating}
                        className="btn-secondary py-2 px-4 text-sm gap-2">
                        <HiArrowPath className="w-4 h-4" />
                        Baguhin
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tip */}
          <div className="glass-gold p-4 text-sm text-white/80 leading-relaxed">
            <p className="font-semibold text-pw-gold mb-1">💡 Alam mo ba?</p>
            Ang 50-30-20 rule ay nagsasabi na ang 50% ng kita ay para sa pangangailangan,
            30% para sa kagustuhan, at 20% para sa ipon at pagbabayad ng utang.
          </div>
        </div>
      </div>

      {/* ── Budget History Modal ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowHistory(false)} />
            <motion.div
              initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl px-6 pt-6 max-h-[85dvh] overflow-y-auto sheet-modal"
              style={{ background: 'rgba(12,22,40,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
              <div className="flex items-center gap-2 mb-5">
                <HiClock className="w-5 h-5 text-pw-gold" />
                <h2 className="font-display text-xl font-bold text-white">Kasaysayan ng Budget</h2>
              </div>

              {history.length === 0 ? (
                <p className="text-pw-muted text-sm text-center py-8">Wala pang naitalang budget sa nakaraan.</p>
              ) : (
                <div className="space-y-2.5 pb-2">
                  {history.map(b => {
                    const over = b.totalIncome > 0 && b.totalExpenses > b.totalIncome;
                    return (
                      <div key={b.id} className="glass-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white text-sm font-semibold">{MONTHS_PH[b.month - 1]} {b.year}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${over ? 'bg-pw-rose-dim text-pw-rose' : 'bg-pw-emerald-dim text-pw-emerald'}`}>
                            {over ? 'Over Budget' : 'Nasa Budget'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-pw-muted">Kita</p>
                            <p className="text-white font-semibold">{formatPeso(b.totalIncome, 0)}</p>
                          </div>
                          <div>
                            <p className="text-pw-muted">Gastos</p>
                            <p className="text-white font-semibold">{formatPeso(b.totalExpenses, 0)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={() => setShowHistory(false)} className="btn-secondary w-full mt-4 mb-2">
                Isara
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
