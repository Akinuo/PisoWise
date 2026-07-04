// src/pages/Transactions.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { addTransaction, deleteTransaction, getTransactions } from '../services/firebase';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import { formatPeso, formatDate, parsePesoInput } from '../utils/formatters';
import { Timestamp } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  HiPlus, HiArrowTrendingUp, HiArrowTrendingDown,
  HiTrash,
} from 'react-icons/hi2';
import CategoryIcon from '../components/common/CategoryIcon';

const TABS    = ['Lahat', 'Kita', 'Gastos'];
const FILTERS = ['Lahat', 'Ngayon', 'Linggong Ito', 'Buwang Ito'];

export default function Transactions() {
  const { user }  = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'income'  ? 'Kita'
                   : searchParams.get('tab') === 'expense' ? 'Gastos' : 'Lahat';

  const {
    transactions, setTransactions, addTransactionLocal,
    removeTransactionLocal, transactionsLoaded,
  } = useStore();

  const [activeTab,    setActiveTab]    = useState(initialTab);
  const [activeFilter, setActiveFilter] = useState('Lahat');
  const [showModal,    setShowModal]    = useState(!!searchParams.get('tab'));
  const [txType,       setTxType]       = useState(
    searchParams.get('tab') === 'income' ? 'income' : 'expense'
  );
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  // Load transactions
  useEffect(() => {
    if (!user || transactionsLoaded) return;
    getTransactions(user.uid).then(txs => setTransactions(txs)).catch(console.error);
  }, [user]);

  // ── Filter ──────────────────────────────────────────────────────────────
  const filterTxs = (txs) => {
    const now = new Date();
    return txs.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      if (activeTab === 'Kita'   && t.type !== 'income')  return false;
      if (activeTab === 'Gastos' && t.type !== 'expense') return false;
      if (activeFilter === 'Ngayon')
        return d.toDateString() === now.toDateString();
      if (activeFilter === 'Linggong Ito') {
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (activeFilter === 'Buwang Ito')
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  };

  // Clear selected category whenever the type tab switches
  const prevTxType = useRef(txType);
  useEffect(() => {
    if (prevTxType.current !== txType) {
      setValue('category', '', { shouldValidate: false });
      prevTxType.current = txType;
    }
  }, [txType, setValue]);

  const displayed  = filterTxs(transactions);
  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // ── Submit ──────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const amount = parsePesoInput(data.amount);
      if (amount <= 0) { toast.error('Maglagay ng tamang halaga.'); setSubmitting(false); return; }

      const dateVal = new Date(data.date + 'T00:00:00');
      const tx = {
        type:        txType,
        amount,
        category:    data.category,
        description: data.description?.trim() || '',
        date:        Timestamp.fromDate(dateVal),
        note:        data.note?.trim() || '',
      };

      const ref = await addTransaction(user.uid, tx);
      addTransactionLocal({ id: ref.id, userId: user.uid, ...tx, createdAt: Timestamp.now() });

      toast.success(txType === 'income' ? '✅ Kita naidagdag!' : '✅ Gastos naitala!');
      reset({ date: new Date().toISOString().slice(0, 10) });
      setShowModal(false);
    } catch {
      toast.error('Hindi nai-save. Subukan ulit.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Tanggalin ang transaksyon na ito?')) return;
    try {
      await deleteTransaction(id);
      removeTransactionLocal(id);
      toast.success('Natanggal na.');
    } catch {
      toast.error('Hindi natanggal. Subukan ulit.');
    }
  };

  const getCatInfo = (id, type) => {
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return cats.find(c => c.id === id) || { label: id, icon: '📦', color: '#6B7280' };
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <h1 className="font-display text-2xl font-bold text-white">Transaksyon</h1>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { setShowModal(true); setTxType('expense'); }}
              className="btn-primary py-2.5 px-4">
              <HiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Dagdag</span>
            </motion.button>
          </div>

          {/* Quick type buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { setTxType('expense'); setShowModal(true); }}
              className="flex items-center gap-3 p-3 rounded-2xl border border-pw-rose/20 bg-pw-rose-dim hover:border-pw-rose/35 transition-all">
              <div className="w-9 h-9 rounded-xl bg-pw-rose/20 flex items-center justify-center">
                <HiArrowTrendingDown className="w-4 h-4 text-pw-rose" />
              </div>
              <span className="text-white text-sm font-medium">Idagdag Gastos</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { setTxType('income'); setShowModal(true); }}
              className="flex items-center gap-3 p-3 rounded-2xl border border-pw-emerald/20 bg-pw-emerald-dim hover:border-pw-emerald/35 transition-all">
              <div className="w-9 h-9 rounded-xl bg-pw-emerald/20 flex items-center justify-center">
                <HiArrowTrendingUp className="w-4 h-4 text-pw-emerald" />
              </div>
              <span className="text-white text-sm font-medium">Idagdag Kita</span>
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="glass-sm p-1 flex gap-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
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
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeFilter === f
                    ? 'bg-pw-blue/20 border-pw-blue/40 text-pw-blue-light'
                    : 'border-white/10 text-pw-muted hover:text-white'
                }`}>
                {f}
              </button>
            ))}
          </div>

          {/* Transactions list */}
          {displayed.length === 0 ? (
            <div className="glass p-10 text-center">
              <HiArrowsRightLeft className="w-10 h-10 text-pw-muted mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Walang nakitang transaksyon</p>
              <p className="text-pw-muted text-sm">Mag-tap ng "Dagdag" para magsimula.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayed.map((tx) => {
                const cat = getCatInfo(tx.category, tx.type);
                return (
                  <motion.div key={tx.id} layout
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="glass-sm p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cat.color}1e` }}>
                        <CategoryIcon id={tx.category} color={cat.color} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {tx.description || cat.label}
                        </p>
                        <p className="text-pw-muted text-xs mt-0.5">
                          {cat.label} · {formatDate(tx.date, 'relative')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className={`font-bold text-sm peso-amount ${
                          tx.type === 'income' ? 'text-pw-emerald' : 'text-pw-rose'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{formatPeso(tx.amount, 0)}
                        </p>
                        <button onClick={() => handleDelete(tx.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-pw-muted hover:text-pw-rose hover:bg-pw-rose-dim transition-all">
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)} />

            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl px-6 pt-6 max-h-[85dvh] overflow-y-auto sheet-modal"
              style={{
                background:     'rgba(12,22,40,0.98)',
                backdropFilter: 'blur(28px)',
                border:         '1px solid rgba(255,255,255,0.08)',
              }}>

              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

              {/* Type toggle */}
              <div className="flex gap-2 mb-5">
                <button onClick={() => setTxType('expense')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    txType === 'expense'
                      ? 'bg-pw-rose/20 border border-pw-rose/30 text-pw-rose'
                      : 'bg-pw-subtle text-pw-muted'
                  }`}>
                  <HiArrowTrendingDown className="w-4 h-4" /> Gastos
                </button>
                <button onClick={() => setTxType('income')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    txType === 'income'
                      ? 'bg-pw-emerald-dim border border-pw-emerald/30 text-pw-emerald'
                      : 'bg-pw-subtle text-pw-muted'
                  }`}>
                  <HiArrowTrendingUp className="w-4 h-4" /> Kita
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Amount */}
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Halaga</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-lg">₱</span>
                    <input
                      type="number" placeholder="0.00" step="0.01" min="0"
                      inputMode="decimal" className="input-glass pl-9 text-lg font-bold peso-amount"
                      {...register('amount', {
                        required: 'Maglagay ng halaga',
                        min:      { value: 0.01, message: 'Dapat mas malaki sa 0' },
                      })}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-pw-rose text-xs mt-1">{errors.amount.message}</p>
                  )}
                </div>

                {/* Category clickable grid — all categories, no dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-pw-muted">Kategorya</label>
                    {watch('category') && (
                      <span className="text-[10px] text-pw-gold font-medium">
                        {categories.find(c => c.id === watch('category'))?.label}
                      </span>
                    )}
                  </div>

                  {/* Hidden input registers the field with react-hook-form */}
                  <input
                    type="hidden"
                    {...register('category', { required: 'Pumili ng kategorya' })}
                  />

                  <div
                    className="grid grid-cols-4 gap-1.5 max-h-[14rem] overflow-y-auto pr-0.5"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.10) transparent' }}
                  >
                    {categories.map(cat => {
                      const sel = watch('category') === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setValue('category', cat.id, { shouldValidate: true })}
                          className={`relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all duration-150 select-none ${
                            sel
                              ? 'border-pw-gold/55 bg-pw-gold-dim'
                              : 'border-white/[0.06] bg-white/[0.025] active:bg-white/[0.05]'
                          }`}
                          style={sel ? {
                            boxShadow: '0 0 0 1px rgba(245,183,49,0.15) inset, 0 2px 10px rgba(245,183,49,0.08)',
                          } : {}}
                        >
                          {sel && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pw-gold" />
                          )}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${cat.color}${sel ? '28' : '18'}` }}
                          >
                            <CategoryIcon
                              id={cat.id}
                              color={sel ? '#F5B731' : cat.color}
                              size={18}
                            />
                          </div>
                          <span className={`text-[9px] leading-tight text-center line-clamp-2 w-full ${
                            sel ? 'text-pw-gold font-semibold' : 'text-pw-muted'
                          }`}>
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {errors.category && (
                    <p className="text-pw-rose text-xs mt-1.5">{errors.category.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Paglalarawan (opsyonal)</label>
                  <input
                    type="text"
                    placeholder={txType === 'expense'
                      ? 'hal. Tanghalian sa Jollibee'
                      : 'hal. Sweldo — Mayo'}
                    className="input-glass"
                    {...register('description')}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Petsa</label>
                  <input type="date" className="input-glass"
                    max={new Date().toISOString().slice(0, 10)}
                    {...register('date', { required: 'Pumili ng petsa' })} />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                  {submitting
                    ? 'Nag-sa-save...'
                    : `I-save ang ${txType === 'income' ? 'Kita' : 'Gastos'}`}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
