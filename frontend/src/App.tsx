import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { Spinner } from './components/icons.tsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ground text-brand-600">
        <Spinner className="size-8" />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  // Con sesión: sin alergias configuradas → onboarding del perfil antes del escáner
  const afterAuth = user?.allergies.length ? '/' : '/profile?onboarding=1';

  return (
    <Routes>
      {/* "/" es la landing para visitantes y el escáner para usuarios con sesión */}
      <Route path="/" element={user ? <DashboardPage /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={afterAuth} replace /> : <AuthPage key="login" mode="login" />} />
      <Route
        path="/registro"
        element={user ? <Navigate to={afterAuth} replace /> : <AuthPage key="register" mode="register" />}
      />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      {/* Fase Stripe: /pricing */}
    </Routes>
  );
}
