// src/components/auth/OTPModal.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiXMark, HiEnvelope, HiShieldCheck } from 'react-icons/hi2';
import { initiateOTPVerification } from '../../services/emailjs';
import { storeOTPToken, verifyOTPToken } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

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

  const reset = () => {
    setStep('send');
    setOtp(['', '', '', '', '', '']);
    setLoading(false);
    setTimer(0);
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const sendOTP = async () => {
    if (!user?.email) {
      toast.error('No email found. Please update your profile.');
      return;
    }
    setLoading(true);
    try {
      const otpCode = await initiateOTPVerification({
        userEmail: user.email,
        userName:  profile?.displayName || user.displayName || 'PisoWise User',
        purpose,
      });
      // storeOTPToken now writes to otpTokens/{userId} via setDoc — no ref returned
      await storeOTPToken(user.uid, otpCode);
      setStep('verify');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      toast.success(`Code sent to ${user.email}`);
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (e) {
      console.error('Send OTP error:', e);
      toast.error(e.message || 'Failed to send code. Check EmailJS settings.');
    } finally {
      setLoading(false);
    }
  };

  // ── Core verify logic (shared by button + auto-submit) ─────────────────────
  const doVerify = async (code) => {
    setLoading(true);
    try {
      const valid = await verifyOTPToken(user.uid, code);
      if (!valid) {
        toast.error('Incorrect or expired code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }
      setStep('success');
      setTimeout(() => { onVerified(); handleClose(); }, 1000);
    } catch (e) {
      console.error('Verify OTP error:', e);
      toast.error('Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits.'); return; }
    doVerify(code);
  };

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleDigit = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    if (digit && idx < 5) {
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 0);
    }
    // Auto-submit when last box filled
    if (digit && idx === 5) {
      const full = next.join('');
      if (full.length === 6) setTimeout(() => doVerify(full), 120);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) {
        const next = [...otp]; next[idx] = ''; setOtp(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
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
    const focus = Math.min(digits.length, 5);
    inputRefs.current[focus]?.focus();
    if (digits.length === 6) setTimeout(() => doVerify(digits), 120);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 24  }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[400px] z-50"
          >
            <div className="glass p-6 relative">
              <button onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-pw-muted hover:text-white hover:bg-pw-subtle transition-all">
                <HiXMark className="w-4 h-4" />
              </button>

              <AnimatePresence mode="wait">

                {step === 'send' && (
                  <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="w-14 h-14 rounded-2xl bg-pw-blue/20 border border-pw-blue/30 flex items-center justify-center mb-4">
                      <HiEnvelope className="w-7 h-7 text-pw-blue-light" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-white mb-2">Verify Your Identity</h2>
                    <p className="text-pw-muted text-sm mb-1">To {purpose}, we'll send a 6-digit code to:</p>
                    <p className="text-white font-semibold text-sm mb-5">{user?.email}</p>
                    <div className="glass-sm p-3 mb-5 text-xs text-pw-muted leading-relaxed">
                      🔒 <strong className="text-white">Security:</strong> PisoWise never stores full card numbers, CVV, or expiry dates. Only the last 4 digits are saved.
                    </div>
                    <button onClick={sendOTP} disabled={loading} className="btn-primary w-full">
                      {loading
                        ? <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                            Sending...
                          </span>
                        : 'Send Verification Code'}
                    </button>
                  </motion.div>
                )}

                {step === 'verify' && (
                  <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="w-14 h-14 rounded-2xl bg-pw-gold-dim border border-pw-gold/30 flex items-center justify-center mb-4">
                      <HiShieldCheck className="w-7 h-7 text-pw-gold" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-white mb-1">Enter Your Code</h2>
                    <p className="text-pw-muted text-sm mb-5">
                      Sent to <strong className="text-white">{user?.email}</strong> — check your inbox (and spam folder).
                    </p>

                    {/* 6-digit boxes */}
                    <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => inputRefs.current[idx] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleDigit(idx, e.target.value)}
                          onKeyDown={e => handleKeyDown(idx, e)}
                          className="w-11 text-center text-xl font-mono font-bold rounded-xl outline-none transition-all duration-150"
                          style={{
                            height:     '52px',
                            background:  digit ? 'rgba(247,193,58,0.12)' : 'rgba(255,255,255,0.05)',
                            border:      `1.5px solid ${digit ? 'rgba(247,193,58,0.5)' : 'rgba(255,255,255,0.10)'}`,
                            color:       '#ffffff',
                            boxShadow:   digit ? '0 0 14px rgba(247,193,58,0.2)' : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={verifyOTP}
                      disabled={loading || otp.join('').length !== 6}
                      className="btn-primary w-full mb-4"
                    >
                      {loading
                        ? <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-pw-navy border-t-transparent animate-spin" />
                            Verifying...
                          </span>
                        : 'Verify Code'}
                    </button>

                    <div className="text-center">
                      {timer > 0
                        ? <p className="text-pw-muted text-sm">Resend in {timer}s</p>
                        : <button onClick={sendOTP} disabled={loading}
                            className="text-pw-blue-light text-sm hover:underline">
                            Resend Code
                          </button>
                      }
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="w-16 h-16 rounded-full bg-pw-emerald-dim border border-pw-emerald/30 flex items-center justify-center mx-auto mb-4">
                      <HiShieldCheck className="w-8 h-8 text-pw-emerald" />
                    </motion.div>
                    <h2 className="font-display text-xl font-bold text-white mb-2">Verified!</h2>
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
