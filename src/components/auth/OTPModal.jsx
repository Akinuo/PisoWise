// src/components/auth/OTPModal.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiXMark, HiEnvelope, HiShieldCheck, HiLockClosed, HiCheckCircle } from 'react-icons/hi2';
import { initiateOTPVerification } from '../../services/emailjs';
import { storeOTPToken, verifyOTPToken } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/* ── Envelope SVG icon (replaces emoji) ─ */
function EnvelopeIcon({ size = 28, color = '#3B82F6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="1.5"/>
      <path d="M2 8l10 6 10-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Shield lock SVG ─ */
function ShieldIcon({ size = 28, color = '#F5B731' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6L12 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Key SVG ─ */
function KeyIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" stroke={color} strokeWidth="1.5"/>
      <path d="M13.5 13.5L21 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 18l-2-2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function OTPModal({ isOpen, onClose, onVerified, purpose = 'add a card' }) {
  const { user, profile } = useAuth();
  const [step,    setStep]    = useState('send');
  const [otp,     setOtp]     = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer,   setTimer]   = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const reset = () => { setStep('send'); setOtp(['', '', '', '', '', '']); setLoading(false); setTimer(0); };
  const handleClose = () => { reset(); onClose(); };

  /* ── Send OTP ── */
  const sendOTP = async () => {
    if (!user?.email) { toast.error('No email found. Update your profile.'); return; }
    setLoading(true);
    try {
      const code = await initiateOTPVerification({
        userEmail: user.email,
        userName:  profile?.displayName || user.displayName || 'PisoWise User',
        purpose,
      });
      await storeOTPToken(user.uid, code);
      setStep('verify');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      toast.success(`Code sent to ${user.email}`);
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to send code. Check EmailJS settings.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Verify ── */
  const doVerify = async (code) => {
    setLoading(true);
    try {
      const valid = await verifyOTPToken(user.uid, code);
      if (!valid) {
        toast.error('Incorrect or expired code. Try again.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }
      setStep('success');
      setTimeout(() => { onVerified(); handleClose(); }, 1100);
    } catch (e) {
      console.error(e);
      toast.error('Verification error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits.'); return; }
    doVerify(code);
  };

  /* ── Input ── */
  const handleDigit = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < 5) setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
    if (digit && idx === 5) {
      const full = next.join('');
      if (full.length === 6) setTimeout(() => doVerify(full), 120);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) { const next = [...otp]; next[idx] = ''; setOtp(next); }
      else if (idx > 0) inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter') verifyOTP();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const next = ['', '', '', '', '', ''];
    digits.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
    if (digits.length === 6) setTimeout(() => doVerify(digits), 120);
  };

  /* ── Render ── */
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.93, y: 20  }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed inset-x-4 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[400px]"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(10,18,35,0.98)',
                backdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.70), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                padding: '24px 24px 28px',
              }}
            >
              {/* Ambient glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 68%)' }} />

              {/* Close btn */}
              <button onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-pw-muted hover:text-white transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <HiXMark className="w-4 h-4" />
              </button>

              <AnimatePresence mode="wait">

                {/* ── Step: Send ── */}
                {step === 'send' && (
                  <motion.div key="send"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}>

                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)' }}>
                      <EnvelopeIcon size={26} color="#3B82F6" />
                    </div>

                    <h2 className="font-display text-2xl text-white mb-1.5">Verify Your Identity</h2>
                    <p className="text-pw-muted text-sm mb-1 leading-relaxed">
                      To {purpose}, we'll send a 6-digit code to:
                    </p>
                    <p className="text-white font-semibold text-sm mb-5 truncate">{user?.email}</p>

                    {/* Security note */}
                    <div className="flex items-start gap-2.5 rounded-2xl p-3 mb-5"
                      style={{ background: 'rgba(245,183,49,0.07)', border: '1px solid rgba(245,183,49,0.15)' }}>
                      <div className="flex-shrink-0 mt-0.5">
                        <KeyIcon size={13} color="#F5B731" />
                      </div>
                      <p className="text-xs text-white/65 leading-relaxed">
                        <strong className="text-white/90">Security:</strong> PisoWise never stores full card numbers, CVV, or expiry dates. Only the last 4 digits are saved.
                      </p>
                    </div>

                    <button onClick={sendOTP} disabled={loading} className="btn-primary w-full"
                      style={{ paddingTop: 14, paddingBottom: 14, fontSize: 15, borderRadius: 16 }}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <EnvelopeIcon size={15} color="#080E1F" />
                          Send Verification Code
                        </span>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* ── Step: Verify ── */}
                {step === 'verify' && (
                  <motion.div key="verify"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}>

                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: 'rgba(245,183,49,0.10)', border: '1px solid rgba(245,183,49,0.22)' }}>
                      <ShieldIcon size={26} color="#F5B731" />
                    </div>

                    <h2 className="font-display text-2xl text-white mb-1.5">Enter Your Code</h2>
                    <p className="text-pw-muted text-sm mb-5">
                      Sent to <strong className="text-white/90">{user?.email}</strong> — check inbox and spam.
                    </p>

                    {/* 6-digit OTP boxes */}
                    <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => inputRefs.current[idx] = el}
                          type="text" inputMode="numeric" maxLength={1}
                          value={digit}
                          onChange={e => handleDigit(idx, e.target.value)}
                          onKeyDown={e => handleKeyDown(idx, e)}
                          className="text-center font-mono font-bold rounded-2xl outline-none transition-all duration-150 cursor-text"
                          style={{
                            width: '44px', height: '54px',
                            fontSize: '22px',
                            background:  digit ? 'rgba(245,183,49,0.11)' : 'rgba(255,255,255,0.04)',
                            border:      `1.5px solid ${digit ? 'rgba(245,183,49,0.48)' : 'rgba(255,255,255,0.09)'}`,
                            color:       '#ffffff',
                            boxShadow:   digit ? '0 0 16px rgba(245,183,49,0.18)' : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={verifyOTP}
                      disabled={loading || otp.join('').length !== 6}
                      className="btn-primary w-full mb-4"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                          Verifying…
                        </span>
                      ) : 'Verify Code'}
                    </button>

                    <div className="text-center">
                      {timer > 0
                        ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-pw-muted border-t-white/40 animate-spin" style={{ width: 14, height: 14 }} />
                            <p className="text-pw-muted text-sm">Resend in <strong className="text-white/70 font-mono">{timer}s</strong></p>
                          </div>
                        ) : (
                          <button onClick={sendOTP} disabled={loading}
                            className="text-pw-blue-light text-sm hover:underline cursor-pointer disabled:opacity-50">
                            Resend Code
                          </button>
                        )
                      }
                    </div>
                  </motion.div>
                )}

                {/* ── Step: Success ── */}
                {step === 'success' && (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }}
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <HiCheckCircle className="w-8 h-8 text-pw-emerald" />
                    </motion.div>
                    <h2 className="font-display text-2xl text-white mb-1.5">Verified!</h2>
                    <p className="text-pw-muted text-sm">Identity confirmed. Continuing…</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
