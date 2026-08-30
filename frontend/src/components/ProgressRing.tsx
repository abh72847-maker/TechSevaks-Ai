interface Props {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: 'leaf' | 'irrig' | 'amber' | 'violet';
}

const colors = {
  leaf: '#36a960',
  irrig: '#2b8abf',
  amber: '#f59e0b',
  violet: '#8b5cf6',
};

export default function ProgressRing({ value, size = 64, stroke = 6, label, tone = 'leaf' }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6efe9" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors[tone]}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
        />
      </svg>
      <div className="absolute text-center">
        <span className="block text-[13px] font-extrabold text-ink-900">{label ?? Math.round(pct)}</span>
      </div>
    </div>
  );
}