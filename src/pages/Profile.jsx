// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { calculateHealthScore, getHealthScoreInfo, formatPeso, getPercent } from '../utils/formatters';
import { requestFCMPermission } from '../services/firebase';
import toast from 'react-hot-toast';
import {
  HiUser, HiEnvelope, HiBanknotes, HiBell,
  HiArrowRightOnRectangle, HiPencil, HiCheckCircle,
  HiShieldCheck, HiDevicePhoneMobile, HiChartBar,
  HiAcademicCap, HiCreditCard,
} from 'react-icons/hi2';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';

export default function Profile() {
  const { user, profile, logout, updateProfile } = useAuth();
  const { savings, debts, transactions, cards, reset: resetStore,
          getMonthlyStats, getTotalSavings, getTotalDebt } = useStore();

  const [editing, setEditing]     = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [fcmEnabled, setFcmEnabled] = useState(false);

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
  }, [profile, editing]);

  const onSave = async (data) => {
    setSaving(true);
    try {
      await updateProfile({
        displayName:   data.displayName.trim(),
        monthlyIncome: Number(data.monthlyIncome) || 0,
      });
      toast.success('Profile na-update!');
      setEditing(false);
    } catch { toast.error('Hindi na-save. Subukan ulit.'); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (!confirm('Sigurado kang mag-logout?')) return;
    resetStore();
    await logout();
    toast.success('Nag-logout na. Hanggang sa muli!');
  };

  const enableNotifications = async () => {
    if (!user) return;
    try {
      const token = await requestFCMPermission(user.uid);
      if (token) { setFcmEnabled(true); toast.success('Naka-on na ang notifications!'); }
      else toast.error('Hindi maaaring i-enable ang notifications.');
    } catch { toast.error('Notifications permission denied.'); }
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
            <h1 className="font-display text-2xl font-bold text-white">Profile</h1>
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
                  {profile?.displayName || 'PisoWise User'}
                </h2>
                <p className="text-pw-muted text-sm truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-pw-emerald" />
                  <span className="text-[10px] text-pw-muted">Member ng PisoWise</span>
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
                  <label className="block text-xs text-pw-muted mb-1.5">Buong Pangalan</label>
                  <div className="relative">
                    <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
                    <input type="text" className="input-glass pl-10"
                      {...register('displayName', { required: true, minLength: 2 })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-pw-muted mb-1.5">Buwanang Kita (para sa AI)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pw-gold font-bold text-sm">₱</span>
                    <input type="number" min="0" className="input-glass pl-8"
                      {...register('monthlyIncome', { min: 0 })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1 py-2">Kanselahin</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-2">
                    {saving ? 'Sine-save...' : 'I-save'}
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
              <p className="text-xs text-pw-muted mb-0.5">Financial Health Score</p>
              <p className="font-display text-xl font-bold" style={{ color: scoreInfo.color }}>
                {scoreInfo.label} {scoreInfo.emoji}
              </p>
              <p className="text-pw-muted text-xs mt-0.5">{scoreInfo.desc}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div>
            <p className="section-title">Istatistika</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: HiChartBar,       label: 'Transaksyon',      value: transactions.length,   color: '#3B82F6' },
                { icon: HiBanknotes,      label: 'Savings Goals',    value: savings.length,        color: '#10B981' },
                { icon: HiShieldCheck,    label: 'Aktibong Utang',   value: debts.filter(d => d.remainingAmount > 0).length, color: '#F43F5E' },
                { icon: HiCreditCard,     label: 'Mga Card',         value: cards.length,          color: '#F7C13A' },
                { icon: HiAcademicCap,    label: 'Aralin Tapos',     value: completedLessons,      color: '#8B5CF6' },
                { icon: HiBanknotes,      label: 'Kabuuang Ipon',    value: formatPeso(totalSavings, 0), color: '#10B981', isText: true },
              ].map(({ icon: Icon, label, value, color, isText }) => (
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
            <p className="section-title">Mga Setting</p>
            <div className="glass overflow-hidden">
              {[
                {
                  icon: HiBell, label: 'Push Notifications',
                  desc: fcmEnabled ? 'Naka-enable na' : 'I-enable para sa mga reminders',
                  action: enableNotifications,
                  badge: fcmEnabled ? 'ON' : null,
                },
                {
                  icon: HiDevicePhoneMobile, label: 'Android App',
                  desc: 'I-download ang APK para sa Android',
                  action: () => toast('See SETUP.md for Android build instructions.'),
                },
                {
                  icon: HiShieldCheck, label: 'Privacy & Security',
                  desc: 'Ang iyong data ay naka-encrypt at ligtas',
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
                      I-enable
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
              <p className="text-pw-muted text-xs">Email:</p>
              <p className="text-white text-xs truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HiShieldCheck className="w-4 h-4 text-pw-emerald flex-shrink-0" />
              <p className="text-xs text-pw-muted">Verified account · Firebase Auth</p>
            </div>
          </div>

          {/* Logout */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-pw-rose border border-pw-rose/20 bg-pw-rose-dim hover:bg-pw-rose/20 transition-all text-sm font-semibold mb-6">
            <HiArrowRightOnRectangle className="w-4 h-4" />
            Mag-Logout
          </motion.button>

          {/* App Version */}
          <p className="text-center text-pw-muted text-xs pb-4">
            PisoWise v1.0.0 · Powered by Groq Llama 3.3 70B · Made with ❤️ para sa mga Pilipino 🇵🇭
          </p>
        </motion.div>
      </div>
    </div>
  );
}
