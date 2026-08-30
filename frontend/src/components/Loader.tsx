export default function Loader({ label = 'Loading simulated data…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-600">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-leaf-200 border-t-leaf-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function Skeleton({ className = 'h-24' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}