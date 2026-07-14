// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { HiEye, HiEyeSlash, HiEnvelope, HiLockClosed, HiUser } from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import toast from 'react-hot-toast';

export default function Register() {
  const { register: authRegister, googleSignIn } = useAuth();
  const { t } = useTranslation();
  const navigate                   = useNavigate();
  const [showPw, setShowPw]        = useState(false);
  const [loading, setLoading]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isBusy = loading || googleLoading;

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async ({ displayName, email, password, monthlyIncome }) => {
    setLoading(true);
    try {
      await authRegister(email, password, displayName, {
        monthlyIncome: Number(monthlyIncome) || 0,
      });
      toast.success(t('auth.welcomeToast', { name: displayName }));
      navigate('/', { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const user = await googleSignIn();
      toast.success(t('auth.welcomeToast', { name: user?.displayName || t('auth.friend') }));
      navigate('/', { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-pw">
      {/* Glow */}
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, var(--pw-gold) 0%, var(--pw-gold-bright) 100%)',
            color: '#080E1F',
            boxShadow: '0 8px 32px rgba(var(--pw-gold-rgb), 0.35)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          ₱
        </div>
        <h1 className="font-display text-3xl text-white leading-none mb-1.5">{t('auth.welcomeBack')}</h1>
        <p className="text-pw-muted text-sm font-medium">{t('auth.signupSubtitle')}</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass w-full max-w-sm p-6"
      >
        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isBusy}
          className="w-full h-12 rounded-2xl bg-white text-sm font-semibold flex items-center justify-center gap-3 transition-all hover:bg-gray-50 active:bg-gray-100 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
          style={{
            color: '#1a1a2e',
            border: '1px solid rgba(0,0,0,0.10)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          {googleLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
          ) : (
            <FcGoogle style={{ width: 18, height: 18, flexShrink: 0 }} />
          )}
          {t('auth.signupGoogle')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.09)' }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pw-muted">{t('auth.or')}</span>
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.09)' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('auth.fullName')}</label>
            <div className="relative">
              <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input
                type="text"
                placeholder={t('auth.fullNamePlaceholder')}
                autoComplete="name"
                className="input-glass pl-10"
                {...register('displayName', {
                  required: t('auth.nameRequired'),
                  minLength: { value: 2, message: t('auth.nameMinLength') },
                })}
              />
            </div>
            {errors.displayName && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.displayName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('auth.email')}</label>
            <div className="relative">
              <HiEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
                className="input-glass pl-10"
                {...register('email', {
                  required: t('auth.emailRequired'),
                  pattern: { value: /\S+@\S+\.\S+/, message: t('auth.emailInvalidLong') },
                })}
              />
            </div>
            {errors.email && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('auth.password')}</label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="new-password"
                className="input-glass pl-10 pr-11"
                {...register('password', {
                  required: t('auth.passwordRequired'),
                  minLength: { value: 6, message: t('auth.passwordMinLength') },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pw-muted hover:text-white transition-colors cursor-pointer"
              >
                {showPw
                  ? <HiEyeSlash className="w-4 h-4" />
                  : <HiEye className="w-4 h-4" />
                }
              </button>
            </div>
            {errors.password && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className="input-glass pl-10"
                {...register('confirmPassword', {
                  required: t('auth.confirmPasswordRequired'),
                  validate: v => v === password || t('auth.passwordsNoMatch'),
                })}
              />
            </div>
            {errors.confirmPassword && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.confirmPassword.message}</p>}
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">
              {t('auth.monthlyIncomeOptional')} <span className="normal-case font-normal text-pw-muted/60">({t('common.optional')})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pw-muted text-sm font-bold">₱</span>
              <input
                type="number"
                placeholder={t('auth.monthlyIncomePlaceholder')}
                min="0"
                inputMode="numeric"
                className="input-glass pl-8"
                {...register('monthlyIncome', { min: { value: 0, message: t('auth.incomePositive') } })}
              />
            </div>
            {errors.monthlyIncome && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.monthlyIncome.message}</p>}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="terms"
              className="mt-0.5 accent-pw-gold cursor-pointer"
              {...register('terms', { required: t('auth.termsRequired') })}
            />
            <label htmlFor="terms" className="text-xs text-pw-muted cursor-pointer leading-relaxed">
              {t('auth.agreeTerms')}{' '}
              <span className="text-pw-gold">{t('auth.termsOfService')}</span> {t('auth.and')}{' '}
              <span className="text-pw-gold">{t('auth.privacyPolicy')}</span>
            </label>
          </div>
          {errors.terms && <p className="text-pw-rose text-xs font-medium">{errors.terms.message}</p>}

          <button type="submit" disabled={isBusy} className="btn-primary w-full mt-1">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                {t('auth.creatingAccount')}
              </span>
            ) : t('auth.createAccount')}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-pw-muted text-sm">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-pw-gold font-semibold hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </motion.div>

      {/* Footer tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-pw-muted text-xs mt-6 text-center max-w-xs leading-relaxed"
      >
        {t('auth.tagline')}
      </motion.p>
    </div>
  );
}
