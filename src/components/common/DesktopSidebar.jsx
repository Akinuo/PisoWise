// src/components/common/DesktopSidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiHome, HiArrowsRightLeft, HiSparkles,
  HiAcademicCap, HiUser, HiChartBar,
  HiCreditCard, HiShieldCheck, HiBanknotes,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/',         icon: HiHome,             label: 'Dashboard' },
      { to: '/insights', icon: HiChartBar,         label: 'AI Insights' },
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
        background: 'rgba(6,13,31,0.95)',
        backdropFilter: 'blur(28px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #F7C13A, #F59E0B)', color: '#060D1F' }}
          >
            ₱
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-none">PisoWise</h1>
            <p className="text-xs text-pw-muted mt-0.5">Smart Finance</p>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 overflow-y-auto scroll-hidden">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-pw-muted opacity-60">
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
                      ? 'bg-pw-gold-dim text-pw-gold'
                      : 'text-pw-muted hover:bg-pw-subtle hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-pw-gold' : ''}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-6">
        <div className="divider" />
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1 hover:bg-pw-subtle transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pw-blue to-pw-blue-light flex items-center justify-center text-sm font-bold text-white">
            {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.displayName || 'User'}</p>
            <p className="text-xs text-pw-muted truncate">{user?.email}</p>
          </div>
          <HiUser className="w-4 h-4 text-pw-muted flex-shrink-0" />
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-pw-muted hover:text-pw-rose hover:bg-pw-rose-dim transition-all text-sm"
        >
          <HiArrowRightOnRectangle className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
