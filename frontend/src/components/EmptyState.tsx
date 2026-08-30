import { Sprout } from 'lucide-react';

export default function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf-50 text-leaf-600">
        <Sprout className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {sub && <p className="max-w-sm text-xs text-ink-600">{sub}</p>}
    </div>
  );
}