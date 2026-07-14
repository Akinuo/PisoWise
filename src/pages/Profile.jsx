// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { shallow } from 'zustand/shallow';
import { useTranslation } from '../i18n/useTranslation';
import { calculateHealthScore, getHealthScoreInfo, formatPeso } from '../utils/formatters';
import { getTransactions, getSavingsGoals, getDebts, getCards, getInsights, getRecurringTransactions } from '../services/firebase';
import { exportFullBackup } from '../utils/dataBackup';
import { THEMES, applyTheme, getStoredTheme } from '../utils/theme';
import toast from 'react-hot-toast';
import {
  HiUser, HiEnvelope, HiBanknotes,
  HiArrowRightOnRectangle, HiPencil,
  HiShieldCheck, HiDevicePhoneMobile, HiChartBar,
  HiAcademicCap, HiCreditCard, HiArrowDownTray, HiSwatch, HiLanguage,
} from 'react-icons/hi2';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

export default function Profile() {
  const { user, profile, logout, updateProfile } = useAuth();
  const { savings, debts, transactions, cards, reset: resetStore, getMonthlyStats, getTotalSavings, getTotalDebt, language, setLanguage } = useStore((s) => ({ savings: s.savings, debts: s.debts, transactions: s.transactions, cards: s.cards, reset: s.reset, getMonthlyStats: s.getMonthlyStats, getTotalSavings: s.getTotalSavings, getTotalDebt: s.getTotalDebt, language: s.language, setLanguage: s.setLanguage, }), shallow);
  const { t } = useTranslation();

  const [editing, setEditing]     = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => getStoredTheme());
  const [backingUp, setBackingUp] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const now  = new Date();
  const { month, year } = { month: now.getMonth() + 1, year: now.getFullYear() };
  const stats       = getMonthlyStats(year, month);
  const totalSavings = getTotalSavings();
  const totalDebt   = getTotalDebt();
  const monthlyIncome = profile?.monthlyIncome || stats.income || 0;

  const healthScore = calculateHealthScore({
    monthlyIncome, monthlyExpenses: stats.expenses,
    totalSavings, totalDebt, savingsGoals: savings, debts,
  });
  const scoreInfo = getHealthScoreInfo(healthScore);

  useEffect(() => {
    if (profile && editing) {
      setValue('displayName',    profile.displayName || '');
      setValue('monthlyIncome',  String(profile.monthlyIncome || ''));
    }
  }, [profile, editing, setValue]);

  const onSave = async (data) => {
    setSaving(true);
    try {
      await updateProfile({
        displayName:   data.displayName.trim(),
        monthlyIncome: Number(data.monthlyIncome) || 0,
      });
      toast.success(t('profile.updated'));
      setEditing(false);
    } catch { toast.error(t('profile.updateFailed')); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (!confirm(t('profile.confirmLogout'))) return;
    resetStore();
    await logout();
    toast.success(t('profile.loggedOut'));
  };

  const handleThemeChange = (themeId) => {
    applyTheme(themeId);
    setCurrentTheme(themeId);
  };

  const handleBackup = async () => {
    if (!user) return;
    setBackingUp(true);
    try {
      const [txs, savingsGoals, userDebts, userCards, userInsights, recurring] = await Promise.all([
        getTransactions(user.uid, 5000),
        getSavingsGoals(user.uid),
        getDebts(user.uid),
        getCards(user.uid),
        getInsights(user.uid, 100),
        getRecurringTransactions(user.uid),
      ]);
      exportFullBackup({
        profile, transactions: txs, savings: savingsGoals, debts: userDebts,
        cards: userCards, recurringTransactions: recurring, insights: userInsights,
      });
      toast.success(t('profile.backupSuccess'));
    } catch {
      toast.error(t('profile.backupFailed'));
    } finally {
      setBackingUp(false);
    }
  };

  const completedLessons = (() => {
    try { return JSON.parse(localStorage.getItem('pw_completed_lessons') || '[]').length; } catch { return 0; }
  })();

  const firstName = profile?.displayName?.split(' ')[0] || 'User';

  return (
    <div className="page">
      <div className="page-content">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Header */}
          <div className="pt-2">
            <h1 className="font-display text-2xl font-bold text-white">{t('profile.title')}</h1>
          </div>

          {/* Profile Card */}
          <div className="glass p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pw-blue to-pw-blue-light flex items-center justify-center text-2xl font-display font-black text-white flex-shrink-0"
                style={{ boxShadow: '0 0 24px rgba(59,130,246,0.4)' }}>
                {firstName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold text-white truncate">
                  {profile?.displayName || t('profile.defaultUser')}
                </h2>
                <p className="text-pw-muted text-sm truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-pw-emerald" />
                  <span className="text-[10px] text-pw-muted">{t('profile.memberOf')}</span>
                </div>
              </div>
              <button onClick={() => setEditing(v => !v)}
                className="w-9 h-9 rounded-2xl bg-pw-subtle flex items-center justify-center text-pw-muted hover:text-white transition-all flex-shrink-0">
                <HiPencil className="w-4 h-4" />
              </button>
            </div>

            {/* Edit Form */}
            {editing && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSubmit(onSave)} className="space-y-3 pt-3 border-t border-white/06">
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">{t('profile.fullName')}</label>
                  <div className="relative">
                    <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
                    <input type="text" className="input-glass pl-10"
                      {...register('displayName', { required: t('profile.nameRequired'), minLength: { value: 2, message: t('profile.nameMinLength') } })} />
                  </div>
                  {errors.displayName && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.displayName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">{t('profile.monthlyIncomeLabel')}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                    <input type="number" min="0" className="input-glass pl-8"
                      {...register('monthlyIncome', { min: { value: 0, message: t('profile.incomePositive') } })} />
                  </div>
                  {errors.monthlyIncome && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.monthlyIncome.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 py-2">{t('common.cancel')}</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-2">
                    {saving ? t('profile.saving') : t('common.save')}
                  </button>
                </div>
              </motion.form>
            )}
          </div>

          {/* Health Score */}
          <div className="glass p-4 flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0">
              <CircularProgressbar value={healthScore} text={`${healthScore}`}
                styles={buildStyles({
                  textSize:  '28px',
                  textColor: scoreInfo.color,
                  pathColor: scoreInfo.color,
                  trailColor: 'rgba(255,255,255,0.06)',
                })} />
            </div>
            <div>
              <p className="text-xs text-pw-muted mb-0.5">{t('profile.healthScoreLabel')}</p>
              <p className="font-display text-xl font-bold" style={{ color: scoreInfo.color }}>
                {scoreInfo.label} {scoreInfo.emoji}
              </p>
              <p className="text-pw-muted text-xs mt-0.5">{scoreInfo.desc}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div>
            <p className="section-title">{t('profile.statistics')}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: HiChartBar,       label: t('profile.transactionsCount'),  value: transactions.length,   color: '#3B82F6' },
                { icon: HiBanknotes,      label: t('profile.savingsGoalsCount'),  value: savings.length,        color: '#10B981' },
                { icon: HiShieldCheck,    label: t('profile.activeDebts'),        value: debts.filter(d => d.remainingAmount > 0).length, color: '#F43F5E' },
                { icon: HiCreditCard,     label: t('profile.cardsCount'),         value: cards.length,          color: '#F7C13A' },
                { icon: HiAcademicCap,    label: t('profile.lessonsDone'),        value: completedLessons,      color: '#8B5CF6' },
                { icon: HiBanknotes,      label: t('profile.totalSavingsLabel'),  value: formatPeso(totalSavings, 0), color: '#10B981' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="glass-sm p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color }}>{value}</p>
                    <p className="text-pw-muted text-[10px] truncate">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <p className="section-title">{t('profile.settings')}</p>
            <div className="glass overflow-hidden">
              {/* Language switcher */}
              <div className="flex items-center gap-3 p-4 border-b border-white/05">
                <div className="w-9 h-9 rounded-2xl bg-pw-subtle flex items-center justify-center flex-shrink-0">
                  <HiLanguage className="w-4 h-4 text-pw-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{t('profile.language')}</p>
                  <p className="text-pw-muted text-xs">{t('profile.languageDesc')}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 bg-white/5 rounded-full p-1">
                  <button onClick={() => setLanguage('fil')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      language === 'fil' ? 'bg-pw-gold text-pw-navy' : 'text-pw-muted'
                    }`}>
                    Fil
                  </button>
                  <button onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      language === 'en' ? 'bg-pw-gold text-pw-navy' : 'text-pw-muted'
                    }`}>
                    EN
                  </button>
                </div>
              </div>

              {/* Theme picker */}
              <div className="flex items-center gap-3 p-4 border-b border-white/05">
                <div className="w-9 h-9 rounded-2xl bg-pw-subtle flex items-center justify-center flex-shrink-0">
                  <HiSwatch className="w-4 h-4 text-pw-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{t('profile.accentColor')}</p>
                  <p className="text-pw-muted text-xs">{t('profile.accentColorDesc')}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {THEMES.map(th => (
                    <button key={th.id} onClick={() => handleThemeChange(th.id)}
                      aria-label={th.label}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-transform"
                      style={{
                        background: th.color,
                        border: currentTheme === th.id ? '2px solid white' : '2px solid transparent',
                        transform: currentTheme === th.id ? 'scale(1.1)' : 'scale(1)',
                      }} />
                  ))}
                </div>
              </div>

              {/* Data backup */}
              <div className="flex items-center gap-3 p-4 border-b border-white/05">
                <div className="w-9 h-9 rounded-2xl bg-pw-subtle flex items-center justify-center flex-shrink-0">
                  <HiArrowDownTray className="w-4 h-4 text-pw-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{t('profile.backupTitle')}</p>
                  <p className="text-pw-muted text-xs truncate">{t('profile.backupDesc')}</p>
                </div>
                <button onClick={handleBackup} disabled={backingUp}
                  className="text-xs text-pw-blue-light hover:underline flex-shrink-0 disabled:opacity-50">
                  {backingUp ? t('profile.backupWorking') : t('profile.backupAction')}
                </button>
              </div>

              {[
                {
                  icon: HiDevicePhoneMobile, label: t('profile.androidApp'),
                  desc: t('profile.androidAppDesc'),
                  action: () => toast('See SETUP.md for Android build instructions.'),
                },
                {
                  icon: HiShieldCheck, label: t('profile.privacySecurity'),
                  desc: t('profile.privacySecurityDesc'),
                  action: null,
                },
              ].map(({ icon: Icon, label, desc, action, badge }, i, arr) => (
                <div key={label}
                  className={`flex items-center gap-3 p-4 ${i < arr.length - 1 ? 'border-b border-white/05' : ''}`}>
                  <div className="w-9 h-9 rounded-2xl bg-pw-subtle flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-pw-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-pw-muted text-xs truncate">{desc}</p>
                  </div>
                  {badge && <span className="label-emerald text-[10px]">{badge}</span>}
                  {action && (
                    <button onClick={action}
                      className="text-xs text-pw-blue-light hover:underline flex-shrink-0">
                      {t('profile.enable')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="glass-sm p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <HiEnvelope className="w-4 h-4 text-pw-muted flex-shrink-0" />
              <p className="text-pw-muted text-xs">{t('profile.email')}</p>
              <p className="text-white text-xs truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HiShieldCheck className="w-4 h-4 text-pw-emerald flex-shrink-0" />
              <p className="text-xs text-pw-muted">{t('profile.verifiedAccount')}</p>
            </div>
          </div>

          {/* Logout */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-pw-rose border border-pw-rose/20 bg-pw-rose-dim hover:bg-pw-rose/20 transition-all text-sm font-semibold mb-6">
            <HiArrowRightOnRectangle className="w-4 h-4" />
            {t('profile.logout')}
          </motion.button>

          {/* App Version */}
          <p className="text-center text-pw-muted text-xs pb-4">
            {t('profile.appFooter')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
