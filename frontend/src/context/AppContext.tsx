import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { connectivity } from '../api/client';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

interface AppCtx {
  online: boolean;
  connectivityChecked: boolean;
  toasts: Toast[];
  toast: (message: string, kind?: Toast['kind']) => void;
  activeFarmer: string;
  activeBuyer: string;
  activeFpo: string;
}

const Ctx = createContext<AppCtx | null>(null);

const DEMOS = {
  activeFarmer: 'f1',
  activeBuyer: 'b2',
  activeFpo: 'fpo1',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(connectivity.isOnline);
  const [checked, setChecked] = useState(connectivity.isChecked);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  useEffect(() => connectivity.subscribe((v) => {
    setOnline(v);
    setChecked(true);
  }), []);

  const toast = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <Ctx.Provider value={{ online, connectivityChecked: checked, toasts, toast, ...DEMOS }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}