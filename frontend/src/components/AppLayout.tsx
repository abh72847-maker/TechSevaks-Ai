import {
  Boxes, Brain, Calculator, ChevronRight, LayoutDashboard, Menu, MenuSquare,
  Route, ShieldCheck, Sprout, Store, TrendingUp, Users, WifiOff, X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useApp } from '../context/AppContext';

const SECTIONS: { title: string; items: { to: string; label: string; icon: ReactNode }[] }[] = [
  {
    title: 'Farmer',
    items: [
      { to: '/app/farmer', label: 'Farmer Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: '/app/realisation', label: 'Net Realisation', icon: <Calculator className="h-4 w-4" /> },
      { to: '/app/ai', label: 'AI Decision Engine', icon: <Brain className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Insights',
    items: [{ to: '/app/market', label: 'Market Intelligence', icon: <TrendingUp className="h-4 w-4" /> }],
  },
  {
    title: 'Marketplace',
    items: [
      { to: '/app/lots', label: 'Digital Lots', icon: <Boxes className="h-4 w-4" /> },
      { to: '/app/buyer', label: 'Buyer Dashboard', icon: <Store className="h-4 w-4" /> },
      { to: '/app/fpo', label: 'FPO Dashboard', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Transaction',
    items: [{ to: '/app/flow', label: 'Transaction Flow', icon: <Route className="h-4 w-4" /> }],
  },
  {
    title: 'Platform',
    items: [{ to: '/app/admin', label: 'Admin Dashboard', icon: <ShieldCheck className="h-4 w-4" /> }],
  },
];

function SidebarContent({ onNav }: { onNav?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-5 py-4">
        <Logo />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{sec.title}</p>
            <ul className="space-y-0.5">
              {sec.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNav}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        isActive ? 'bg-leaf-600 text-white shadow-sm' : 'text-ink-700 hover:bg-[#edf4ef]'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-100 px-5 py-4 text-[11px] leading-relaxed text-slate-500">
        <p className="font-semibold text-slate-600">SIH 2026 · PS SIH26132</p>
        <p>Market linkages & price discovery prototype. All data simulated.</p>
      </div>
    </div>
  );
}

function Toasts() {
  const { toasts } = useApp();
  const tones = {
    success: 'border-leaf-200 bg-leaf-50 text-leaf-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-irrig-200 bg-irrig-50 text-irrig-800',
  };
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lift ${tones[t.kind]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function AppLayout() {
  const { online, connectivityChecked, toast } = useApp();
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-100 bg-white lg:block">
        <SidebarContent />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-lift">
            <button onClick={() => setDrawer(false)} className="absolute right-2 top-4 rounded-lg p-1.5 text-slate-500">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNav={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-100 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button className="rounded-lg p-2 text-ink-700 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-ink-800 hover:bg-slate-100 lg:inline-flex"
          >
            <Sprout className="h-4 w-4 text-leaf-600" /> Dashboard suite
          </button>
          <div className="flex-1" />
          {connectivityChecked &&
            (online ? (
              <span className="chip bg-leaf-100 text-leaf-700">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-600" /> API live
              </span>
            ) : (
              <span className="chip bg-amber-100 text-amber-700">
                <WifiOff className="h-3 w-3" /> Offline demo engine
              </span>
            ))}
          <button onClick={() => toast('Demo mode: all transactions are simulated.', 'info')} className="chip bg-slate-100 text-slate-600">
            <MenuSquare className="h-3 w-3" /> Simulated data
          </button>
        </header>

        {!online && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
            Backend not reachable — pages are running on the bundled demo engine. Start the FastAPI server for the full
            experience.
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="px-6 py-5 text-center text-xs text-slate-400">
          KRISHISETU AI · Prototype for SIH 2026 · All figures simulated for demo.
        </footer>
      </div>
      <Toasts />
    </div>
  );
}