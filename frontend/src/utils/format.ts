export const inr = (n: number, digits = 0) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;

export const inr2 = (n: number) => inr(n, 2);

export const num = (n: number, digits = 0) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: digits });

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const fmtFull = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const t = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(t)) return null;
  return Math.ceil(t / 86400000);
};

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));