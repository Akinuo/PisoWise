// src/components/common/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiHome, HiArrowsRightLeft, HiSparkles,
  HiAcademicCap, HiUser,
} from 'react-icons/hi2';

const NAV_ITEMS = [
  { to: '/',             icon: HiHome,              label: 'Home' },
  { to: '/transactions', icon: HiArrowsRightLeft,   label: 'Gastos' },
  { to: '/budget',       icon: HiSparkles,          label: 'AI Budget', center: true },
  { to: '/lessons',      icon: HiAcademicCap,       label: 'Aralin' },
  { to: '/profile',      icon: HiUser,              label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label, center }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1 flex flex-col items-center"
          >
            {({ isActive }) =>
              center ? (
                /* Center CTA — AI Budget */
                <motion.div
                  whileTap={{ scale: 0.90 }}
                  className="relative -mt-5 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-200"
                    style={{
                      width: 52,
                      height: 52,
                      background: isActive
                        ? 'linear-gradient(135deg, #F5B731 0%, #F59E0B 100%)'
                        : 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
                      boxShadow: isActive
                        ? '0 4px 20px rgba(245,183,49,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset'
                        : '0 4px 20px rgba(29,78,216,0.40), 0 0 0 1px rgba(255,255,255,0.10) inset',
                    }}
                  >
                    <Icon
                      style={{ width: 22, height: 22, color: isActive ? '#080E1F' : '#fff' }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-pw-gold' : 'text-pw-muted'}`}>
                    {label}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.83 }}
                  className="flex flex-col items-center gap-1 py-1 px-2.5"
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -inset-2 rounded-xl"
                        style={{ background: 'rgba(245,183,49,0.10)' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                      />
                    )}
                    <Icon
                      style={{
                        width: 20,
                        height: 20,
                        position: 'relative',
                        color: isActive ? '#F5B731' : 'rgba(255,255,255,0.40)',
                        transition: 'color 0.18s',
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-semibold tracking-tight transition-colors duration-200"
                    style={{ color: isActive ? '#F5B731' : 'rgba(255,255,255,0.40)' }}
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
