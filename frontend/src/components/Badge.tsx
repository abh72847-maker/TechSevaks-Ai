import type { ReactNode } from 'react';

const tones: Record<string, string> = {
  green: 'bg-leaf-100 text-leaf-700',
  blue: 'bg-irrig-100 text-irrig-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
  violet: 'bg-violet-100 text-violet-700',
};

export default function Badge({ label, tone = 'slate', dot, children }: { label?: string; tone?: keyof typeof tones | string; dot?: boolean; children?: ReactNode }) {
  return (
    <span className={`chip ${tones[tone] ?? tones.slate}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label ?? children}
    </span>
  );
}

export function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (['available', 'pending', 'open', 'scheduled', 'created'].includes(s)) return 'blue';
  if (['paid', 'settled', 'resolved', 'completed', 'delivered', 'accepted'].includes(s)) return 'green';
  if (['in_transit', 'negotiating', 'countered', 'review', 'confirmed'].includes(s)) return 'amber';
  if (['grievance', 'rejected', 'expired', 'failed'].includes(s)) return 'red';
  if (['offered', 'order_confirmed'].includes(s)) return 'violet';
  return 'slate';
}

export const prettifyStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());