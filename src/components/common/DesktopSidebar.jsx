// src/components/common/DesktopSidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiHome, HiArrowsRightLeft, HiSparkles,
  HiAcademicCap, HiChartBar, HiDocumentChartBar,
  HiCreditCard, HiShieldCheck, HiBanknotes,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/',         icon: HiHome,    label: 'Dashboard' },
      { to: '/insights', icon: HiChartBar, label: 'AI Insights' },
      { to: '/reports',  icon: HiDocumentChartBar, label: 'Reports' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/transactions', icon: HiArrowsRightLeft, label: 'Transactions' },
      { to: '/budget',       icon: HiSparkles,        label: 'AI Budget' },
      { to: '/savings',      icon: HiBanknotes,       label: 'Savings Goals' },
      { to: '/debts',        icon: HiShieldCheck,     label: 'Debt Manager' },
      { to: '/cards',        icon: HiCreditCard,      label: 'Card Wallet' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { to: '/lessons', icon: HiAcademicCap, label: 'Financial Lessons' },
    ],
  },
];

export default function DesktopSidebar() {
  const { user, profile, logout } = useAuth();

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col z-50"
      style={{
        background: 'rgba(8,14,31,0.96)',
        backdropFilter: 'blur(32px)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      {/* Wordmark */}
      <div className="px-5 pt-7 pb-7">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, #F5B731 0%, #F59E0B 100%)',
              color: '#080E1F',
              boxShadow: '0 4px 14px rgba(245,183,49,0.30)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            ₱
          </div>
          <div>
            <h1 className="font-display text-white text-lg leading-none" style={{ letterSpacing: '-0.01em' }}>PisoWise</h1>
            <p className="text-[11px] text-pw-muted mt-0.5 font-medium uppercase tracking-widest">Smart Finance</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto scroll-hidden">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-pw-muted opacity-55">
              {group.label}
            </p>
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-pw-gold'
                      : 'text-pw-muted hover:text-white'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(245,183,49,0.09)' : 'transparent',
                  border: isActive ? '1px solid rgba(245,183,49,0.12)' : '1px solid transparent',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon style={{ width: 16, height: 16, flexShrink: 0, color: isActive ? '#F5B731' : undefined }} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User area */}
      <div className="px-3 pb-5">
        <div className="divider" />
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 hover:bg-pw-subtle transition-all cursor-pointer"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' }}
          >
            {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{profile?.displayName || 'User'}</p>
            <p className="text-[11px] text-pw-muted truncate mt-0.5">{user?.email}</p>
          </div>
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-pw-muted hover:text-pw-rose transition-all text-sm cursor-pointer"
          style={{ background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <HiArrowRightOnRectangle style={{ width: 16, height: 16 }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
