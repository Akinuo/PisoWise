// src/pages/Budget.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { saveBudget, getBudget, getTransactions } from '../services/firebase';
import { generateBudget } from '../services/groq';
import { formatPeso, parsePesoInput, getCurrentMonthYear, getPercent } from '../utils/formatters';
import { EXPENSE_CATEGORIES, MONTHS_PH } from '../utils/constants';
import {
  HiSparkles, HiCurrencyDollar, HiUsers, HiChevronDown,
  HiChevronUp, HiDocumentText, HiArrowPath,
} from 'react-icons/hi2';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#F7C13A','#3B82F6','#10B981','#F43F5E','#8B5CF6','#F97316','#06B6D4','#EC4899'];

export default function Budget() {
  const { user, profile } = useAuth();
  const { transactions, setTransactions, transactionsLoaded, activeBudget, setActiveBudget } = useStore();

  const { month, year } = getCurrentMonthYear();
  const [income,      setIncome]      = useState(String(profile?.monthlyIncome || ''));
  const [familySize,  setFamilySize]  = useState('4');
  const [goals,       setGoals]       = useState('');
  const [aiResult,    setAiResult]    = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [expanded,    setExpanded]    = useState({});

  // Load transactions and existing budget
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

  // Chart data
  const chartData = Object.entries(expenseSummary).map(([cat, val]) => ({
    name:  EXPENSE_CATEGORIES.find(c => c.id === cat)?.label || cat,
    value: val,
  })).sort((a, b) => b.value - a.value).slice(0, 8);

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
      await saveBudget(user.uid, {
        month, year,
        totalIncome:   incomeNum,
        totalExpenses,
        categories:    expenseSummary,
        aiContent:     aiResult,
        familySize:    Number(familySize),
      });
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
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-1">
              <HiSparkles className="w-5 h-5 text-pw-gold" />
              <h1 className="font-display text-2xl font-bold text-white">AI Budget</h1>
            </div>
            <p className="text-pw-muted text-sm">
              {MONTHS_PH[month - 1]} {year} — Hayaan ang AI na gumawa ng budget para sa inyo
            </p>
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
    </div>
  );
}
