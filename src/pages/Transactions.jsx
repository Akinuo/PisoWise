// src/pages/Transactions.jsx
import { useState, useEffect } from 'react';
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
  HiTrash, HiArrowsRightLeft, HiXMark,
} from 'react-icons/hi2';

/* ── Category SVG icons — no emojis ─────────────────────────────────────── */
function CatIcon({ catId, size = 18, color = 'currentColor' }) {
  const icons = {
    // Expense
    food: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.5 2 6 5 6 8c0 2.5 1.5 4.5 3.5 5.5V20a1 1 0 002 0v-6.5C13.5 12.5 15 10.5 15 8c0-3-2.5-6-3-6z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 2v5M12 2v5M15 2v5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    transport: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="11" rx="3" stroke={color} strokeWidth="1.5"/>
        <path d="M3 11h18" stroke={color} strokeWidth="1.5"/>
        <circle cx="7.5" cy="20" r="1.5" stroke={color} strokeWidth="1.5"/>
        <circle cx="16.5" cy="20" r="1.5" stroke={color} strokeWidth="1.5"/>
        <path d="M3 7l2-4h14l2 4" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    utilities: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L8 9h8L12 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 9v7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="18" r="2" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    rent: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 11L12 4l9 7v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 20v-7h6v7" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    health: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 21C7 17 3 14 3 9.5 3 7 5 5 7.5 5c1.5 0 3 .8 4.5 2.4C13.5 5.8 15 5 16.5 5 19 5 21 7 21 9.5 21 14 17 17 12 21z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    education: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M2 10l10-6 10 6-10 6-10-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 12v5c0 2 2.7 3 6 3s6-1 6-3v-5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 10v5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    clothing: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 7l5-3 4 3 4-3 5 3-2 4h-3v9H8v-9H5L3 7z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    load: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.5"/>
        <circle cx="12" cy="17" r="1" fill={color}/>
        <path d="M9 6h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    debt: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.5"/>
        <path d="M2 10h20" stroke={color} strokeWidth="1.5"/>
        <circle cx="8" cy="15" r="1.5" stroke={color} strokeWidth="1.3"/>
      </svg>
    ),
    grocery: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 7h18l-3-5H6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M3 7l2 12a2 2 0 002 2h10a2 2 0 002-2l2-12" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M10 12v4M14 12v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    sari_sari: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 10a7 7 0 0118 0v10H3V10z" stroke={color} strokeWidth="1.5"/>
        <path d="M3 10h18" stroke={color} strokeWidth="1.5"/>
        <path d="M9 20v-5h6v5" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 6l1-3M18 6l-1-3M12 6V3" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    remittance: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
        <path d="M8 12h8M16 12l-3-3M16 12l-3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    savings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M19 12a7 7 0 10-7 7v2l2-2-2-2v2a5 5 0 110-7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 9v6M9 11h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    insurance: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6L12 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    personal: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    // Income
    salary: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={color} strokeWidth="1.5"/>
        <path d="M12 12v4M10 14h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    business: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 10a7 7 0 0118 0v10H3V10z" stroke={color} strokeWidth="1.5"/>
        <path d="M3 10h18M9 20v-5h6v5" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    freelance: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
        <path d="M8 20h8M12 18v2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 10l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    farming: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 20s1-6 9-9c0 0-1 6-9 9z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 11c1-3 4-8 9-9 0 5-3 9-9 9z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M3 20h18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    '13th_month': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3 6.5L22 9.3l-5 5 1.2 7-6.2-3.3L5.8 21.3l1.2-7-5-5 6.9-0.8L12 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    bonus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
        <path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    allowance: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke={color} strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.5"/>
        <path d="M7 12h.5M16.5 12H17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    rental: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 11L12 4l9 7v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9z" stroke={color} strokeWidth="1.5"/>
        <path d="M9 20v-5h6v5" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 8v2M11 9h2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    ofw: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22 16.5A9 9 0 0112 21a9 9 0 01-9-9 9 9 0 019-9c1.6 0 3.1.4 4.4 1.1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19 8l3-5M22 3l-5 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 12h18" stroke={color} strokeWidth="1" opacity="0.4"/>
        <path d="M12 3c-2 3-2 15 0 18M12 3c2 3 2 15 0 18" stroke={color} strokeWidth="1" opacity="0.4"/>
      </svg>
    ),
    government: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 10L12 3l9 7H3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M5 10v10M9 10v10M15 10v10M19 10v10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 20h18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    other: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
        <path d="M12 8v4l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };
  return icons[catId] || icons.other;
}

const TABS    = ['Lahat', 'Kita', 'Gastos'];
const FILTERS = ['Lahat', 'Ngayon', 'Linggong Ito', 'Buwang Ito'];

export default function Transactions() {
  const { user }  = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'income' ? 'Kita'
                   : searchParams.get('tab') === 'expense' ? 'Gastos' : 'Lahat';

  const { transactions, setTransactions, addTransactionLocal, removeTransactionLocal, transactionsLoaded } = useStore();

  const [activeTab,    setActiveTab]    = useState(initialTab);
  const [activeFilter, setActiveFilter] = useState('Lahat');
  const [showModal,    setShowModal]    = useState(!!searchParams.get('tab'));
  const [txType,       setTxType]       = useState(searchParams.get('tab') === 'income' ? 'income' : 'expense');
  const [submitting,   setSubmitting]   = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => {
    if (!user || transactionsLoaded) return;
    getTransactions(user.uid).then(txs => setTransactions(txs)).catch(console.error);
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
              <p className="text-pw-muted text-sm">Mag-tap ng "Dagdag" para magsimula.</p>
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
                        <CatIcon catId={tx.category} size={15} color={tx.type === 'income' ? '#10B981' : '#F43F5E'} />
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
              <div className="overflow-y-auto sheet-modal px-5 pt-5 pb-4"
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
                                <CatIcon catId={cat.id} size={18} color={isSelected ? '#F5B731' : cat.color} />
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
