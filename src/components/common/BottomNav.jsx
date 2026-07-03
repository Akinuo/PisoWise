// src/components/common/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiHome, HiArrowsRightLeft, HiSparkles,
  HiAcademicCap, HiUser,
} from 'react-icons/hi2';

const NAV_ITEMS = [
  { to: '/',           icon: HiHome,              label: 'Home' },
  { to: '/transactions', icon: HiArrowsRightLeft, label: 'Gastos' },
  { to: '/budget',     icon: HiSparkles,          label: 'AI Budget', center: true },
  { to: '/lessons',    icon: HiAcademicCap,       label: 'Aralin' },
  { to: '/profile',    icon: HiUser,              label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, center }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1 flex flex-col items-center"
          >
            {({ isActive }) =>
              center ? (
                /* Center AI Budget button — special treatment */
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="relative -mt-5 flex flex-col items-center"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-pw-gold shadow-gold'
                        : 'bg-gradient-to-br from-pw-blue to-pw-blue-light shadow-blue'
                    }`}
                    style={{ boxShadow: isActive ? '0 0 24px rgba(247,193,58,0.5)' : '0 0 24px rgba(59,130,246,0.4)' }}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-pw-navy' : 'text-white'}`} />
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'text-pw-gold' : 'text-pw-muted'}`}>
                    {label}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center gap-1 py-1 px-3"
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -inset-2 rounded-xl bg-pw-gold-dim"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={`relative w-5 h-5 transition-colors duration-200 ${
                        isActive ? 'text-pw-gold' : 'text-pw-muted'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-semibold transition-colors duration-200 ${
                      isActive ? 'text-pw-gold' : 'text-pw-muted'
                    }`}
                  >
                    {label}
                  </span>
                </motion.div>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
