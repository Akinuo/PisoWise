// src/components/transactions/RecurringBills.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { useTranslation } from '../../i18n/useTranslation';
import {
  addTransaction, addRecurringTransaction, getRecurringTransactions,
  updateRecurringTransaction, deleteRecurringTransaction, Timestamp,
} from '../../services/firebase';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryInfo } from '../../utils/constants';
import CategoryIcon from '../common/CategoryIcon';
import { formatPeso, parsePesoInput } from '../../utils/formatters';
import { advanceDueDate, getDueStatus, getDueLabel, getFrequencyLabel } from '../../utils/recurring';
import toast from 'react-hot-toast';
import {
  HiArrowPath, HiPlus, HiXMark, HiTrash, HiCheckCircle, HiBellAlert,
} from 'react-icons/hi2';

export default function RecurringBills() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const {
    recurringTransactions, setRecurringTransactions, recurringTransactionsLoaded,
    addRecurringLocal, updateRecurringLocal, removeRecurringLocal, addTransactionLocal,
  } = useStore((s) => ({
    recurringTransactions: s.recurringTransactions,
    setRecurringTransactions: s.setRecurringTransactions,
    recurringTransactionsLoaded: s.recurringTransactionsLoaded,
    addRecurringLocal: s.addRecurringLocal,
    updateRecurringLocal: s.updateRecurringLocal,
    removeRecurringLocal: s.removeRecurringLocal,
    addTransactionLocal: s.addTransactionLocal,
  }), shallow);

  const [showManage, setShowManage] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [txType, setTxType] = useState('expense');
  const [markingPaid, setMarkingPaid] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { frequency: 'monthly', nextDueDate: new Date().toISOString().slice(0, 10) },
  });
  const selectedCat = watch('category');
  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Fetch once per user session — see Dashboard.jsx for why deps stay [user] only.
  useEffect(() => {
    if (!user || recurringTransactionsLoaded) return;
    getRecurringTransactions(user.uid).then(setRecurringTransactions).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const active = recurringTransactions.filter(r => r.active !== false);
  const dueOrOverdue = active
    .filter(r => getDueStatus(r.nextDueDate) !== 'upcoming')
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));

  const onAddSubmit = async (data) => {
    if (!user) return;
    const amount = parsePesoInput(data.amount);
    if (amount <= 0) { toast.error(t('recurring.amountInvalid')); return; }
    try {
      const payload = {
        type: txType,
        amount,
        category: data.category,
        description: data.description?.trim() || '',
        frequency: data.frequency,
        nextDueDate: data.nextDueDate,
      };
      const ref = await addRecurringTransaction(user.uid, payload);
      addRecurringLocal({ id: ref.id, userId: user.uid, ...payload, active: true, createdAt: Timestamp.now() });
      toast.success(t('recurring.added'));
      reset({ frequency: 'monthly', nextDueDate: new Date().toISOString().slice(0, 10) });
      setShowAddForm(false);
    } catch {
      toast.error(t('recurring.saveFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('recurring.confirmDelete'))) return;
    try {
      await deleteRecurringTransaction(id);
      removeRecurringLocal(id);
      toast.success(t('recurring.deleted'));
    } catch { toast.error(t('recurring.deleteFailed')); }
  };

  const handleMarkPaid = async (r) => {
    if (!user) return;
    setMarkingPaid(r.id);
    try {
      const tx = {
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: r.description || '',
        date: Timestamp.fromDate(new Date()),
        note: t('recurring.fromRecurring'),
      };
      const ref = await addTransaction(user.uid, tx);
      addTransactionLocal({ id: ref.id, userId: user.uid, ...tx, createdAt: Timestamp.now() });

      const nextDue = advanceDueDate(r.nextDueDate, r.frequency);
      await updateRecurringTransaction(r.id, { nextDueDate: nextDue });
      updateRecurringLocal(r.id, { nextDueDate: nextDue });

      toast.success(r.type === 'income' ? t('recurring.incomeRecorded') : t('recurring.paid'));
    } catch {
      toast.error(t('recurring.recordFailed'));
    } finally {
      setMarkingPaid(null);
    }
  };

  return (
    <>
      {/* Due-soon / overdue banner — only shows when something needs attention */}
      {dueOrOverdue.length > 0 && (
        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HiBellAlert className="w-4 h-4 text-pw-amber" />
              <p className="text-sm font-semibold text-white">{t('recurring.upcomingBills')}</p>
            </div>
            <button onClick={() => setShowManage(true)} className="text-xs text-pw-blue-light font-medium">
              {t('recurring.manage')}
            </button>
          </div>
          <div className="space-y-2">
            {dueOrOverdue.map(r => {
              const cat = getCategoryInfo(r.category, r.type);
              const status = getDueStatus(r.nextDueDate);
              return (
                <div key={r.id} className="flex items-center gap-2.5">
                  <div className="icon-box-sm flex-shrink-0" style={{ background: `${cat.color}18` }}>
                    <CategoryIcon id={r.category} size={14} color={cat.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{r.description || cat.label}</p>
                    <p className={`text-[11px] mt-0.5 ${status === 'overdue' ? 'text-pw-rose' : 'text-pw-amber'}`}>
                      {getDueLabel(r.nextDueDate)} · {formatPeso(r.amount, 0)}
                    </p>
                  </div>
                  <button onClick={() => handleMarkPaid(r)} disabled={markingPaid === r.id}
                    className="btn-secondary py-1.5 px-2.5 text-[11px] flex-shrink-0 gap-1">
                    {markingPaid === r.id
                      ? <span className="w-3 h-3 rounded-full border-2 border-pw-muted border-t-transparent animate-spin" />
                      : <HiCheckCircle className="w-3.5 h-3.5" />}
                    {t('recurring.paidButton')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manage link when nothing's due but bills exist */}
      {dueOrOverdue.length === 0 && active.length > 0 && (
        <button onClick={() => setShowManage(true)}
          className="flex items-center gap-2 text-xs text-pw-muted hover:text-white transition-colors">
          <HiArrowPath className="w-3.5 h-3.5" /> {t('recurring.manageWithCount', { count: active.length })}
        </button>
      )}
      {active.length === 0 && (
        <button onClick={() => setShowManage(true)}
          className="flex items-center gap-2 text-xs text-pw-muted hover:text-white transition-colors">
          <HiArrowPath className="w-3.5 h-3.5" /> {t('recurring.setUp')}
        </button>
      )}

      {/* ── Manage Modal ── */}
      <AnimatePresence>
        {showManage && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
              onClick={() => { setShowManage(false); setShowAddForm(false); }} />
            <motion.div
              initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl"
              style={{ maxHeight: '90dvh' }}>
              <div className="overflow-y-auto sheet-modal px-5 pt-5"
                style={{ background: 'rgba(10,18,35,0.98)', backdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', maxHeight: '90dvh' }}>

                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-bold text-white">{t('recurring.title')}</h2>
                  <button onClick={() => { setShowManage(false); setShowAddForm(false); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-pw-muted hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <HiXMark className="w-4 h-4" />
                  </button>
                </div>

                {!showAddForm ? (
                  <>
                    {active.length === 0 ? (
                      <p className="text-pw-muted text-sm text-center py-6">{t('recurring.noneYet')}</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {[...active].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)).map(r => {
                          const cat = getCategoryInfo(r.category, r.type);
                          return (
                            <div key={r.id} className="glass-sm p-3 flex items-center gap-3">
                              <div className="icon-box-sm flex-shrink-0" style={{ background: `${cat.color}18` }}>
                                <CategoryIcon id={r.category} size={14} color={cat.color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{r.description || cat.label}</p>
                                <p className="text-pw-muted text-xs mt-0.5">
                                  {getFrequencyLabel(r.frequency)} · {formatPeso(r.amount, 0)} · {getDueLabel(r.nextDueDate)}
                                </p>
                              </div>
                              <button onClick={() => handleDelete(r.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-pw-muted hover:text-pw-rose hover:bg-pw-rose-dim flex-shrink-0">
                                <HiTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button onClick={() => setShowAddForm(true)} className="btn-primary w-full">
                      <HiPlus className="w-4 h-4" /> {t('recurring.addNew')}
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4 pb-2">
                    <div className="flex gap-2">
                      {[
                        { type: 'expense', label: t('common.expense'), color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
                        { type: 'income',  label: t('common.income'),  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
                      ].map(({ type, label, color, bg }) => (
                        <button key={type} type="button" onClick={() => setTxType(type)}
                          className="flex-1 py-2.5 rounded-2xl font-semibold text-sm transition-all"
                          style={{
                            background: txType === type ? bg : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${txType === type ? color + '48' : 'rgba(255,255,255,0.08)'}`,
                            color: txType === type ? color : 'rgba(255,255,255,0.42)',
                          }}>
                          {label}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('common.amount')}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-lg">₱</span>
                        <input type="number" placeholder="0.00" step="0.01" min="0" inputMode="decimal"
                          className="input-glass pl-9 text-lg font-bold"
                          {...register('amount', { required: t('transactions.amountRequired'), min: { value: 0.01, message: t('transactions.amountPositive') } })} />
                      </div>
                      {errors.amount && <p className="text-pw-rose text-xs mt-1.5">{errors.amount.message}</p>}
                    </div>

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
                                isSelected ? 'border-pw-gold/45 bg-pw-gold-dim' : 'border-white/[0.07] bg-white/[0.03]'
                              }`}>
                                <CategoryIcon id={cat.id} size={16} color={isSelected ? '#F5B731' : cat.color} />
                                <span className={`text-[9px] font-semibold text-center leading-tight ${isSelected ? 'text-pw-gold' : 'text-pw-muted'}`}>
                                  {catInfo.label}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      {errors.category && <p className="text-pw-rose text-xs mt-1.5">{errors.category.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">
                        {t('transactions.descriptionOptional')} <span className="normal-case text-pw-muted/60">({t('common.optional')})</span>
                      </label>
                      <input type="text" placeholder={t('recurring.descriptionPlaceholder')}
                        className="input-glass" {...register('description')} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('recurring.frequency')}</label>
                        <select className="input-glass text-sm" {...register('frequency')}>
                          <option value="weekly">{t('recurring.weekly')}</option>
                          <option value="monthly">{t('recurring.monthly')}</option>
                          <option value="yearly">{t('recurring.yearly')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('recurring.firstDeadline')}</label>
                        <input type="date" className="input-glass"
                          {...register('nextDueDate', { required: t('recurring.dateRequired') })} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">{t('recurring.back')}</button>
                      <button type="submit" className="btn-primary flex-1">{t('recurring.save')}</button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
