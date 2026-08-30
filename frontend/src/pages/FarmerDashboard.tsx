import {
  ArrowRight, Banknote, Brain, CalendarDays, Calculator, CheckCircle2,
  HandCoins, MapPin, Package, Send, ShieldAlert, Truck, UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Badge, { prettifyStatus, statusTone } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoaderPage from '../components/PageLoader';
import Modal from '../components/Modal';
import ProgressRing from '../components/ProgressRing';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import type { GrievanceItem, Lot, Offer } from '../types';
import { fmtDate, inr, inr2 } from '../utils/format';

const FARMER_NAME = 'Ramesh Patil';
const CROPS = ['tomato', 'onion', 'potato', 'chilli', 'brinjal', 'cabbage', 'cauliflower', 'soybean', 'cotton'];

function Tabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'recommendation', label: 'AI Decision' },
    { id: 'lots', label: 'My Lots' },
    { id: 'offers', label: 'Offers & Negotiation' },
    { id: 'logistics', label: 'Logistics' },
    { id: 'payments', label: 'Payments' },
    { id: 'grievances', label: 'Grievances' },
  ];
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`tab ${active === t.id ? 'tab-active' : ''}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function FarmerHeader() {
  return (
    <div className="card mb-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-leaf-50 to-irrig-50">
      <div className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-leaf-500 to-irrig-500 text-xl font-extrabold text-white">RP</span>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900">Ramesh Patil</h1>
          <p className="flex items-center gap-1.5 text-sm text-ink-600"><MapPin className="h-3.5 w-3.5" /> Wadivihir, Nashik · 4.2 acres · KCC ₹2.5L</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="green" dot>KYC verified</Badge>
        <Badge tone="blue" dot>UPLINKED TO FPO</Badge>
        <Link to="/app/ai" className="btn-primary">AI Playground <Brain className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  const { toast } = useApp();
  const [tab, setTab] = useState('overview');
  const [demo, setDemo] = useState({ crop: 'tomato', quantity_kg: 1000, quality: 'A', location: 'Nashik', market: 'Pimpalgaon APMC', sell_within_days: 3 });

  const lotsRes = useFetch(() => api.listLots(), []);
  const offersRes = useFetch(() => api.listOffers(), []);
  const payRes = useFetch(() => api.listPayments(), []);
  const logiRes = useFetch(() => api.listLogistics(), []);
  const grvRes = useFetch(() => api.listGrievances(), []);

  const myLots = useMemo(
    () => (lotsRes.data?.lots ?? []).filter((l) => l.seller === FARMER_NAME),
    [lotsRes.data],
  );
  const myLotIds = useMemo(() => new Set(myLots.map((l) => l.id)), [myLots]);
  const myOffers = useMemo(
    () => (offersRes.data?.offers ?? []).filter((o) => myLotIds.has(o.lot_id)),
    [offersRes.data, myLotIds],
  );

  const recommendation = useFetch(
    () => api.recommendation(demo as any),
    [demo.crop, demo.quantity_kg, demo.quality, demo.location, demo.market, demo.sell_within_days],
  );

  if (lotsRes.loading || payRes.loading || logiRes.loading) return <LoaderPage />;

  return (
    <div className="mx-auto max-w-6xl">
      <FarmerHeader />
      <Tabs active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* scenario bar + quick actions */}
          <QuickActions demo={demo} setDemo={setDemo} />

          {/* stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={HandCoins} label="Est. Net Realisation" value={recommendation.data ? inr(recommendation.data.net_total) : '…'} sub={recommendation.data ? `${inr2(recommendation.data.net_per_kg)}/kg` : undefined} accent="leaf" />
            <StatCard icon={CalendarDays} label="Best time to sell" value={recommendation.data?.when.label ?? '…'} sub={recommendation.data?.when.reason ?? ''} accent="irrig" />
            <StatCard icon={MapPin} label="Best market" value={recommendation.data?.where.market ?? '…'} sub={recommendation.data ? `${inr2(recommendation.data.net_per_kg)}/kg net` : undefined} accent="amber" />
            <StatCard icon={UserRound} label="Best buyer" value={`${recommendation.data?.who.match_score ?? '…'} match`} sub={recommendation.data?.who.buyer ?? ''} accent="violet" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card">
              <SectionHeader title="My Lots" sub="Digital lots you have listed" action={<Link to="/app/lots" className="btn-ghost p-2">All lots <ArrowRight className="h-4 w-4" /></Link>} />
              {myLots.length === 0 ? (
                <EmptyState title="No lots yet" sub="Create a digital lot from the My Lots tab to start receiving buyer offers." />
              ) : (
                <div className="space-y-2.5">
                  {myLots.map((l) => (
                    <Link to={`/app/lots/${l.id}`} key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3.5 py-3 hover:border-leaf-300 hover:bg-leaf-50/50">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-100 text-leaf-700"><Package className="h-4 w-4" /></span>
                        <div>
                          <p className="text-sm font-bold text-ink-900">{l.id} · {l.crop} · {l.quantity_kg.toLocaleString('en-IN')} kg</p>
                          <p className="text-xs text-slate-500">{l.market} · Grade {l.quality} · harvest {fmtDate(l.harvest_date)}</p>
                        </div>
                      </div>
                      <Badge tone={statusTone(l.status)}>{prettifyStatus(l.status)}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <SectionHeader title="Offers on my lots" sub="Buyers are bidding on your produce" />
              {myOffers.length === 0 ? (
                <EmptyState title="No offers yet" sub="Create a lot first — AI-matched buyers can then place offers." />
              ) : (
                <div className="space-y-2.5">
                  {myOffers.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3.5 py-3">
                      <div>
                        <p className="text-sm font-bold text-ink-900">{o.buyer}</p>
                        <p className="text-xs text-slate-500">₹{inr2(o.price_per_kg)}/kg · {o.quantity_kg.toLocaleString('en-IN')} kg · {o.delivery_days}d delivery</p>
                      </div>
                      <Badge tone={statusTone(o.status)}>{prettifyStatus(o.status)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <SectionHeader title="Payment & logistics snapshot" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Settled (7d)</p>
                <p className="mt-1 text-2xl font-extrabold text-leaf-700">{inr((payRes.data?.payments ?? []).filter((p) => p.status === 'settled').reduce((a, p) => a + p.amount, 0))}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Active consignments</p>
                <p className="mt-1 text-2xl font-extrabold text-ink-900">{(logiRes.data?.logistics as any[] ?? []).filter((l) => ['scheduled', 'in_transit'].includes(l.status)).length}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Open resources</p>
                <p className="mt-1 text-2xl font-extrabold text-ink-900">{(grvRes.data?.grievances ?? []).filter((g) => g.status !== 'resolved').length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'recommendation' && (
        <RecommendationView demo={demo} recommendation={recommendation} />
      )}

      {tab === 'lots' && (
        <MyLotsView lots={myLots} reload={lotsRes.reload} toast={toast} />
      )}

      {tab === 'offers' && (
        <OffersView offers={myOffers} toast={toast} reloadOffer={() => offersRes.reload()} />
      )}

      {tab === 'logistics' && <LogisticsView orders={[]} logistics={logiRes.data?.logistics as any[] ?? []} />}
      {tab === 'payments' && <PaymentsView payments={payRes.data?.payments ?? []} />}
      {tab === 'grievances' && <GrievancesView list={(grvRes.data?.grievances ?? []) as unknown as GrievanceItem[]} toast={toast} />}

      <p className="mt-8 text-center text-xs text-slate-400">
        All numbers are simulated demo data. Confidence is a heuristic, not a guarantee.
      </p>
    </div>
  );
}

function QuickActions({ demo, setDemo }: { demo: any; setDemo: (d: any) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip bg-amber-100 text-amber-700">Demo scenario</span>
        {[
          ['Crop', 'crop'], ['Qty', 'quantity_kg'], ['Grade', 'quality'], ['From', 'location'], ['Market', 'market'], ['Sell in', 'sell_within_days'],
        ].map(([label, key]) => (
          <div key={key} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-slate-500">{label}: </span>
            <span className="font-bold text-ink-900">
              {key === 'quantity_kg' ? `${demo[key]} kg` : key === 'sell_within_days' ? `${demo[key]} days` : key === 'crop' ? demo[key] : demo[key]}
            </span>
          </div>
        ))}
      </div>
      <button onClick={() => setOpen(true)} className="btn-secondary">Edit scenario</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit demo scenario">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Crop</label>
            <select className="input" value={demo.crop} onChange={(e) => setDemo({ ...demo, crop: e.target.value })}>
              {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="label">Quantity (kg)</label>
            <input type="number" className="input" value={demo.quantity_kg} onChange={(e) => setDemo({ ...demo, quantity_kg: +e.target.value })} /></div>
          <div><label className="label">Quality grade</label>
            <select className="input" value={demo.quality} onChange={(e) => setDemo({ ...demo, quality: e.target.value })}>
              {['A', 'B', 'C'].map((q) => <option key={q} value={q}>Grade {q}</option>)}
            </select></div>
          <div><label className="label">Market</label>
            <select className="input" value={demo.market} onChange={(e) => setDemo({ ...demo, market: e.target.value })}>
              {['Pimpalgaon APMC', 'Nashik APMC', 'Lasalgaon APMC', 'Vashi APMC (Navi Mumbai)', 'Hadapsar Market Yard (Pune)'].map((m) => <option key={m}>{m}</option>)}
            </select></div>
          <div><label className="label">Sell within (days)</label>
            <input type="number" className="input" value={demo.sell_within_days} onChange={(e) => setDemo({ ...demo, sell_within_days: +e.target.value })} /></div>
          <div><label className="label">Location</label>
            <input className="input" value={demo.location} onChange={(e) => setDemo({ ...demo, location: e.target.value })} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={() => setOpen(false)}>Apply & recompute</button>
        </div>
      </Modal>
    </div>
  );
}

function RecommendationView({ demo, recommendation }: { demo: any; recommendation: any }) {
  const r = recommendation.data;
  if (recommendation.loading) return <LoaderPage />;
  if (!r) return <div className="card text-sm text-red-600">Could not compute recommendation.</div>;
  const cards = [
    { tag: 'WHEN', title: r.when.label, body: r.when.reason, score: r.when.score * 100, tone: 'leaf' as const },
    { tag: 'WHERE', title: `${r.where.market}`, body: r.where.reason, score: r.where.score * 100, tone: 'irrig' as const },
    { tag: 'WHO', title: r.who.buyer, body: r.who.reason, score: r.who.score * 100, tone: 'violet' as const },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.tag} className="card flex items-start gap-4">
            <div className="text-center">
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{c.tag}</div>
              <div className="mt-1"><ProgressRing value={c.score} tone={c.tone} /></div>
            </div>
            <div className="min-w-0">
              <p className="font-extrabold leading-tight text-ink-900">{c.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="card space-y-4">
          <SectionHeader title="Net Realisation at a glance" sub={`${demo.crop} · ${demo.quantity_kg} kg · Grade ${demo.quality}`} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: 'Gross price', v: inr2(r.where.price_per_kg), unit: '/kg at best market' },
              { l: 'Net realisation', v: inr2(r.net_per_kg), unit: '/kg' },
              { l: 'Total expected', v: inr(r.net_total), unit: `for ${demo.quantity_kg} kg` },
              { l: 'Confidence', v: `${(r.confidence * 100).toFixed(0)}%`, unit: 'heuristic' },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase text-slate-500">{x.l}</p>
                <p className="mt-0.5 text-xl font-extrabold text-ink-900">{x.v}</p>
                <p className="text-[11px] text-slate-500">{x.unit}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-leaf-200 bg-leaf-50 p-4 text-sm text-leaf-800">
            <p className="font-bold">Why {r.who.buyer}?</p>
            <p className="mt-1">{r.who.reason} · {r.who.advance_pct}% advance · {r.who.payment_terms}.</p>
          </div>
        </div>
        <div className="card">
          <SectionHeader title="Factors used" />
          <ul className="space-y-2">
            {r.factors.map((f: string) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/app/realisation" className="btn-secondary w-full"><Calculator className="h-4 w-4" /> Open Net Realisation Engine</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyLotsView({ lots, reload, toast }: { lots: Lot[]; reload: () => void; toast: (m: string, k?: 'success' | 'error' | 'info') => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    crop: 'tomato', quantity_kg: 1000, quality: 'A', location: 'Wadivihir, Nashik',
    market: 'Pimpalgaon APMC', expected_price_per_kg: 19.0, harvest_date: '2026-08-30', description: 'Fresh farm harvest, packed same day.',
  });
  const submit = async () => {
    try {
      await api.createLot({ ...form, farmer_id: 'f1' });
      toast('Digital lot created. Buyers can now view and offer.', 'success');
      setOpen(false);
      reload();
    } catch {
      toast('Could not create lot.', 'error');
    }
  };
  return (
    <div className="card">
      <SectionHeader title="My digital lots" sub="Quality-graded, geo-tagged, buyer-ready" action={<button className="btn-primary" onClick={() => setOpen(true)}>+ Create lot</button>} />
      {lots.length === 0 ? (
        <EmptyState title="No lots yet" sub="Create your first digital lot to start receiving buyer offers." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lots.map((l) => (
            <Link to={`/app/lots/${l.id}`} key={l.id} className="rounded-xl border border-slate-100 p-4 hover:border-leaf-300 hover:shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-ink-900">{l.id}</p>
                <Badge tone={statusTone(l.status)}>{prettifyStatus(l.status)}</Badge>
              </div>
              <p className="mt-1 text-sm font-semibold capitalize text-ink-700">{l.crop} · {l.quantity_kg.toLocaleString('en-IN')} kg · Grade {l.quality}</p>
              <p className="mt-0.5 text-xs text-slate-500">{l.market} · {fmtDate(l.harvest_date)} harvest · {l.seller}</p>
              <p className="mt-2 text-sm font-bold text-leaf-700">Expected ₹{inr2(l.expected_price_per_kg)}/kg</p>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create a digital lot" wide>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Crop</label>
            <select className="input" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>
              {CROPS.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className="label">Quantity (kg)</label><input type="number" className="input" value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: +e.target.value })} /></div>
          <div><label className="label">Quality grade</label>
            <select className="input" value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
              {['A', 'B', 'C'].map((q) => <option key={q}>Grade {q}</option>)}
            </select></div>
          <div><label className="label">Target market</label>
            <select className="input" value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })}>
              {['Pimpalgaon APMC', 'Nashik APMC', 'Lasalgaon APMC', 'Vashi APMC (Navi Mumbai)'].map((m) => <option key={m}>{m}</option>)}
            </select></div>
          <div><label className="label">Expected price (₹/kg)</label><input type="number" step="0.1" className="input" value={form.expected_price_per_kg} onChange={(e) => setForm({ ...form, expected_price_per_kg: +e.target.value })} /></div>
          <div><label className="label">Harvest date</label><input type="date" className="input" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Create lot</button>
        </div>
      </Modal>
    </div>
  );
}

function OffersView({ offers, toast, reloadOffer }: { offers: Offer[]; toast: (m: string, k?: 'success' | 'error' | 'info') => void; reloadOffer: () => void }) {
  const [thread, setThread] = useState<Record<string, any[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const loadThread = async (offerId: string) => {
    const off = offers.find((o) => o.id === offerId);
    if (!off) return;
    const detail = await api.lotDetail(off.lot_id);
    setThread((t) => ({ ...t, [offerId]: detail.negotiations }));
  };
  const send = async (offerId: string) => {
    const msg = notes[offerId] ?? '';
    if (!msg) return;
    await api.negotiate({ offer_id: offerId, side: 'seller', message: msg });
    setNotes((n) => ({ ...n, [offerId]: '' }));
    await loadThread(offerId);
    toast('Message sent to buyer.', 'success');
    reloadOffer();
  };
  const accept = async (offerId: string) => {
    await api.acceptOffer(offerId);
    toast('Offer accepted — order, logistics and payment initiated!', 'success');
    reloadOffer();
  };
  return (
    <div className="space-y-4">
      {offers.length === 0 && <EmptyState title="No offers" sub="Offers buyers place on your lots will appear here." />}
      {offers.map((o) => (
        <div key={o.id} className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-ink-900">{o.buyer} <Badge tone={statusTone(o.status)}>{prettifyStatus(o.status)}</Badge></p>
              <p className="text-sm text-slate-600">{o.message}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-leaf-700">{inr2(o.price_per_kg)}<span className="text-sm font-semibold text-slate-500">/kg</span></p>
              <p className="text-xs text-slate-500">{o.quantity_kg.toLocaleString('en-IN')} kg · {o.delivery_days}d delivery</p>
            </div>
          </div>

          <button onClick={() => loadThread(o.id)} className="btn-ghost mt-3 p-1.5 text-xs">
            {thread[o.id] ? 'Hide negotiation' : 'Show negotiation thread'}
          </button>

          {thread[o.id] && (
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
              {thread[o.id].length === 0 && <p className="text-xs text-slate-500">No messages yet.</p>}
              {thread[o.id].map((n) => (
                <div key={n.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${n.side === 'buyer' ? 'bg-white border border-slate-200' : 'bg-leaf-100 text-leaf-900'}`}>
                  <span className="text-[10px] font-bold uppercase text-slate-500">{n.side} · {n.price_per_kg ? `₹${inr2(n.price_per_kg)}/kg` : 'note'}</span>
                  <p className="mt-0.5">{n.message}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <input className="input" placeholder="Reply to buyer…" value={notes[o.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [o.id]: e.target.value }))} />
                <button className="btn-primary" onClick={() => send(o.id)}><Send className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button className="btn-primary" disabled={o.status === 'accepted'} onClick={() => accept(o.id)}><CheckCircle2 className="h-4 w-4" /> Accept offer</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LogisticsView({ logistics }: { logistics: any[]; orders: any[] }) {
  return (
    <div className="card">
      <SectionHeader title="Logistics & delivery" sub="Track your consignments from farm gate to market" />
      {logistics.length === 0 ? <EmptyState title="No active consignments" /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {logistics.map((l) => (
            <div key={l.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold capitalize text-ink-900">{l.carrier}</p>
                <Badge tone={statusTone(l.status)}>{prettifyStatus(l.status)}</Badge>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600"><Truck className="h-3.5 w-3.5" /> {l.from} → {l.to} · {l.distance_km} km</p>
              <p className="mt-0.5 text-xs text-slate-500">Order {l.order_id} · ETA {l.eta ? fmtDate(l.eta) : '—'} · cost {inr(l.cost)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsView({ payments }: { payments: any[] }) {
  const since7d = payments.filter((p) => p.status === 'settled');
  return (
    <div className="card">
      <SectionHeader title="Payments" sub="Settlement ledger for your orders" />
      {since7d.length === 0 && <EmptyState title="No payments yet" />}
      <div className="space-y-2">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-100 text-leaf-700"><Banknote className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-bold text-ink-900">{p.id} · {p.method}</p>
                <p className="text-xs text-slate-500">Order {p.order_id}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-ink-900">{inr2(p.amount)}</p>
              <Badge tone={statusTone(p.status)}>{prettifyStatus(p.status)}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrievancesView({ list, toast }: { list: GrievanceItem[]; toast: (m: string, k?: 'success' | 'error' | 'info') => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ order_id: '', category: 'payment', description: '' });
  const submit = async () => {
    if (!form.description.trim()) return;
    await api.createGrievance({ order_id: form.order_id || undefined, category: form.category, description: form.description, raised_by: 'farmer' });
    toast('Grievance registered with audit trail.', 'success');
    setOpen(false);
    setForm({ order_id: '', category: 'payment', description: '' });
  };
  return (
    <div className="card">
      <SectionHeader title="Grievances" sub="Raise and track disputes — every complaint is timestamped" action={<button className="btn-primary" onClick={() => setOpen(true)}>+ Raise grievance</button>} />
      {list.length === 0 ? <EmptyState title="Nothing here" /> : (
        <div className="space-y-2.5">
          {list.map((g) => (
            <div key={g.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600"><ShieldAlert className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-bold text-ink-900">{g.id} · {g.category}</p>
                  <p className="text-xs text-slate-600">{g.description}</p>
                  {g.resolution && <p className="mt-1 text-xs font-semibold text-leaf-700">Resolution: {g.resolution}</p>}
                </div>
              </div>
              <Badge tone={statusTone(g.status)}>{prettifyStatus(g.status)}</Badge>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Raise a grievance">
        <div className="space-y-3">
          <div><label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['payment', 'quality', 'logistics', 'dispute', 'other'].map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className="label">Order ID (optional)</label><input className="input" placeholder="ORD-3001" value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Submit</button>
        </div>
      </Modal>
    </div>
  );
}