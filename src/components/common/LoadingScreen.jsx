// src/components/common/LoadingScreen.jsx
import { motion } from 'framer-motion';

export default function LoadingScreen({ message = 'Naglo-load...' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-pw-navy z-50">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(247,193,58,0.06) 0%, transparent 60%)' }}
      />

      {/* Animated Philippine Sun */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer rays */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-start justify-center"
              style={{ transform: `rotate(${i * 45}deg)` }}
            >
              <div
                className="w-0.5 h-5 rounded-full"
                style={{ background: 'rgba(247,193,58,0.4)', marginTop: '-2px' }}
              />
            </div>
          ))}
        </motion.div>

        {/* Inner rays */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-3"
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-start justify-center"
              style={{ transform: `rotate(${i * 45 + 22.5}deg)` }}
            >
              <div
                className="w-0.5 h-3 rounded-full"
                style={{ background: 'rgba(247,193,58,0.25)', marginTop: '-2px' }}
              />
            </div>
          ))}
        </motion.div>

        {/* Center circle */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-display font-bold"
            style={{
              background: 'linear-gradient(135deg, #F7C13A, #F59E0B)',
              color: '#060D1F',
              boxShadow: '0 0 32px rgba(247,193,58,0.5)',
            }}
          >
            ₱
          </div>
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display font-bold text-2xl text-white mb-2"
      >
        PisoWise
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-pw-muted text-sm"
      >
        {message}
      </motion.p>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-pw-gold"
          />
        ))}
      </div>
    </div>
  );
}
