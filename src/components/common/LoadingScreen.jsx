// src/components/common/LoadingScreen.jsx
import { motion } from 'framer-motion';

export default function LoadingScreen({ message = 'Naglo-load…' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: '#080E1F' }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 42%, rgba(29,78,216,0.06) 0%, transparent 58%)' }}
      />

      {/* Logo mark */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-7"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{
            background: 'linear-gradient(135deg, #F5B731 0%, #F59E0B 100%)',
            color: '#080E1F',
            boxShadow: '0 8px 36px rgba(245,183,49,0.38)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          ₱
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-display text-2xl text-white mb-1.5"
      >
        PisoWise
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-pw-muted text-sm mb-7"
      >
        {message}
      </motion.p>

      {/* Pulsing dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#F5B731' }}
          />
        ))}
      </div>
    </div>
  );
}
