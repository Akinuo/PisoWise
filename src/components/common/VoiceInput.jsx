// src/components/common/VoiceInput.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMicrophone, HiStop, HiCheckCircle, HiXCircle } from 'react-icons/hi2';
import useVoiceInput from '../../hooks/useVoiceInput';
import { formatPeso } from '../../utils/formatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/constants';

export default function VoiceInput({ onResult, compact = false }) {
  const {
    isListening, transcript, parsedData, error,
    isSupported, startListening, stopListening, reset,
  } = useVoiceInput();

  const [accepted, setAccepted] = useState(false);

  const getCategoryLabel = (id, type) => {
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return cats.find(c => c.id === id)?.label || id;
  };

  const handleAccept = () => {
    if (!parsedData) return;
    onResult(parsedData);
    setAccepted(true);
    setTimeout(() => { reset(); setAccepted(false); }, 1200);
  };

  if (!isSupported) {
    return (
      <div className="glass-sm p-3 text-center text-pw-muted text-sm">
        🎤 Voice input not supported. Please type instead.
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={isListening ? stopListening : startListening}
        className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
          isListening
            ? 'bg-pw-gold voice-active'
            : 'bg-pw-subtle hover:bg-white/10 border border-white/10'
        }`}
        title="Voice input"
      >
        {isListening
          ? <HiStop className="w-5 h-5 text-pw-navy" />
          : <HiMicrophone className="w-5 h-5 text-pw-muted" />
        }
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mic button */}
      <div className="flex justify-center">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={isListening ? stopListening : startListening}
          className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
            isListening
              ? 'bg-pw-gold voice-active'
              : 'bg-pw-subtle border border-white/10 hover:border-pw-gold/30'
          }`}
        >
          {isListening
            ? <HiStop      className="w-7 h-7 text-pw-navy" />
            : <HiMicrophone className="w-7 h-7 text-pw-muted" />
          }
          <span className={`text-[10px] font-semibold ${isListening ? 'text-pw-navy' : 'text-pw-muted'}`}>
            {isListening ? 'Stop' : 'Speak'}
          </span>
        </motion.button>
      </div>

      {/* Status */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-pw-gold text-sm font-medium animate-pulse">
              🎤 Nakikinig... magsalita na
            </p>
            <p className="text-pw-muted text-xs mt-1">
              Hal: "Gastos ko ay dalawang daan para sa pagkain"
            </p>
          </motion.div>
        )}

        {transcript && !isListening && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-sm p-3">
              <p className="text-xs text-pw-muted mb-1">Narinig:</p>
              <p className="text-white text-sm italic">"{transcript}"</p>
            </div>
          </motion.div>
        )}

        {parsedData && !accepted && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass p-4 space-y-3">
              <p className="text-xs text-pw-muted font-semibold uppercase tracking-wide">Naparsang Transaksyon</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-pw-muted">Uri</p>
                  <span className={parsedData.type === 'income' ? 'label-emerald' : 'label-rose'}>
                    {parsedData.type === 'income' ? '📈 Kita' : '📉 Gastos'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-pw-muted">Halaga</p>
                  <p className="text-white font-bold peso-amount">{formatPeso(parsedData.amount)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-pw-muted">Kategorya</p>
                  <p className="text-white text-sm">{getCategoryLabel(parsedData.category, parsedData.type)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAccept} className="btn-primary flex-1 py-2 text-xs gap-1.5">
                  <HiCheckCircle className="w-4 h-4" /> Gamitin
                </button>
                <button onClick={reset} className="btn-secondary flex-1 py-2 text-xs gap-1.5">
                  <HiXCircle className="w-4 h-4" /> Subukan Ulit
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {accepted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3"
          >
            <HiCheckCircle className="w-8 h-8 text-pw-emerald mx-auto mb-1" />
            <p className="text-pw-emerald text-sm font-medium">Natanggap!</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-sm p-3 border border-pw-rose/20">
              <p className="text-pw-rose text-sm text-center">⚠️ {error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
