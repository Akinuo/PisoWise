// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import LoadingScreen from './components/common/LoadingScreen';

// Pages (lazy loaded for performance)
import { lazy, Suspense } from 'react';

const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Budget       = lazy(() => import('./pages/Budget'));
const Savings      = lazy(() => import('./pages/Savings'));
const Debts        = lazy(() => import('./pages/Debts'));
const Cards        = lazy(() => import('./pages/Cards'));
const Lessons      = lazy(() => import('./pages/Lessons'));
const Insights     = lazy(() => import('./pages/Insights'));
const Profile      = lazy(() => import('./pages/Profile'));

// ─── Route Guards ─────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// ─── App Routes ───────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Private — wrapped in Layout (nav, header) */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index          element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budget"       element={<Budget />} />
        <Route path="savings"      element={<Savings />} />
        <Route path="debts"        element={<Debts />} />
        <Route path="cards"        element={<Cards />} />
        <Route path="lessons"      element={<Lessons />} />
        <Route path="lessons/:id"  element={<Lessons />} />
        <Route path="insights"     element={<Insights />} />
        <Route path="profile"      element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

// ─── Root App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          containerClassName="toaster-wrapper"
          toastOptions={{
            duration: 3000,
            style: {
              background:   'rgba(12, 22, 40, 0.95)',
              color:        '#ffffff',
              border:       '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              fontSize:     '14px',
              fontFamily:   'Inter, sans-serif',
              maxWidth:     '360px',
              padding:      '12px 16px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
              duration:  4000,
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
