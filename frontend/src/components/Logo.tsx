import { Leaf } from 'lucide-react';

export default function Logo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const dims = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const text = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`${dims} grid place-items-center rounded-xl bg-gradient-to-br from-leaf-500 to-irrig-500 text-white shadow-sm`}>
        <Leaf className="h-[55%] w-[55%]" strokeWidth={2.4} />
      </span>
      <span className={`${text} font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink-900'}`}>
        KRISHISETU <span className={light ? 'text-leaf-200' : 'text-leaf-600'}>AI</span>
      </span>
    </span>
  );
}