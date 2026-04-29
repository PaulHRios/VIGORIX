import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getDisclaimerAccepted, setDisclaimerAccepted } from '../services/storageService.js';

const DisclaimerContext = createContext(null);

export function DisclaimerProvider({ children }) {
  const [accepted, setAccepted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    setAccepted(getDisclaimerAccepted());
    setLoaded(true);
  }, []);

  const accept = useCallback(() => {
    setDisclaimerAccepted(true);
    setAccepted(true);
    setForceOpen(false);
  }, []);

  const open = useCallback(() => setForceOpen(true), []);
  const close = useCallback(() => setForceOpen(false), []);

  const value = {
    accepted,
    loaded,
    forceOpen,
    isVisible: loaded && (!accepted || forceOpen),
    accept,
    open,
    close,
  };

  return <DisclaimerContext.Provider value={value}>{children}</DisclaimerContext.Provider>;
}

export function useDisclaimer() {
  const ctx = useContext(DisclaimerContext);
  if (!ctx) throw new Error('useDisclaimer must be used within DisclaimerProvider');
  return ctx;
}
