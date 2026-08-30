import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  accent?: 'leaf' | 'irrig' | 'amber' | 'violet';
}

const accents = {
  leaf: 'bg-leaf-100 text-leaf-700',
  irrig: 'bg-irrig-100 text-irrig-700',
  amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700',
};

export default function StatCard({ icon: Icon, label, value, sub, delta, accent = 'leaf' }: Props) {
  return (
    <div className="card flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">{label}</p>
        <p className="mt-1.5 truncate text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-ink-600">{sub}</p>}
        {delta !== undefined && (
          <p className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${delta >= 0 ? 'text-leaf-600' : 'text-red-600'}`}>
            {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(delta)}% vs prev day
          </p>
        )}
      </div>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accents[accent]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}