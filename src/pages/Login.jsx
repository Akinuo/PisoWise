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
    if (!email) { toast.error('Ilagay muna ang iyong email.'); return; }
    try {
      await forgotPassword(email);
      toast.success('Naipadala na ang reset link!');
      setShowReset(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await googleSignIn();
      toast.success('Naka-sign in na gamit ang Google!');
      navigate('/', { replace: true });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 relative overflow-hidden bg-pw">
      {/* Ambient radial glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.06) 0%, transparent 68%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,183,49,0.04) 0%, transparent 68%)' }}
      />

      {/* Logo section */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4,0,0.2,1] }}
        className="flex flex-col items-center mb-8"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #F5B731 0%, #F59E0B 100%)',
            color: '#080E1F',
            boxShadow: '0 8px 32px rgba(245,183,49,0.35)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          ₱
        </div>
        <h1 className="font-display text-4xl text-white leading-none mb-1.5">PisoWise</h1>
        <p className="text-pw-muted text-sm font-medium">Mag-login sa inyong account</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.4,0,0.2,1] }}
        className="glass w-full max-w-sm p-6"
      >
        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
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
          Mag-login gamit ang Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.09)' }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pw-muted">o</span>
          <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.09)' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">Email</label>
            <div className="relative">
              <HiEnvelope
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pw-muted"
                style={{ width: 15, height: 15 }}
              />
              <input
                type="email"
                placeholder="ikaw@email.com"
                autoComplete="email"
                className="input-glass pl-10"
                {...register('email', {
                  required: 'Kinakailangan ang email',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Di-wastong email' },
                })}
              />
            </div>
            {errors.email && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-pw-muted mb-1.5 font-semibold uppercase tracking-wide">Password</label>
            <div className="relative">
              <HiLockClosed
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pw-muted"
                style={{ width: 15, height: 15 }}
              />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="input-glass pl-10 pr-11"
                {...register('password', { required: 'Kinakailangan ang password' })}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pw-muted hover:text-white transition-colors cursor-pointer"
              >
                {showPw
                  ? <HiEyeSlash style={{ width: 16, height: 16 }} />
                  : <HiEye style={{ width: 16, height: 16 }} />
                }
              </button>
            </div>
            {errors.password && <p className="text-pw-rose text-xs mt-1.5 font-medium">{errors.password.message}</p>}
          </div>

          {/* Forgot password */}
          <div className="text-right -mt-1">
            <button
              type="button"
              onClick={() => setShowReset(v => !v)}
              className="text-xs text-pw-blue-light hover:underline font-medium cursor-pointer"
            >
              Nakalimutan ang password?
            </button>
          </div>

          {showReset && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="glass-sm p-3.5"
            >
              <p className="text-xs text-pw-muted mb-2.5 leading-relaxed">
                Ipapadala ang reset link sa email na nasa itaas.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary text-xs py-2 w-full"
              >
                Ipadala ang Reset Link
              </button>
            </motion.div>
          )}

          <button type="submit" disabled={isBusy} className="btn-primary w-full mt-1">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                Nag-login…
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

      {/* Footer tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-pw-muted text-xs mt-6 text-center max-w-xs leading-relaxed"
      >
        &ldquo;Ang malaking ipon ay nagsisimula sa maliit na hakbang.&rdquo; 🇵🇭
      </motion.p>
    </div>
  );
}
