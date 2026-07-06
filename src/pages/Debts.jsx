// src/pages/Debts.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import { addDebt, getDebts, updateDebt, deleteDebt, getTransactions } from '../services/firebase';
import { generateDebtPlan } from '../services/groq';
import { formatPeso, parsePesoInput, getPercent } from '../utils/formatters';
import { comparePayoffStrategies } from '../utils/payoffCalculator';
import { Timestamp } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  HiPlus, HiXMark, HiTrash, HiSparkles,
  HiShieldCheck, HiPencil, HiArrowPath,
  HiExclamationTriangle, HiCheckCircle, HiCalculator, HiTrophy,
} from 'react-icons/hi2';

const DEBT_TYPES = [
  { id: 'bank_loan',    label: 'Bank Loan',        icon: '🏦', color: '#3B82F6' },
  { id: 'credit_card',  label: 'Credit Card',      icon: '💳', color: '#F43F5E' },
  { id: 'pag_ibig',     label: 'Pag-IBIG Loan',    icon: '🏛️', color: '#10B981' },
  { id: 'sss',          label: 'SSS Loan',          icon: '🏛️', color: '#8B5CF6' },
  { id: 'personal',     label: 'Personal Loan',     icon: '👤', color: '#F59E0B' },
  { id: 'five_six',     label: '5-6 / Bombay',      icon: '⚠️', color: '#EF4444' },
  { id: 'family',       label: 'Family/Friends',    icon: '👨‍👩‍👧', color: '#06B6D4' },
  { id: 'cooperative',  label: 'Cooperative',       icon: '🤝', color: '#84CC16' },
  { id: 'informal',     label: 'Informal Lender',   icon: '💸', color: '#F97316' },
  { id: 'other',        label: 'Iba pa',            icon: '📋', color: '#6B7280' },
];

export default function Debts() {
  const { user, profile } = useAuth();
  const { debts, setDebts, debtsLoaded, addDebtLocal, updateDebtLocal, removeDebtLocal, transactions, setTransactions, transactionsLoaded } = useStore((s) => ({ debts: s.debts, setDebts: s.setDebts, debtsLoaded: s.debtsLoaded, addDebtLocal: s.addDebtLocal, updateDebtLocal: s.updateDebtLocal, removeDebtLocal: s.removeDebtLocal, transactions: s.transactions, setTransactions: s.setTransactions, transactionsLoaded: s.transactionsLoaded, }), shallow);

  const [showModal,   setShowModal]   = useState(false);
  const [editDebt,    setEditDebt]    = useState(null);
  const [aiResult,    setAiResult]    = useState('');
  const [genLoading,  setGenLoading]  = useState(false);
  const [showAI,      setShowAI]      = useState(false);
  const [showCalc,      setShowCalc]      = useState(false);
  const [extraPayment,  setExtraPayment]  = useState('1000');
  const [strategy,       setStrategy]      = useState('avalanche');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch once per user session — see Dashboard.jsx for why deps stay [user] only.
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (!debtsLoaded)        setDebts(await getDebts(user.uid));
      if (!transactionsLoaded) setTransactions(await getTransactions(user.uid, 60));
    };
    load().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const totalDebt = debts.reduce((s, d) => s + (d.remainingAmount || 0), 0);
  const monthlyIncome   = profile?.monthlyIncome || 0;
  const monthlyExpenses = transactions
    .filter(t => { const d = t.date?.toDate ? t.date.toDate() : new Date(t.date); const n = new Date();
      return t.type === 'expense' && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); })
    .reduce((s, t) => s + t.amount, 0);

  const openModal = (debt = null) => {
    setEditDebt(debt);
    if (debt) {
      setValue('creditorName',    debt.creditorName);
      setValue('debtType',        debt.debtType);
      setValue('originalAmount',  String(debt.originalAmount));
      setValue('remainingAmount', String(debt.remainingAmount));
      setValue('interestRate',    String(debt.interestRate || ''));
      setValue('monthlyPayment',  String(debt.monthlyPayment || ''));
      setValue('dueDate',         debt.dueDate || '');
      setValue('note',            debt.note || '');
    } else { reset(); }
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        creditorName:   data.creditorName.trim(),
        debtType:       data.debtType,
        originalAmount: parsePesoInput(data.originalAmount),
        remainingAmount: parsePesoInput(data.remainingAmount),
        interestRate:   parseFloat(data.interestRate) || 0,
        monthlyPayment: parsePesoInput(data.monthlyPayment || '0'),
        dueDate:        data.dueDate || null,
        note:           data.note?.trim() || '',
      };
      if (payload.originalAmount <= 0) { toast.error('Maglagay ng tamang halaga.'); return; }

      if (editDebt) {
        await updateDebt(editDebt.id, payload);
        updateDebtLocal(editDebt.id, payload);
        toast.success('Utang na-update!');
      } else {
        const ref = await addDebt(user.uid, payload);
        addDebtLocal({ id: ref.id, userId: user.uid, ...payload, createdAt: Timestamp.now() });
        toast.success('Utang naitala.');
      }
      setShowModal(false); reset(); setEditDebt(null);
    } catch { toast.error('Hindi na-save. Subukan ulit.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tanggalin ang utang na ito?')) return;
    try { await deleteDebt(id); removeDebtLocal(id); toast.success('Natanggal.'); }
    catch { toast.error('Hindi natanggal.'); }
  };

  const handlePayment = async (debt, amount) => {
    const payAmt = parsePesoInput(amount);
    if (payAmt <= 0) return;
    const newRemaining = Math.max(0, debt.remainingAmount - payAmt);
    try {
      await updateDebt(debt.id, { remainingAmount: newRemaining });
      updateDebtLocal(debt.id, { remainingAmount: newRemaining });
      if (newRemaining === 0) toast.success(`🎉 Bayad na ang utang sa ${debt.creditorName}!`);
      else toast.success(`Bayad na ang ${formatPeso(payAmt, 0)}!`);
    } catch { toast.error('Hindi na-update.'); }
  };

  const generatePlan = async () => {
    if (debts.length === 0) { toast.error('Walang utang na naitala.'); return; }
    setShowAI(true); setAiResult(''); setGenLoading(true);
    try {
      const result = await generateDebtPlan({ debts, monthlyIncome, monthlyExpenses });
      setAiResult(result);
    } catch (e) { toast.error(e.message); }
    finally { setGenLoading(false); }
  };

  const getTypeInfo = (id) => DEBT_TYPES.find(t => t.id === id) || DEBT_TYPES[DEBT_TYPES.length - 1];
  const hasFiveSix  = debts.some(d => d.debtType === 'five_six');

  const activeDebts = useMemo(() => debts.filter(d => (d.remainingAmount || 0) > 0), [debts]);
  const payoffComparison = useMemo(
    () => showCalc ? comparePayoffStrategies(activeDebts, parsePesoInput(extraPayment) || 0) : null,
    [showCalc, activeDebts, extraPayment]
  );
  const activePlan = payoffComparison?.[strategy];

  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Debt Manager</h1>
              <p className="text-pw-muted text-sm mt-0.5">
                Kabuuang Utang: <span className="text-pw-rose font-bold">{formatPeso(totalDebt, 0)}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCalc(v => !v)}
                className="btn-secondary py-2.5 px-3 text-xs gap-1.5">
                <HiCalculator className="w-3.5 h-3.5 text-pw-blue-light" /> Calculator
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={generatePlan}
                className="btn-secondary py-2.5 px-3 text-xs gap-1.5">
                <HiSparkles className="w-3.5 h-3.5 text-pw-gold" /> AI Plan
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => openModal()}
                className="btn-primary py-2.5 px-4">
                <HiPlus className="w-4 h-4" /> Dagdag
              </motion.button>
            </div>
          </div>

          {/* Payoff Strategy Calculator */}
          <AnimatePresence>
            {showCalc && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="glass p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HiCalculator className="w-4 h-4 text-pw-blue-light" />
                      <p className="text-sm font-semibold text-white">Debt Payoff Calculator</p>
                    </div>
                    <button onClick={() => setShowCalc(false)}
                      className="w-7 h-7 rounded-lg bg-pw-subtle flex items-center justify-center text-pw-muted hover:text-white">
                      <HiXMark className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {activeDebts.length === 0 ? (
                    <p className="text-pw-muted text-sm">Walang aktibong utang na kalkulahin.</p>
                  ) : (
                    <>
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1">
                          <label className="block text-xs text-pw-muted mb-1.5">Extra Buwanang Bayad</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                            <input type="number" min="0" value={extraPayment}
                              onChange={e => setExtraPayment(e.target.value)}
                              className="input-glass pl-7" placeholder="1000" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-pw-muted mb-1.5">Estratehiya</label>
                          <div className="grid grid-cols-2 gap-1.5 h-[46px]">
                            <button type="button" onClick={() => setStrategy('avalanche')}
                              className={`rounded-xl text-xs font-semibold transition-all ${strategy === 'avalanche' ? 'bg-pw-gold text-pw-navy' : 'bg-pw-subtle text-pw-muted'}`}>
                              Avalanche
                            </button>
                            <button type="button" onClick={() => setStrategy('snowball')}
                              className={`rounded-xl text-xs font-semibold transition-all ${strategy === 'snowball' ? 'bg-pw-gold text-pw-navy' : 'bg-pw-subtle text-pw-muted'}`}>
                              Snowball
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-pw-muted leading-relaxed mb-4">
                        {strategy === 'avalanche'
                          ? 'Avalanche: bayaran muna ang utang na may pinaka-mataas na interest rate. Ito ang pinaka-mura sa lahat.'
                          : 'Snowball: bayaran muna ang pinaka-maliit na utang. Mas mabilis makakita ng progreso para sa motibasyon.'}
                      </p>

                      {activePlan?.impossible ? (
                        <div className="p-3 rounded-xl border border-pw-rose/30 bg-pw-rose-dim">
                          <p className="text-pw-rose text-xs font-medium">
                            Hindi kayang mabayaran nang buo ang mga utang gamit ang kasalukuyang minimum + extra na bayad — ang interes ay lumalaki nang mas mabilis kaysa sa bayad. Subukang dagdagan ang extra payment.
                          </p>
                        </div>
                      ) : activePlan && (
                        <>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="glass-sm p-3 text-center">
                              <p className="font-bold text-lg text-pw-emerald">
                                {activePlan.monthsToPayoff} {activePlan.monthsToPayoff === 1 ? 'buwan' : 'buwan'}
                              </p>
                              <p className="text-pw-muted text-[10px] mt-0.5">Hanggang Debt-Free</p>
                            </div>
                            <div className="glass-sm p-3 text-center">
                              <p className="font-bold text-lg text-pw-amber">{formatPeso(activePlan.totalInterestPaid, 0)}</p>
                              <p className="text-pw-muted text-[10px] mt-0.5">Kabuuang Interest</p>
                            </div>
                          </div>

                          {payoffComparison.interestSaved > 0 && strategy === 'snowball' && (
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pw-blue/10 border border-pw-blue/20 mb-4">
                              <HiTrophy className="w-4 h-4 text-pw-blue-light flex-shrink-0" />
                              <p className="text-[11px] text-white/80 leading-relaxed">
                                Makakatipid ka ng <strong className="text-pw-blue-light">{formatPeso(payoffComparison.interestSaved, 0)}</strong> sa interest kung gagamitin mo ang Avalanche method sa halip.
                              </p>
                            </div>
                          )}

                          <p className="text-xs text-pw-muted mb-2 font-semibold uppercase tracking-wide">Pagkakasunod-sunod ng Bayad</p>
                          <div className="space-y-1.5">
                            {activePlan.order.map((name, i) => (
                              <div key={name} className="flex items-center gap-2.5 text-sm">
                                <span className="w-5 h-5 rounded-full bg-pw-subtle flex items-center justify-center text-[10px] font-bold text-pw-muted flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-white/85">{name}</span>
                                {activePlan.payoffMonths[name] && (
                                  <span className="text-pw-muted text-xs ml-auto">buwan {activePlan.payoffMonths[name]}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5-6 Warning */}
          {hasFiveSix && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border border-pw-rose/30 bg-pw-rose-dim">
              <div className="flex gap-3">
                <HiExclamationTriangle className="w-5 h-5 text-pw-rose flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-pw-rose font-semibold text-sm mb-1">⚠️ 5-6 / Bombay Loan Detected</p>
                  <p className="text-white/70 text-xs leading-relaxed">
                    Ang 5-6 loans ay may napakataas na interest (20%/month). Gamitin ang AI Plan para makahanap ng mas mababang alternatibo tulad ng SSS o Pag-IBIG loan.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Summary Cards */}
          {debts.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Bilang ng Utang',   value: String(debts.length),              color: '#F7C13A' },
                { label: 'Buwanang Bayad',    value: formatPeso(debts.reduce((s, d) => s + (d.monthlyPayment || 0), 0), 0), color: '#F43F5E' },
                { label: 'Pinaka-mataas %',   value: `${Math.max(...debts.map(d => d.interestRate || 0))}%`, color: '#F97316' },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-sm p-3 text-center">
                  <p className="font-bold text-lg" style={{ color }}>{value}</p>
                  <p className="text-pw-muted text-[10px] mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Debt List */}
          {debts.length === 0 ? (
            <div className="glass p-10 text-center">
              <HiShieldCheck className="w-10 h-10 text-pw-muted mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Walang naitala na utang</p>
              <p className="text-pw-muted text-sm mb-4">Itala ang iyong mga utang para mapangalagaan.</p>
              <button onClick={() => openModal()} className="btn-primary px-6">Mag-record ng Utang</button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...debts].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0)).map((debt, idx) => {
                const typeInfo = getTypeInfo(debt.debtType);
                const paidPct  = getPercent(debt.originalAmount - debt.remainingAmount, debt.originalAmount);
                const isPaid   = debt.remainingAmount <= 0;
                return (
                  <motion.div key={debt.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}>
                    <div className="glass overflow-hidden">
                      <div className="h-1" style={{ background: isPaid ? '#10B981' : typeInfo.color }} />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                              style={{ background: `${typeInfo.color}15` }}>
                              {typeInfo.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-semibold text-sm">{debt.creditorName}</h3>
                                {isPaid && <HiCheckCircle className="w-4 h-4 text-pw-emerald" />}
                              </div>
                              <p className="text-pw-muted text-xs">{typeInfo.label}
                                {debt.interestRate > 0 && <span className="ml-1 text-pw-amber">· {debt.interestRate}% interest</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openModal(debt)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-pw-muted hover:text-white hover:bg-pw-subtle">
                              <HiPencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(debt.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-pw-muted hover:text-pw-rose hover:bg-pw-rose-dim">
                              <HiTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-baseline justify-between mb-2">
                          <div>
                            <span className="text-pw-rose font-bold text-lg peso-amount">{formatPeso(debt.remainingAmount, 0)}</span>
                            <span className="text-pw-muted text-xs"> / {formatPeso(debt.originalAmount, 0)}</span>
                          </div>
                          <span className="text-xs font-medium text-pw-muted">{paidPct}% bayad na</span>
                        </div>

                        <div className="progress-bar mb-4">
                          <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${paidPct}%` }}
                            transition={{ duration: 0.8 }}
                            style={{ background: isPaid ? '#10B981' : typeInfo.color }} />
                        </div>

                        {!isPaid && (
                          <div className="flex gap-2 items-center">
                            {debt.monthlyPayment > 0 && (
                              <p className="text-xs text-pw-muted flex-shrink-0">
                                Buwanang bayad: <span className="text-white font-medium">{formatPeso(debt.monthlyPayment, 0)}</span>
                              </p>
                            )}
                            <div className="ml-auto flex-shrink-0">
                              <QuickPayment onPay={(amt) => handlePayment(debt, amt)} />
                            </div>
                          </div>
                        )}
                        {debt.note && <p className="text-xs text-pw-muted mt-2 italic">&ldquo;{debt.note}&rdquo;</p>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* AI Repayment Plan */}
          <AnimatePresence>
            {showAI && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HiSparkles className="w-4 h-4 text-pw-gold" />
                      <p className="text-sm font-semibold text-white">AI Debt Repayment Plan</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={generatePlan} disabled={genLoading}
                        className="w-7 h-7 rounded-lg bg-pw-subtle flex items-center justify-center text-pw-muted hover:text-white">
                        <HiArrowPath className={`w-3.5 h-3.5 ${genLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={() => setShowAI(false)}
                        className="w-7 h-7 rounded-lg bg-pw-subtle flex items-center justify-center text-pw-muted hover:text-white">
                        <HiXMark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {genLoading && !aiResult ? (
                    <div className="space-y-2.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className={`shimmer h-3.5 rounded-lg ${i % 3 === 2 ? 'w-1/2' : 'w-full'}`} />
                      ))}
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
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl px-6 pt-6 max-h-[90dvh] overflow-y-auto sheet-modal"
              style={{ background: 'rgba(12,22,40,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />
              <h2 className="font-display text-xl font-bold text-white mb-5">
                {editDebt ? 'I-edit ang Utang' : 'Mag-record ng Utang'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Pangalan ng Nagpapautang</label>
                  <input type="text" placeholder="hal. BDO, Aling Maria, SSS..." className="input-glass"
                    {...register('creditorName', { required: 'Kinakailangan ang pangalan' })} />
                  {errors.creditorName && <p className="text-pw-rose text-xs mt-1">{errors.creditorName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-2">Uri ng Utang</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DEBT_TYPES.slice(0, 9).map(t => (
                      <label key={t.id} className="cursor-pointer">
                        <input type="radio" value={t.id} className="sr-only"
                          {...register('debtType', { required: 'Pumili ng uri' })} />
                        <div className={`p-2 rounded-xl border text-center text-xs transition-all ${
                          /* Checked state detected via CSS */
                          'border-white/08 bg-pw-subtle hover:border-white/15 text-pw-muted'
                        }`} style={{ cursor: 'pointer' }}>
                          <span className="text-sm block">{t.icon}</span>
                          <span className="text-[10px] leading-tight block mt-0.5">{t.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <select className="input-glass mt-2 text-sm" {...register('debtType', { required: 'Pumili ng uri' })}>
                    <option value="">Pumili ng uri ng utang...</option>
                    {DEBT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5">Orihinal na Halaga</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                      <input type="number" placeholder="50000" min="1" className="input-glass pl-7"
                        {...register('originalAmount', { required: 'Kinakailangan' })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5">Natitirang Halaga</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                      <input type="number" placeholder="50000" min="0" className="input-glass pl-7"
                        {...register('remainingAmount', { required: 'Kinakailangan' })} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5">Interest Rate (%/mo)</label>
                    <input type="number" placeholder="0" min="0" max="100" step="0.1" className="input-glass"
                      {...register('interestRate')} />
                  </div>
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5">Buwanang Bayad</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                      <input type="number" placeholder="0" min="0" className="input-glass pl-7"
                        {...register('monthlyPayment')} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Petsa ng Deadline (opsyonal)</label>
                  <input type="date" className="input-glass" {...register('dueDate')} />
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Note (opsyonal)</label>
                  <textarea rows={2} className="input-glass resize-none text-sm"
                    placeholder="hal. Utang para sa ospital, bayad na kapag may sweldo..."
                    {...register('note')} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Kanselahin</button>
                  <button type="submit" className="btn-primary flex-1">{editDebt ? 'I-update' : 'I-save'}</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickPayment({ onPay }) {
  const [val, setVal]   = useState('');
  const [show, setShow] = useState(false);
  return show ? (
    <div className="flex gap-1.5">
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-pw-gold text-xs font-bold">₱</span>
        <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="Bayad"
          className="input-glass py-1.5 pl-6 text-xs w-28" inputMode="numeric" autoFocus />
      </div>
      <button onClick={() => { onPay(val); setVal(''); setShow(false); }}
        className="btn-primary py-1.5 px-3 text-xs">OK</button>
      <button onClick={() => setShow(false)}
        className="w-7 h-7 rounded-xl bg-pw-subtle flex items-center justify-center text-pw-muted">
        <HiXMark className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : (
    <button onClick={() => setShow(true)} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
      <HiPlus className="w-3.5 h-3.5" /> Magbayad
    </button>
  );
}
