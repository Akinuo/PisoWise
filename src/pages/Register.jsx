// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { HiEye, HiEyeSlash, HiEnvelope, HiLockClosed, HiUser } from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register: authRegister, googleSignIn } = useAuth();
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
      toast.success(`Maligayang pagdating, ${displayName}! 🎉`);
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
      toast.success(`Maligayang pagdating, ${user.displayName || 'kaibigan'}!`);
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl font-display font-black mb-3"
          style={{ background: 'linear-gradient(135deg, #F7C13A, #F59E0B)', color: '#060D1F', boxShadow: '0 0 32px rgba(247,193,58,0.3)' }}>
          ₱
        </div>
        <h1 className="font-display text-2xl font-black text-white">Sumali sa PisoWise</h1>
        <p className="text-pw-muted text-sm mt-1">Magsimula sa matalinong pamamahala ng pera</p>
      </motion.div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass w-full max-w-sm p-6">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isBusy}
          className="w-full h-12 rounded-2xl border border-white/10 bg-white text-pw-navy font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
          ) : (
            <FcGoogle className="w-5 h-5" />
          )}
          Sign up with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pw-muted">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-medium">Buong Pangalan</label>
            <div className="relative">
              <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input type="text" placeholder="Juan dela Cruz" autoComplete="name"
                className="input-glass pl-10"
                {...register('displayName', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })} />
            </div>
            {errors.displayName && <p className="text-pw-rose text-xs mt-1">{errors.displayName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-medium">Email</label>
            <div className="relative">
              <HiEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input type="email" placeholder="ikaw@email.com" autoComplete="email"
                className="input-glass pl-10"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                })} />
            </div>
            {errors.email && <p className="text-pw-rose text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-medium">Password</label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                autoComplete="new-password" className="input-glass pl-10 pr-10"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'At least 6 characters required' },
                })} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pw-muted hover:text-white">
                {showPw ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-pw-rose text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-medium">Kumpirmahin ang Password</label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input type={showPw ? 'text' : 'password'} placeholder="Ulitin ang password"
                className="input-glass pl-10"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: v => v === password || 'Passwords do not match',
                })} />
            </div>
            {errors.confirmPassword && <p className="text-pw-rose text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-medium">
              Buwanang Kita (opsyonal — makakatulong sa AI)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pw-muted text-sm font-bold">₱</span>
              <input type="number" placeholder="15000" min="0"
                className="input-glass pl-8"
                {...register('monthlyIncome', { min: { value: 0, message: 'Must be positive' } })} />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" className="mt-0.5 accent-pw-gold"
              {...register('terms', { required: 'Please accept the terms' })} />
            <label htmlFor="terms" className="text-xs text-pw-muted">
              Sumasang-ayon ako sa{' '}
              <span className="text-pw-gold">Terms of Service</span> at{' '}
              <span className="text-pw-gold">Privacy Policy</span>
            </label>
          </div>
          {errors.terms && <p className="text-pw-rose text-xs">{errors.terms.message}</p>}

          <button type="submit" disabled={isBusy} className="btn-primary w-full mt-2">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                Gumagawa ng account...
              </span>
            ) : 'Gumawa ng Account'}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-pw-muted text-sm">
          May account na?{' '}
          <Link to="/login" className="text-pw-gold font-semibold hover:underline">
            Mag-login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
