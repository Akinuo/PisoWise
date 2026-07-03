// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { HiEye, HiEyeSlash, HiEnvelope, HiLockClosed } from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, googleSignIn, forgotPassword } = useAuth();
  const navigate                  = useNavigate();
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const isBusy = loading || googleLoading;

  const { register, handleSubmit, getValues, formState: { errors } } = useForm();

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const email = getValues('email');
    if (!email) { toast.error('Enter your email above first.'); return; }
    try {
      await forgotPassword(email);
      toast.success('Password reset email sent!');
      setShowReset(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await googleSignIn();
      toast.success('Signed in with Google!');
      navigate('/', { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 relative overflow-hidden bg-pw">
      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(247,193,58,0.06) 0%, transparent 70%)' }} />

      {/* Philippine Sun background (subtle) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="absolute top-12 right-12 w-32 h-32 opacity-5 pointer-events-none"
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute inset-0 flex items-start justify-center"
            style={{ transform: `rotate(${i * 45}deg)` }}>
            <div className="w-1 h-10 bg-pw-gold rounded-full" />
          </div>
        ))}
        <div className="absolute inset-8 rounded-full bg-pw-gold" />
      </motion.div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl font-display font-black mb-3"
          style={{
            background:  'linear-gradient(135deg, #F7C13A, #F59E0B)',
            color:       '#060D1F',
            boxShadow:   '0 0 40px rgba(247,193,58,0.35)',
          }}
        >
          ₱
        </div>
        <h1 className="font-display text-3xl font-black text-white">PisoWise</h1>
        <p className="text-pw-muted text-sm mt-1">Mag-login sa inyong account</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass w-full max-w-sm p-6"
      >
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          className="w-full h-12 rounded-2xl border border-white/10 bg-white text-pw-navy font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
          ) : (
            <FcGoogle className="w-5 h-5" />
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-pw-muted">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-medium">Email</label>
            <div className="relative">
              <HiEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input
                type="email"
                placeholder="ikaw@email.com"
                autoComplete="email"
                className="input-glass pl-10"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                })}
              />
            </div>
            {errors.email && <p className="text-pw-rose text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-medium">Password</label>
            <div className="relative">
              <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-muted" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="input-glass pl-10 pr-10"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pw-muted hover:text-white"
              >
                {showPw ? <HiEyeSlash className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-pw-rose text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <button type="button" onClick={() => setShowReset(v => !v)}
              className="text-xs text-pw-blue-light hover:underline">
              Nakalimutan ang password?
            </button>
          </div>

          {showReset && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="glass-sm p-3">
              <p className="text-xs text-pw-muted mb-2">Send reset link to the email above.</p>
              <button type="button" onClick={handleReset} className="btn-secondary text-xs py-2 w-full">
                Send Reset Email
              </button>
            </motion.div>
          )}

          <button type="submit" disabled={isBusy} className="btn-primary w-full mt-2">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                Nag-login...
              </span>
            ) : 'Mag-login'}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-pw-muted text-sm">
          Wala pang account?{' '}
          <Link to="/register" className="text-pw-gold font-semibold hover:underline">
            Mag-sign up
          </Link>
        </p>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-pw-muted text-xs mt-6 text-center max-w-xs"
      >
        "Ang malaking ipon ay nagsisimula sa maliit na hakbang." 🇵🇭
      </motion.p>
    </div>
  );
}
