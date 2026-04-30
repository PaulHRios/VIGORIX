// src/App.jsx
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { BuilderPage } from './pages/BuilderPage.jsx';
import { SavedPage } from './pages/SavedPage.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { AccountPage } from './pages/AccountPage.jsx';
import { DisclaimerModal } from './components/DisclaimerModal.jsx';
import { LanguageProvider } from './hooks/useLanguage.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { DisclaimerProvider } from './hooks/useDisclaimer.jsx';
import { isOnboarded } from './services/userProfile.js';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DisclaimerProvider>
          <HashRouter>
            <Routes>
              {/* Onboarding has its own full-screen layout (no nav bar) */}
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Everything else lives under the shared Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomeRedirect />} />
                <Route path="builder" element={<BuilderPage />} />
                <Route path="saved" element={<SavedPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="*" element={<Navigate to="/builder" replace />} />
              </Route>
            </Routes>
          </HashRouter>
          <DisclaimerModal />
        </DisclaimerProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

/**
 * Root path: send onboarded users to the builder, others to onboarding.
 */
function HomeRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isOnboarded()) navigate('/builder', { replace: true });
    else navigate('/onboarding', { replace: true });
  }, [navigate]);
  return null;
}
