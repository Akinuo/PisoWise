// src/pages/Transactions.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import { addTransaction, deleteTransaction, getTransactions } from '../services/firebase';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import CategoryIcon from '../components/common/CategoryIcon';
import { formatPeso, formatDate, parsePesoInput } from '../utils/formatters';
import { Timestamp } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  HiPlus, HiArrowTrendingUp, HiArrowTrendingDown,
  HiTrash, HiArrowsRightLeft, HiXMark,
} from 'react-icons/hi2';

const TABS    = ['Lahat', 'Kita', 'Gastos'];
const FILTERS = ['Lahat', 'Ngayon', 'Linggong Ito', 'Buwang Ito'];

export default function Transactions() {
  const { user }  = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'income' ? 'Kita'
                   : searchParams.get('tab') === 'expense' ? 'Gastos' : 'Lahat';

  const { transactions, setTransactions, addTransactionLocal, removeTransactionLocal, transactionsLoaded } = useStore((s) => ({ transactions: s.transactions, setTransactions: s.setTransactions, addTransactionLocal: s.addTransactionLocal, removeTransactionLocal: s.removeTransactionLocal, transactionsLoaded: s.transactionsLoaded, }), shallow);

  const [activeTab,    setActiveTab]    = useState(initialTab);
  const [activeFilter, setActiveFilter] = useState('Lahat');
  const [showModal,    setShowModal]    = useState(!!searchParams.get('tab'));
  const [txType,       setTxType]       = useState(searchParams.get('tab') === 'income' ? 'income' : 'expense');
  const [submitting,   setSubmitting]   = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  // Fetch once per user session — see Dashboard.jsx for why deps stay [user] only.
  useEffect(() => {
    if (!user || transactionsLoaded) return;
    getTransactions(user.uid).then(txs => setTransactions(txs)).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filterTxs = (txs) => {
    const now = new Date();
    return txs.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      if (activeTab === 'Kita'   && t.type !== 'income')  return false;
      if (activeTab === 'Gastos' && t.type !== 'expense') return false;
      if (activeFilter === 'Ngayon')
        return d.toDateString() === now.toDateString();
      if (activeFilter === 'Linggong Ito') {
        const w = new Date(); w.setDate(now.getDate() - 7);
        return d >= w;
      }
      if (activeFilter === 'Buwang Ito')
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const displayed  = filterTxs(transactions);
  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCat = watch('category');

  const onSubmit = async (data) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const amount = parsePesoInput(data.amount);
      if (amount <= 0) { toast.error('Maglagay ng tamang halaga.'); setSubmitting(false); return; }
      const tx = {
        type:        txType,
        amount,
        category:    data.category,
        description: data.description?.trim() || '',
        date:        Timestamp.fromDate(new Date(data.date + 'T00:00:00')),
        note:        data.note?.trim() || '',
      };
      const ref = await addTransaction(user.uid, tx);
      addTransactionLocal({ id: ref.id, userId: user.uid, ...tx, createdAt: Timestamp.now() });
      toast.success(txType === 'income' ? 'Kita naidagdag!' : 'Gastos naitala!');
      reset({ date: new Date().toISOString().slice(0, 10) });
      setShowModal(false);
    } catch {
      toast.error('Hindi nai-save. Subukan ulit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tanggalin ang transaksyon na ito?')) return;
    try {
      await deleteTransaction(id);
      removeTransactionLocal(id);
      toast.success('Natanggal na.');
    } catch { toast.error('Hindi natanggal. Subukan ulit.'); }
  };

  const getCatInfo = (id, type) => {
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return cats.find(c => c.id === id) || { id: 'other', label: id, color: '#6B7280' };
  };

  /* ── open modal and reset category ── */
  const openModal = (type) => {
    setTxType(type);
    reset({ date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <h1 className="font-display text-3xl text-white">Transaksyon</h1>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openModal('expense')} className="btn-primary py-2 px-3.5 text-sm">
              <HiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Dagdag</span>
            </motion.button>
          </div>

          {/* Quick type buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => openModal('expense')}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-pw-rose/20 bg-pw-rose-dim hover:border-pw-rose/35 transition-all cursor-pointer">
              <div className="icon-box-sm" style={{ background: 'rgba(244,63,94,0.12)' }}>
                <HiArrowTrendingDown className="w-4 h-4 text-pw-rose" style={{ width: 16, height: 16 }} />
              </div>
              <span className="text-white text-sm font-medium">Idagdag Gastos</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => openModal('income')}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-pw-emerald/20 bg-pw-emerald-dim hover:border-pw-emerald/35 transition-all cursor-pointer">
              <div className="icon-box-sm" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <HiArrowTrendingUp className="w-4 h-4 text-pw-emerald" style={{ width: 16, height: 16 }} />
              </div>
              <span className="text-white text-sm font-medium">Idagdag Kita</span>
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="glass-sm p-1 flex gap-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab ? 'bg-pw-gold text-pw-navy' : 'text-pw-muted hover:text-white'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scroll-hidden pb-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  activeFilter === f
                    ? 'bg-pw-blue-dim border-pw-blue/30 text-pw-blue-light'
                    : 'border-white/10 text-pw-muted hover:text-white'
                }`}>
                {f}
              </button>
            ))}
          </div>

          {/* Transactions list */}
          {displayed.length === 0 ? (
            <div className="glass p-10 text-center">
              <div className="icon-box mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.04)', width: 48, height: 48, borderRadius: 16 }}>
                <HiArrowsRightLeft className="w-5 h-5 text-pw-muted" style={{ width: 20, height: 20 }} />
              </div>
              <p className="text-white font-semibold mb-1">Walang nakitang transaksyon</p>
              <p className="text-pw-muted text-sm">Mag-tap ng &ldquo;Dagdag&rdquo; para magsimula.</p>
            </div>
          ) : (
            <div className="glass overflow-hidden">
              {displayed.map((tx, i) => {
                const cat = getCatInfo(tx.category, tx.type);
                return (
                  <motion.div key={tx.id} layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}>
                    <div className={`flex items-center gap-3 px-4 py-3.5 ${i < displayed.length - 1 ? 'border-b border-white/[0.045]' : ''}`}>
                      <div className="icon-box-sm flex-shrink-0"
                        style={{ background: tx.type === 'income' ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.10)' }}>
                        <CategoryIcon id={tx.category} size={15} color={tx.type === 'income' ? '#10B981' : '#F43F5E'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{tx.description || cat.label}</p>
                        <p className="text-pw-muted text-xs mt-0.5">{cat.label} · {formatDate(tx.date, 'relative')}</p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <p className={`font-semibold text-sm peso-amount font-mono ${tx.type === 'income' ? 'text-pw-emerald' : 'text-pw-rose'}`}>
                          {tx.type === 'income' ? '+' : '−'}{formatPeso(tx.amount, 0)}
                        </p>
                        <button onClick={() => handleDelete(tx.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-pw-muted hover:text-pw-rose hover:bg-pw-rose-dim transition-all cursor-pointer">
                          <HiTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Transaction Modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)} />

            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl"
              style={{ maxHeight: '90dvh' }}
            >
              <div className="overflow-y-auto sheet-modal px-5 pt-5"
                style={{ background: 'rgba(10,18,35,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '90dvh' }}>

                {/* Handle + close */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                  <button onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-pw-muted hover:text-white transition-colors cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <HiXMark className="w-4 h-4" />
                  </button>
                </div>

                {/* Type toggle */}
                <div className="flex gap-2 mb-5">
                  {[
                    { type: 'expense', icon: HiArrowTrendingDown, label: 'Gastos', color: 'pw-rose', bg: 'rgba(244,63,94,0.12)', activeBorder: 'rgba(244,63,94,0.28)' },
                    { type: 'income',  icon: HiArrowTrendingUp,   label: 'Kita',   color: 'pw-emerald', bg: 'rgba(16,185,129,0.12)', activeBorder: 'rgba(16,185,129,0.28)' },
                  ].map(({ type, icon: Icon, label, bg, activeBorder }) => (
                    <button key={type} type="button" onClick={() => { setTxType(type); setValue('category', ''); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer"
                      style={{
                        background:   txType === type ? bg : 'rgba(255,255,255,0.04)',
                        border:       `1px solid ${txType === type ? activeBorder : 'rgba(255,255,255,0.08)'}`,
                        color:        txType === type ? (type === 'expense' ? '#F43F5E' : '#10B981') : 'rgba(255,255,255,0.42)',
                      }}>
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                  {/* Amount */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">Halaga</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-xl peso-amount">₱</span>
                      <input type="number" placeholder="0.00" step="0.01" min="0" inputMode="decimal"
                        className="input-glass pl-9 text-2xl font-bold peso-amount"
                        {...register('amount', { required: 'Maglagay ng halaga', min: { value: 0.01, message: 'Dapat mas malaki sa 0' } })} />
                    </div>
                    {errors.amount && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.amount.message}</p>}
                  </div>

                  {/* Category — SVG icon grid, no emojis, all clickable */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-2 font-semibold uppercase tracking-wide">Kategorya</label>
                    <div className="grid grid-cols-4 gap-2">
                      {categories.map(cat => {
                        const isSelected = selectedCat === cat.id;
                        return (
                          <label key={cat.id} className="cursor-pointer">
                            <input type="radio" value={cat.id} className="sr-only"
                              {...register('category', { required: 'Pumili ng kategorya' })} />
                            <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                              isSelected
                                ? 'border-pw-gold/45 bg-pw-gold-dim'
                                : 'border-white/[0.07] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]'
                            }`}>
                              <div style={{ color: isSelected ? '#F5B731' : cat.color }}>
                                <CategoryIcon id={cat.id} size={18} color={isSelected ? '#F5B731' : cat.color} />
                              </div>
                              <span className={`text-[9px] font-semibold text-center leading-tight ${isSelected ? 'text-pw-gold' : 'text-pw-muted'}`}>
                                {cat.label}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {errors.category && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.category.message}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">Paglalarawan <span className="normal-case text-pw-muted/60">(opsyonal)</span></label>
                    <input type="text"
                      placeholder={txType === 'expense' ? 'hal. Tanghalian sa Jollibee' : 'hal. Sweldo — Mayo'}
                      className="input-glass" {...register('description')} />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">Petsa</label>
                    <input type="date" className="input-glass"
                      max={new Date().toISOString().slice(0, 10)}
                      {...register('date', { required: 'Pumili ng petsa' })} />
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full mt-1">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                        Nag-sa-save…
                      </span>
                    ) : `I-save ang ${txType === 'income' ? 'Kita' : 'Gastos'}`}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
