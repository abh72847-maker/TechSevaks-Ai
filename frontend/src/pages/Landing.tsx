import {
  ArrowRight, Brain, Building2, CalendarClock, CheckCircle2, HandCoins, Landmark,
  LineChart, MapPinned, PackageCheck, Route, Scale, ShieldCheck, Sprout,
  Store, Truck, UserCheck, Wallet2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Users = Building2;
const EyeOff = () => null;

const PROBLEMS = [
  { icon: EyeOff, title: 'No price visibility', body: 'Farmers send produce to market blind, discovering the price only after harvest trucks are unloaded.' },
  { icon: Scale, title: 'Thin middlemen margins', body: 'Intermediaries capture 25–40% of the consumer rupee; only a fraction reaches the farmer.' },
  { icon: Wallet2, title: 'Distress sales', body: '41% of perishable harvests are sold within 48h of cutting — often at whatever price the market offers.' },
  { icon: CalendarClock, title: 'No demand signal', body: 'No forward view of buyer demand, quality premiums or payment terms before deciding to sell.' },
];

const USP = [
  { icon: CalendarClock, title: 'WHEN to sell', desc: 'Sell now, wait a few days, or store — scored against your urgency and the price forecast.', tone: 'leaf' },
  { icon: MapPinned, title: 'WHERE to sell', desc: 'The best market by expected Net Realisation after transport, storage, handling and loss.', tone: 'irrig' },
  { icon: UserCheck, title: 'WHO to sell to', desc: 'Buyers ranked on price, distance, quantity fit, quality fit, payment terms and reliability.', tone: 'violet' },
  { icon: HandCoins, title: 'Net Realisation', desc: 'Gross price is a trap. KRISHISETU AI optimises the money that actually reaches your bank account.', tone: 'amber' },
];

const FLOW = [
  { icon: LineChart, label: 'Market Intelligence' },
  { icon: HandCoins, label: 'Net Realisation' },
  { icon: Brain, label: 'AI Decision' },
  { icon: Users, label: 'FPO Aggregation' },
  { icon: ShieldCheck, label: 'Quality Grade' },
  { icon: PackageCheck, label: 'Digital Lot' },
  { icon: UserCheck, label: 'Buyer Matching' },
  { icon: HandCoins, label: 'Offer' },
  { icon: Scale, label: 'Negotiation' },
  { icon: Truck, label: 'Logistics' },
  { icon: CheckCircle2, label: 'Delivery' },
  { icon: Wallet2, label: 'Payment' },
  { icon: ShieldCheck, label: 'Grievance' },
  { icon: Sprout, label: 'Transparent Tx' },
];

const IMPACT = [
  { value: '₹19.4/kg', label: 'top matched buyer quote (v demo lot)' },
  { value: '+₹2.3/kg', label: 'net uplift vs selling at first mandi (simulated)' },
  { value: '38%', label: 'transport & handling saved via FPO aggregation (simulated)' },
  { value: '9 crops', label: 'covered across 8 markets (demo network)' },
];

const HERO_STEPS = [
  { tag: 'WHEN', line: 'Sell within 3 days → Sell Now', tone: 'bg-leaf-100 text-leaf-700' },
  { tag: 'WHERE', line: 'Pimpalgaon APMC · ₹18.4/kg net', tone: 'bg-irrig-100 text-irrig-700' },
  { tag: 'WHO', line: 'Star Agri Exports · 97.5 match', tone: 'bg-violet-100 text-violet-700' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* top nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-700 md:flex">
            <a href="#problem" className="hover:text-leaf-700">Problem</a>
            <a href="#solution" className="hover:text-leaf-700">Solution</a>
            <a href="#how" className="hover:text-leaf-700">How it works</a>
            <a href="#impact" className="hover:text-leaf-700">Impact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/app/farmer" className="btn-primary">Open Dashboard <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-leaf-100 to-irrig-100 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <span className="chip bg-leaf-100 text-leaf-700">
              <Sprout className="h-3.5 w-3.5" /> SIH 2026 · PS SIH26132 · Prototype
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Sell Smarter.
              <br />
              <span className="bg-gradient-to-r from-leaf-600 to-irrig-600 bg-clip-text text-transparent">Earn Better.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700">
              KRISHISETU AI helps Indian farmers decide{' '}
              <strong className="font-bold text-ink-900">WHEN</strong> to sell,{' '}
              <strong className="font-bold text-ink-900">WHERE</strong> to sell, and{' '}
              <strong className="font-bold text-ink-900">WHO</strong> to sell to — based on the
              <strong className="font-bold text-ink-900"> expected Net Realisation</strong>, not just the headline mandi price.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app/farmer" className="btn-primary px-6 py-3 text-base">Farmer entry <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/app/flow" className="btn-secondary px-6 py-3 text-base">Watch the demo journey</Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">Demo build — every figure is simulated and clearly labelled. We make no claims about real-world AI accuracy.</p>
          </div>

          {/* hero panel */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="card space-y-3 shadow-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo scenario</p>
                  <p className="text-sm font-bold text-ink-900">Tomato · 1,000 kg · Grade A · Nashik</p>
                </div>
                <span className="chip bg-amber-100 text-amber-700">Sell in 3 days</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 p-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-leaf-300">AI Recommendation</p>
                <div className="mt-3 space-y-2.5">
                  {HERO_STEPS.map((s) => (
                    <div key={s.tag} className="flex items-center gap-3">
                      <span className={`chip w-14 justify-center ${s.tone}`}>{s.tag}</span>
                      <span className="text-sm font-medium">{s.line}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3">
                  <div>
                    <p className="text-[11px] text-white/60">Expected Net Realisation</p>
                    <p className="text-2xl font-extrabold">₹18,410</p>
                  </div>
                  <p className="text-xs text-white/60">Confidence 0.87 · simulated</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[{ l: 'Mkt price', v: '₹18.5/kg' }, { l: 'Transport', v: '₹314' }, { l: 'Loss buf', v: '4.0%' }].map((x) => (
                  <div key={x.l} className="rounded-xl bg-slate-50 px-2 py-2.5">
                    <p className="text-[10px] font-semibold uppercase text-slate-500">{x.l}</p>
                    <p className="text-sm font-extrabold text-ink-900">{x.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* problem */}
      <section id="problem" className="bg-[#f6faf7] py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-leaf-700">The problem</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              Farmers win with their hands, but lose with their pricing.
            </h2>
            <p className="mt-3 text-slate-600">
              Harvesting is the farmer’s art. But after harvest, the real game is invisible —<br className="hidden sm:block" />
              <strong>price is discovered on the truck, at the mandi, at 4 a.m.</strong>
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="card card-hover">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><p.icon className="h-5 w-5" /></span>
                <h3 className="mt-3 font-bold text-ink-900">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* solution */}
      <section id="solution" className="py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-leaf-700">The solution</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              One engine. Three decisions. One number that matters.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {USP.map((u) => {
              const tones = { leaf: 'bg-leaf-100 text-leaf-700', irrig: 'bg-irrig-100 text-irrig-700', violet: 'bg-violet-100 text-violet-700', amber: 'bg-amber-100 text-amber-700' } as const;
              return (
                <div key={u.title} className="card card-hover">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[u.tone as keyof typeof tones]}`}><u.icon className="h-5 w-5" /></span>
                  <h3 className="mt-3 font-bold text-ink-900">{u.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{u.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="bg-ink-900 py-16 text-white lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-leaf-300">How it works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            From farm gate to final payment — transparent in one place.
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-7">
            {FLOW.map((f, i) => (
              <div key={f.label} className="flex items-start gap-2.5 rounded-xl bg-white/5 px-3 py-3">
                <span className="text-lg font-extrabold text-leaf-400">{i + 1}</span>
                <div>
                  <f.icon className="h-4 w-4 text-leaf-300" />
                  <p className="mt-1.5 text-xs font-semibold leading-snug text-white/90">{f.label}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-white/60">
            Every step is a first-class citizen in the platform — offers, negotiations, logistics, payments and
            grievances are all tracked as auditable records. The unique selling point:{' '}
            <span className="font-semibold text-white">the decision is driven by expected Net Realisation, not gross mandi price.</span>
          </p>
        </div>
      </section>

      {/* impact */}
      <section id="impact" className="py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-leaf-700">Impact · simulated demo metrics</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            What the engine buys back for the farmer.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {IMPACT.map((x) => (
              <div key={x.label} className="card">
                <p className="text-3xl font-extrabold tracking-tight text-leaf-700">{x.value}</p>
                <p className="mt-1.5 text-sm text-slate-600">{x.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">Benchmarks computed on the demo dataset. Real-world validation pending live mandi feeds.</p>
        </div>
      </section>

      {/* entry points */}
      <section className="border-t border-slate-100 bg-[#f6faf7] py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink-900">Who are you?</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-slate-600">Enter the platform as your role and explore the tailored workspace.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Sprout, title: 'Farmer', desc: 'Prices, forecast, WHEN/WHERE/WHO, buyer matches, lots and payments.', to: '/app/farmer' },
              { icon: Store, title: 'Buyer', desc: 'Browse digital lots, AI-recommended matches, offers, orders and logistics.', to: '/app/buyer' },
              { icon: Users, title: 'FPO', desc: 'Aggregate compatible farmers into bulk lots and negotiate as one unit.', to: '/app/fpo' },
            ].map((e) => (
              <Link key={e.title} to={e.to} className="card card-hover group">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-leaf-500 to-irrig-500 text-white"><e.icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{e.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{e.desc}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-leaf-700 transition-all group-hover:gap-2.5">
                  Enter workspace <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6">
          <Logo size="sm" />
          <p>Team Teclov · SIH 2026 · PS SIH26132 · Prototype with simulated data — not a real market service.</p>
          <div className="flex items-center gap-3">
            <Landmark className="h-4 w-4 text-slate-400" />
            <Route className="h-4 w-4 text-slate-400" />
            <Truck className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </footer>
    </div>
  );
}