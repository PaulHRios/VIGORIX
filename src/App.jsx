import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ChatPage } from './pages/ChatPage.jsx';
import { SavedPage } from './pages/SavedPage.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { AccountPage } from './pages/AccountPage.jsx';
import { DisclaimerModal } from './components/DisclaimerModal.jsx';
import { LanguageProvider } from './hooks/useLanguage.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { DisclaimerProvider } from './hooks/useDisclaimer.jsx';

export default function App() {
  // HashRouter is used so the app works on GitHub Pages without
  // 404 redirects, even if the user lands on a deep link.
  return (
    <LanguageProvider>
      <AuthProvider>
        <DisclaimerProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<ChatPage />} />
                <Route path="saved" element={<SavedPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="account" element={<AccountPage />} />
              </Route>
            </Routes>
          </HashRouter>
          <DisclaimerModal />
        </DisclaimerProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
