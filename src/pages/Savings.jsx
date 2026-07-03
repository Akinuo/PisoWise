// src/pages/Savings.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { addSavingsGoal, getSavingsGoals, updateSavingsGoal, deleteSavingsGoal, getTransactions } from '../services/firebase';
import { generateSavingsStrategy } from '../services/groq';
import { formatPeso, formatDate, getPercent, parsePesoInput } from '../utils/formatters';
import { Timestamp } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  HiPlus, HiXMark, HiTrash, HiSparkles,
  HiBanknotes, HiPencil, HiArrowPath,
} from 'react-icons/hi2';

const GOAL_COLORS = [
  { id: 'blue',    bg: 'linear-gradient(135deg,#1B4FD8,#3B82F6)', label: 'Blue' },
  { id: 'gold',    bg: 'linear-gradient(135deg,#92400E,#F59E0B)', label: 'Gold' },
  { id: 'green',   bg: 'linear-gradient(135deg,#064E3B,#10B981)', label: 'Green' },
  { id: 'rose',    bg: 'linear-gradient(135deg,#881337,#F43F5E)', label: 'Rose' },
  { id: 'purple',  bg: 'linear-gradient(135deg,#3B0764,#8B5CF6)', label: 'Purple' },
  { id: 'teal',    bg: 'linear-gradient(135deg,#134E4A,#06B6D4)', label: 'Teal' },
];

export default function Savings() {
  const { user, profile } = useAuth();
  const { savings, setSavings, savingsLoaded, addSavingLocal, updateSavingLocal, removeSavingLocal,
          transactions, setTransactions, transactionsLoaded } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editGoal,  setEditGoal]  = useState(null);
  const [aiGoal,    setAiGoal]    = useState(null);
  const [aiResult,  setAiResult]  = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('blue');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (!savingsLoaded)      setSavings(await getSavingsGoals(user.uid));
      if (!transactionsLoaded) setTransactions(await getTransactions(user.uid, 60));
    };
    load().catch(console.error);
  }, [user]);

  const totalSavings = savings.reduce((s, g) => s + (g.currentAmount || 0), 0);

  const monthlyIncome   = profile?.monthlyIncome || 0;
  const monthlyExpenses = transactions
    .filter(t => { const d = t.date?.toDate ? t.date.toDate() : new Date(t.date); const n = new Date();
      return t.type === 'expense' && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })
    .reduce((s, t) => s + t.amount, 0);

  // Open modal
  const openModal = (goal = null) => {
    setEditGoal(goal);
    if (goal) {
      setValue('goalName',     goal.goalName);
      setValue('targetAmount', String(goal.targetAmount));
      setValue('currentAmount', String(goal.currentAmount));
      setValue('deadline',     goal.deadline || '');
      setValue('note',         goal.note || '');
      setSelectedColor(goal.colorScheme || 'blue');
    } else {
      reset(); setSelectedColor('blue');
    }
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    if (!user) return;
    const target  = parsePesoInput(data.targetAmount);
    const current = parsePesoInput(data.currentAmount || '0');
    if (target <= 0) { toast.error('Maglagay ng target na halaga.'); return; }

    try {
      const payload = {
        goalName:     data.goalName.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline:     data.deadline || null,
        note:         data.note?.trim() || '',
        colorScheme:  selectedColor,
      };

      if (editGoal) {
        await updateSavingsGoal(editGoal.id, payload);
        updateSavingLocal(editGoal.id, payload);
        toast.success('Goal na-update!');
      } else {
        const ref = await addSavingsGoal(user.uid, payload);
        addSavingLocal({ id: ref.id, userId: user.uid, ...payload, createdAt: Timestamp.now() });
        toast.success('Savings goal naidagdag! 🎯');
      }
      setShowModal(false); reset(); setEditGoal(null);
    } catch (e) { toast.error('Hindi na-save. Subukan ulit.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tanggalin ang savings goal na ito?')) return;
    try {
      await deleteSavingsGoal(id);
      removeSavingLocal(id);
      toast.success('Goal natanggal.');
    } catch { toast.error('Hindi natanggal.'); }
  };

  const handleAddFunds = async (goal, amount) => {
    const addAmt = parsePesoInput(amount);
    if (addAmt <= 0) return;
    const newCurrent = Math.min(goal.currentAmount + addAmt, goal.targetAmount);
    try {
      await updateSavingsGoal(goal.id, { currentAmount: newCurrent });
      updateSavingLocal(goal.id, { currentAmount: newCurrent });
      if (newCurrent >= goal.targetAmount) toast.success('🎉 Goal naabot na! Congratulations!');
      else toast.success(`₱${formatPeso(addAmt, 0)} naidagdag sa ${goal.goalName}!`);
    } catch { toast.error('Hindi na-update.'); }
  };

  const generateStrategy = async (goal) => {
    setAiGoal(goal); setAiResult(''); setGenLoading(true);
    try {
      const result = await generateSavingsStrategy({
        goalName:        goal.goalName,
        targetAmount:    goal.targetAmount,
        currentSavings:  goal.currentAmount,
        monthlyIncome,
        monthlyExpenses,
      });
      setAiResult(result);
    } catch (e) { toast.error(e.message); }
    finally { setGenLoading(false); }
  };

  const getColorBg = (id) => GOAL_COLORS.find(c => c.id === id)?.bg || GOAL_COLORS[0].bg;
  const daysLeft   = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Savings Goals</h1>
              <p className="text-pw-muted text-sm mt-0.5">
                Kabuuang Ipon: <span className="text-pw-emerald font-bold">{formatPeso(totalSavings, 0)}</span>
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openModal()}
              className="btn-primary py-2.5 px-4">
              <HiPlus className="w-4 h-4" /> Dagdag
            </motion.button>
          </div>

          {/* Goals List */}
          {savings.length === 0 ? (
            <div className="glass p-10 text-center">
              <HiBanknotes className="w-10 h-10 text-pw-muted mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Walang savings goals pa</p>
              <p className="text-pw-muted text-sm mb-4">Mag-set ng goal para magsimulang mag-ipon!</p>
              <button onClick={() => openModal()} className="btn-primary px-6">Gumawa ng Goal</button>
            </div>
          ) : (
            <div className="space-y-3">
              {savings.map((goal, idx) => {
                const pct  = getPercent(goal.currentAmount, goal.targetAmount);
                const days = daysLeft(goal.deadline);
                const done = pct >= 100;
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}>
                    <div className="glass overflow-hidden">
                      {/* Color top bar */}
                      <div className="h-1.5" style={{ background: getColorBg(goal.colorScheme) }} />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-semibold">{goal.goalName}</h3>
                              {done && <span className="label-emerald text-[10px] px-2 py-0.5">✅ Done!</span>}
                            </div>
                            {goal.deadline && (
                              <p className={`text-xs mt-0.5 ${days !== null && days < 30 ? 'text-pw-amber' : 'text-pw-muted'}`}>
                                {days !== null && days > 0 ? `${days} araw na lang` : days === 0 ? 'Ngayon!' : 'Expired'} · {formatDate(goal.deadline, 'short')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openModal(goal)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-pw-muted hover:text-white hover:bg-pw-subtle transition-all">
                              <HiPencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(goal.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-pw-muted hover:text-pw-rose hover:bg-pw-rose-dim transition-all">
                              <HiTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Amounts */}
                        <div className="flex items-baseline justify-between mb-2">
                          <div>
                            <span className="text-white font-bold text-lg peso-amount">{formatPeso(goal.currentAmount, 0)}</span>
                            <span className="text-pw-muted text-sm"> / {formatPeso(goal.targetAmount, 0)}</span>
                          </div>
                          <span className="font-display font-bold text-sm" style={{ color: done ? '#10B981' : '#F7C13A' }}>{pct}%</span>
                        </div>

                        {/* Progress */}
                        <div className="progress-bar mb-4">
                          <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            style={{ background: done ? '#10B981' : getColorBg(goal.colorScheme) }} />
                        </div>

                        {/* Quick add & AI */}
                        {!done && (
                          <div className="flex gap-2">
                            <QuickAddFunds onAdd={(amt) => handleAddFunds(goal, amt)} />
                            <button onClick={() => generateStrategy(goal)}
                              className="btn-secondary py-2 px-3 text-xs gap-1.5 flex-shrink-0">
                              <HiSparkles className="w-3.5 h-3.5 text-pw-gold" /> AI Tips
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* AI Strategy Panel */}
          <AnimatePresence>
            {aiGoal && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass-gold p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HiSparkles className="w-4 h-4 text-pw-gold" />
                      <p className="text-sm font-semibold text-pw-gold">AI Strategy — {aiGoal.goalName}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => generateStrategy(aiGoal)} disabled={genLoading}
                        className="w-7 h-7 rounded-lg bg-pw-gold-dim flex items-center justify-center text-pw-gold hover:bg-pw-gold/20 transition-all">
                        <HiArrowPath className={`w-3.5 h-3.5 ${genLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => { setAiGoal(null); setAiResult(''); }}
                        className="w-7 h-7 rounded-lg bg-pw-gold-dim flex items-center justify-center text-pw-gold hover:bg-pw-gold/20 transition-all">
                        <HiXMark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {genLoading && !aiResult ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-3.5 rounded-lg" />)}
                    </div>
                  ) : (
                    <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{aiResult}</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-6 max-h-[85dvh] overflow-y-auto sheet-modal"
              style={{ background: 'rgba(12,22,40,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
              <h2 className="font-display text-xl font-bold text-white mb-5">
                {editGoal ? 'I-edit ang Goal' : 'Bagong Savings Goal'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Pangalan ng Goal</label>
                  <input type="text" placeholder="hal. Pondo para sa bagong laptop, Emergency Fund..."
                    className="input-glass"
                    {...register('goalName', { required: 'Maglagay ng pangalan ng goal' })} />
                  {errors.goalName && <p className="text-pw-rose text-xs mt-1">{errors.goalName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5">Target na Halaga</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                      <input type="number" placeholder="10000" min="1" className="input-glass pl-7"
                        {...register('targetAmount', { required: 'Maglagay ng target' })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5">Kasalukuyang Ipon</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                      <input type="number" placeholder="0" min="0" className="input-glass pl-7"
                        {...register('currentAmount')} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Target na Petsa (opsyonal)</label>
                  <input type="date" className="input-glass" min={new Date().toISOString().slice(0, 10)}
                    {...register('deadline')} />
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-2">Kulay</label>
                  <div className="flex gap-2">
                    {GOAL_COLORS.map(c => (
                      <button key={c.id} type="button" onClick={() => setSelectedColor(c.id)}
                        className={`w-8 h-8 rounded-xl transition-all ${selectedColor === c.id ? 'ring-2 ring-white/60 scale-110' : ''}`}
                        style={{ background: c.bg }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Note (opsyonal)</label>
                  <textarea rows={2} placeholder="hal. Para sa bakasyon ng pamilya sa Boracay..." className="input-glass resize-none text-sm"
                    {...register('note')} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Kanselahin</button>
                  <button type="submit" className="btn-primary flex-1">
                    {editGoal ? 'I-update' : 'Gumawa ng Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickAddFunds({ onAdd }) {
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);
  return show ? (
    <div className="flex gap-1.5 flex-1">
      <div className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pw-gold text-xs font-bold">₱</span>
        <input type="number" value={val} onChange={e => setVal(e.target.value)}
          placeholder="Halaga" min="0" className="input-glass py-1.5 pl-6 text-sm" inputMode="numeric" autoFocus />
      </div>
      <button onClick={() => { onAdd(val); setVal(''); setShow(false); }}
        className="btn-primary py-1.5 px-3 text-xs">OK</button>
      <button onClick={() => setShow(false)}
        className="w-8 rounded-xl bg-pw-subtle flex items-center justify-center text-pw-muted hover:text-white">
        <HiXMark className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : (
    <button onClick={() => setShow(true)} className="btn-secondary py-2 px-3 text-xs gap-1.5 flex-1">
      <HiPlus className="w-3.5 h-3.5" /> Mag-ipon
    </button>
  );
}
