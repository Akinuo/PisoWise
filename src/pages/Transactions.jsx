// src/pages/Transactions.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import { useTranslation } from '../i18n/useTranslation';
import { addTransaction, deleteTransaction, getTransactions, getBudget } from '../services/firebase';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryInfo, getCategoryLabel } from '../utils/constants';
import CategoryIcon from '../components/common/CategoryIcon';
import { formatPeso, formatDate, parsePesoInput, getCurrentMonthYear } from '../utils/formatters';
import { exportTransactionsToCsv } from '../utils/csvExport';
import { compressImageToBase64 } from '../utils/imageCompress';
import { extractReceiptData } from '../services/groq';
import { checkCategoryAlert } from '../utils/budgetAlerts';
import RecurringBills from '../components/transactions/RecurringBills';
import VoiceInput from '../components/common/VoiceInput';
import { Timestamp } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  HiPlus, HiArrowTrendingUp, HiArrowTrendingDown,
  HiTrash, HiArrowsRightLeft, HiXMark, HiMagnifyingGlass,
  HiArrowDownTray, HiCamera, HiMicrophone, HiSparkles, HiDocumentText,
} from 'react-icons/hi2';

// Internal ids stay fixed regardless of language — only the displayed label
// is translated. Keeps state comparisons (e.g. activeTab === 'Kita')
// stable no matter which language is active.
const TABS    = [{ id: 'Lahat', key: 'tabAll' }, { id: 'Kita', key: 'tabIncome' }, { id: 'Gastos', key: 'tabExpense' }];
const FILTERS = [{ id: 'Lahat', key: 'filterAll' }, { id: 'Ngayon', key: 'filterToday' }, { id: 'Linggong Ito', key: 'filterWeek' }, { id: 'Buwang Ito', key: 'filterMonth' }];

export default function Transactions() {
  const { user }  = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'income' ? 'Kita'
                   : searchParams.get('tab') === 'expense' ? 'Gastos' : 'Lahat';

  const { transactions, setTransactions, addTransactionLocal, removeTransactionLocal, transactionsLoaded, activeBudget, setActiveBudget } = useStore((s) => ({ transactions: s.transactions, setTransactions: s.setTransactions, addTransactionLocal: s.addTransactionLocal, removeTransactionLocal: s.removeTransactionLocal, transactionsLoaded: s.transactionsLoaded, activeBudget: s.activeBudget, setActiveBudget: s.setActiveBudget, }), shallow);

  const [activeTab,    setActiveTab]    = useState(initialTab);
  const [activeFilter, setActiveFilter] = useState('Lahat');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showModal,    setShowModal]    = useState(!!searchParams.get('tab'));
  const [txType,       setTxType]       = useState(searchParams.get('tab') === 'income' ? 'income' : 'expense');
  const [submitting,   setSubmitting]   = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [compressing,    setCompressing]    = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [scanningReceipt, setScanningReceipt] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  // Fetch once per user session — see Dashboard.jsx for why deps stay [user] only.
  useEffect(() => {
    if (!user) return;
    if (!transactionsLoaded) {
      getTransactions(user.uid).then(txs => setTransactions(txs)).catch(console.error);
    }
    // Also load the current month's budget (for category-limit alerts) if we
    // don't already have it — cheap single-doc read, and Budget.jsx may not
    // have been visited yet this session.
    const { month, year } = getCurrentMonthYear();
    if (!(activeBudget?.month === month && activeBudget?.year === year)) {
      getBudget(user.uid, month, year).then(b => { if (b) setActiveBudget(b); }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const filterTxs = (txs) => {
    const now = new Date();
    const q = searchQuery.trim().toLowerCase();
    return txs.filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      if (activeTab === 'Kita'   && t.type !== 'income')  return false;
      if (activeTab === 'Gastos' && t.type !== 'expense') return false;
      if (q) {
        const label = getCategoryInfo(t.category, t.type).label.toLowerCase();
        const haystack = `${t.description || ''} ${t.note || ''} ${label}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
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

  const handleExport = () => {
    if (displayed.length === 0) return;
    exportTransactionsToCsv(displayed, (id, type) => getCategoryInfo(id, type).label);
    toast.success(t('transactions.csvExported'));
  };

  const handlePdfExport = async () => {
    if (displayed.length === 0) return;
    const filterLabel = FILTERS.find(f => f.id === activeFilter);
    const label = activeFilter === 'Lahat' ? t('transactions.allTransactions') : t(`transactions.${filterLabel.key}`);
    const { generateMonthlyReportPdf } = await import('../utils/pdfExport');
    generateMonthlyReportPdf({
      monthLabel: label,
      transactions: displayed,
      getCatLabel: getCategoryLabel,
    });
    toast.success(t('transactions.pdfExported'));
  };

  const handleVoiceResult = (parsed) => {
    setTxType(parsed.type);
    setValue('amount', String(parsed.amount || ''));
    setValue('category', parsed.category);
    setValue('description', parsed.description || '');
    setShowVoicePanel(false);
    toast.success(t('transactions.voiceFilled'));
  };

  const handleScanReceipt = async () => {
    if (!receiptPreview) return;
    setScanningReceipt(true);
    try {
      const categoryIds = (txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => c.id);
      const result = await extractReceiptData(receiptPreview, categoryIds);
      if (result.amount > 0) setValue('amount', String(result.amount));
      if (result.description) setValue('description', result.description);
      if (result.category) setValue('category', result.category);
      toast.success(t('transactions.receiptRead'));
    } catch (err) {
      toast.error(err.message || t('transactions.receiptReadFailed'));
    } finally {
      setScanningReceipt(false);
    }
  };

  const handleReceiptSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const base64 = await compressImageToBase64(file);
      setReceiptPreview(base64);
    } catch (err) {
      toast.error(err.message || t('transactions.imageProcessFailed'));
    } finally {
      setCompressing(false);
      e.target.value = ''; // allow selecting the same file again later
    }
  };

  const onSubmit = async (data) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const amount = parsePesoInput(data.amount);
      if (amount <= 0) { toast.error(t('transactions.amountInvalid')); setSubmitting(false); return; }
      const tx = {
        type:        txType,
        amount,
        category:    data.category,
        description: data.description?.trim() || '',
        date:        Timestamp.fromDate(new Date(data.date + 'T00:00:00')),
        note:        data.note?.trim() || '',
        ...(receiptPreview ? { receiptImage: receiptPreview } : {}),
      };
      const ref = await addTransaction(user.uid, tx);
      addTransactionLocal({ id: ref.id, userId: user.uid, ...tx, createdAt: Timestamp.now() });
      toast.success(txType === 'income' ? t('transactions.incomeAdded') : t('transactions.expenseAdded'));

      // Budget category alert — only meaningful for expenses landing in the
      // current month, and only if a budget with categoryLimits was saved.
      if (txType === 'expense' && activeBudget?.categoryLimits) {
        const { month, year } = getCurrentMonthYear();
        const txDate = tx.date.toDate();
        if (txDate.getMonth() + 1 === month && txDate.getFullYear() === year) {
          const spentThisMonth = transactions
            .filter(t => {
              if (t.type !== 'expense' || t.category !== data.category) return false;
              const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
              return d.getMonth() + 1 === month && d.getFullYear() === year;
            })
            .reduce((s, t) => s + t.amount, 0) + amount;
          const alert = checkCategoryAlert(data.category, spentThisMonth, activeBudget.categoryLimits);
          if (alert) {
            const label = getCategoryInfo(data.category, 'expense').label;
            if (alert.level === 'over') {
              toast(t('transactions.budgetOver', { category: label, percent: alert.percent }), { duration: 5000 });
            } else {
              toast(t('transactions.budgetNear', { category: label, percent: alert.percent }), { duration: 4000 });
            }
          }
        }
      }

      reset({ date: new Date().toISOString().slice(0, 10) });
      setReceiptPreview(null);
      setShowModal(false);
    } catch {
      toast.error(t('transactions.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('transactions.confirmDelete'))) return;
    try {
      await deleteTransaction(id);
      removeTransactionLocal(id);
      toast.success(t('transactions.deleted'));
    } catch { toast.error(t('transactions.deleteFailed')); }
  };

  /* ── open modal and reset category ── */
  const openModal = (type) => {
    setTxType(type);
    reset({ date: new Date().toISOString().slice(0, 10) });
    setReceiptPreview(null);
    setShowVoicePanel(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setReceiptPreview(null);
    setShowVoicePanel(false);
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <h1 className="font-display text-3xl text-white">{t('transactions.title')}</h1>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleExport}
                disabled={displayed.length === 0}
                className="btn-secondary py-2 px-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('transactions.exportCsv')}>
                <HiArrowDownTray className="w-4 h-4" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={handlePdfExport}
                disabled={displayed.length === 0}
                className="btn-secondary py-2 px-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t('transactions.exportPdf')}>
                <HiDocumentText className="w-4 h-4" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => openModal('expense')} className="btn-primary py-2 px-3.5 text-sm">
                <HiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.add')}</span>
              </motion.button>
            </div>
          </div>

          {/* Quick type buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => openModal('expense')}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-pw-rose/20 bg-pw-rose-dim hover:border-pw-rose/35 transition-all cursor-pointer">
              <div className="icon-box-sm" style={{ background: 'rgba(244,63,94,0.12)' }}>
                <HiArrowTrendingDown className="w-4 h-4 text-pw-rose" style={{ width: 16, height: 16 }} />
              </div>
              <span className="text-white text-sm font-medium">{t('transactions.addExpense')}</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => openModal('income')}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-pw-emerald/20 bg-pw-emerald-dim hover:border-pw-emerald/35 transition-all cursor-pointer">
              <div className="icon-box-sm" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <HiArrowTrendingUp className="w-4 h-4 text-pw-emerald" style={{ width: 16, height: 16 }} />
              </div>
              <span className="text-white text-sm font-medium">{t('transactions.addIncome')}</span>
            </motion.button>
          </div>

          {/* Recurring bills — due-soon reminders + manage entry point */}
          <RecurringBills />

          {/* Tabs */}
          <div className="glass-sm p-1 flex gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id ? 'bg-pw-gold text-pw-navy' : 'text-pw-muted hover:text-white'
                }`}>
                {t(`transactions.${tab.key}`)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('transactions.searchPlaceholder')} className="input-glass pl-10 text-sm" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pw-muted hover:text-white">
                <HiXMark className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scroll-hidden pb-1">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-pw-blue-dim border-pw-blue/30 text-pw-blue-light'
                    : 'border-white/10 text-pw-muted hover:text-white'
                }`}>
                {t(`transactions.${f.key}`)}
              </button>
            ))}
          </div>

          {/* Transactions list */}
          {displayed.length === 0 ? (
            <div className="glass p-10 text-center">
              <div className="icon-box mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.04)', width: 48, height: 48, borderRadius: 16 }}>
                <HiArrowsRightLeft className="w-5 h-5 text-pw-muted" style={{ width: 20, height: 20 }} />
              </div>
              <p className="text-white font-semibold mb-1">{t('transactions.noResultsTitle')}</p>
              <p className="text-pw-muted text-sm">{t('transactions.noResultsBody')}</p>
            </div>
          ) : (
            <div className="glass overflow-hidden">
              {displayed.map((tx, i) => {
                const cat = getCategoryInfo(tx.category, tx.type);
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
                        {tx.receiptImage && (
                          <button onClick={() => setViewingReceipt(tx.receiptImage)}
                            className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer"
                            aria-label={t('transactions.viewReceipt')}>
                            <img src={tx.receiptImage} alt={t('transactions.receipt')} className="w-full h-full object-cover" />
                          </button>
                        )}
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
              onClick={closeModal} />

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
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowVoicePanel(v => !v)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        showVoicePanel ? 'bg-pw-gold text-pw-navy' : 'text-pw-muted hover:text-white'
                      }`}
                      style={showVoicePanel ? {} : { background: 'rgba(255,255,255,0.05)' }}
                      aria-label={t('transactions.useVoice')}>
                      <HiMicrophone className="w-4 h-4" />
                    </button>
                    <button onClick={closeModal}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-pw-muted hover:text-white transition-colors cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <HiXMark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Voice input panel */}
                <AnimatePresence>
                  {showVoicePanel && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mb-5 overflow-hidden">
                      <div className="glass-sm p-4">
                        <VoiceInput onResult={handleVoiceResult} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Type toggle */}
                <div className="flex gap-2 mb-5">
                  {[
                    { type: 'expense', icon: HiArrowTrendingDown, label: t('common.expense'), color: 'pw-rose', bg: 'rgba(244,63,94,0.12)', activeBorder: 'rgba(244,63,94,0.28)' },
                    { type: 'income',  icon: HiArrowTrendingUp,   label: t('common.income'),   color: 'pw-emerald', bg: 'rgba(16,185,129,0.12)', activeBorder: 'rgba(16,185,129,0.28)' },
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
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('common.amount')}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-xl peso-amount">₱</span>
                      <input type="number" placeholder="0.00" step="0.01" min="0" inputMode="decimal"
                        className="input-glass pl-9 text-2xl font-bold peso-amount"
                        {...register('amount', { required: t('transactions.amountRequired'), min: { value: 0.01, message: t('transactions.amountPositive') } })} />
                    </div>
                    {errors.amount && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.amount.message}</p>}
                  </div>

                  {/* Category — SVG icon grid, no emojis, all clickable */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-2 font-semibold uppercase tracking-wide">{t('common.category')}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {categories.map(cat => {
                        const isSelected = selectedCat === cat.id;
                        const catInfo = getCategoryInfo(cat.id, txType);
                        return (
                          <label key={cat.id} className="cursor-pointer">
                            <input type="radio" value={cat.id} className="sr-only"
                              {...register('category', { required: t('transactions.categoryRequired') })} />
                            <div className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                              isSelected
                                ? 'border-pw-gold/45 bg-pw-gold-dim'
                                : 'border-white/[0.07] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]'
                            }`}>
                              <div style={{ color: isSelected ? '#F5B731' : cat.color }}>
                                <CategoryIcon id={cat.id} size={18} color={isSelected ? '#F5B731' : cat.color} />
                              </div>
                              <span className={`text-[9px] font-semibold text-center leading-tight ${isSelected ? 'text-pw-gold' : 'text-pw-muted'}`}>
                                {catInfo.label}
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
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('transactions.descriptionOptional')} <span className="normal-case text-pw-muted/60">({t('common.optional')})</span></label>
                    <input type="text"
                      placeholder={txType === 'expense' ? t('transactions.descriptionPlaceholderExpense') : t('transactions.descriptionPlaceholderIncome')}
                      className="input-glass" {...register('description')} />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('common.date')}</label>
                    <input type="date" className="input-glass"
                      max={new Date().toISOString().slice(0, 10)}
                      {...register('date', { required: t('transactions.dateRequired') })} />
                  </div>

                  {/* Receipt photo (optional) */}
                  <div>
                    <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">
                      {t('transactions.receipt')} <span className="normal-case text-pw-muted/60">({t('common.optional')})</span>
                    </label>
                    {receiptPreview ? (
                      <div className="flex items-center gap-3">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                          <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setReceiptPreview(null)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white">
                            <HiXMark className="w-3 h-3" />
                          </button>
                        </div>
                        <button type="button" onClick={handleScanReceipt} disabled={scanningReceipt}
                          className="btn-secondary py-2 px-3 text-xs gap-1.5 flex-shrink-0 disabled:opacity-50">
                          {scanningReceipt
                            ? <span className="w-3.5 h-3.5 rounded-full border-2 border-pw-muted border-t-transparent animate-spin" />
                            : <HiSparkles className="w-3.5 h-3.5 text-pw-gold" />}
                          {scanningReceipt ? t('transactions.scanning') : t('transactions.scanWithAi')}
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-dashed border-white/15 text-pw-muted text-sm cursor-pointer hover:border-white/25 hover:text-white/80 transition-all">
                        {compressing ? (
                          <span className="w-4 h-4 rounded-full border-2 border-pw-muted border-t-transparent animate-spin" />
                        ) : (
                          <HiCamera className="w-4 h-4" />
                        )}
                        {compressing ? t('transactions.processing') : t('transactions.uploadPhoto')}
                        <input type="file" accept="image/*" capture="environment" className="hidden"
                          onChange={handleReceiptSelect} disabled={compressing} />
                      </label>
                    )}
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full mt-1">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                        {t('transactions.saving')}
                      </span>
                    ) : (txType === 'income' ? t('transactions.saveIncome') : t('transactions.saveExpense'))}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Receipt Lightbox ── */}
      <AnimatePresence>
        {viewingReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-6"
            onClick={() => setViewingReceipt(null)}>
            <button onClick={() => setViewingReceipt(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">
              <HiXMark className="w-5 h-5" />
            </button>
            <img src={viewingReceipt} alt={t('transactions.receipt')} className="max-w-full max-h-full rounded-2xl" onClick={e => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
