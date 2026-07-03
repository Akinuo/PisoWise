// src/components/common/Layout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="bg-pw min-h-dvh">
      {/* Desktop sidebar (hidden on mobile via CSS) */}
      <DesktopSidebar />

      {/* Page content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="min-h-dvh"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Bottom Navigation (mobile) */}
      <BottomNav />
    </div>
  );
}
