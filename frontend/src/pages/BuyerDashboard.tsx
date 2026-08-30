import { Boxes, CheckCircle2, HandCoins, Send, Truck, Wallet2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Badge, { prettifyStatus, statusTone } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import PageLoader from '../components/PageLoader';
import ProgressRing from '../components/ProgressRing';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import type { Lot } from '../types';
import { daysUntil, fmtDate, inr2 } from '../utils/format';

const DEMO_BUYER = 'b2';

export default function BuyerDashboard() {
  const { toast } = useApp();
  const [tab, setTab] = useState('discover');
  const [draft, setDraft] = useState<{ lot: Lot | null; price: string }>({ lot: null, price: '' });
  const [thread, setThread] = useState<Record<string, any[]>>({});

  const lots = useFetch(() => api.listLots({ status: 'available' }), []);
  const match = useFetch(() => api.buyerMatch({ crop: 'tomato', quantity_kg: 1500, quality: 'A', location: 'Nashik', market: 'Pimpalgaon APMC' }), []);
  const offers = useFetch(() => api.listOffers(), []);
  const orders = useFetch(() => api.listOrders(), []);
  const logistics = useFetch(() => api.listLogistics(), []);
  const payments = useFetch(() => api.listPayments(), []);

  const myOffers = useMemo(() => (offers.data?.offers ?? []).filter((o) => o.buyer_id === DEMO_BUYER), [offers.data]);
  const myOrders = useMemo(() => (orders.data?.orders ?? []).filter((o) => (o as any).buyer_id === DEMO_BUYER), [orders.data]);
  const recommendedLots = useMemo(() => {
    const ranked = match.data?.matches ?? [];
    const set = new Set(ranked.map((r: any) => r.buyer.id));
    return { ranked, set };
  }, [match.data]);

  const placeOffer = async (lot: Lot) => {
    await api.createOffer({
      lot_id: lot.id, buyer_id: DEMO_BUYER, price_per_kg: parseFloat(draft.price) || lot.expected_price_per_kg * 1.02,
      quantity_kg: lot.quantity_kg, delivery_days: 2, message: 'Ready to close. Payment as per terms.',
    });
    setDraft({ lot: null, price: '' });
    toast(`Offer placed on ${lot.id}`, 'success');
    lots.reload();
    offers.reload();
  };

  const loadThread = async (offerId: string) => {
    const off = myOffers.find((o) => o.id === offerId);
    const detail = off ? await api.lotDetail(off.lot_id) : null;
    if (detail) setThread((t) => ({ ...t, [offerId]: detail.negotiations }));
  };

  const acceptOrder = async (offerId: string) => {
    await api.createOrder({ offer_id: offerId, note: 'Buyer confirmed' });
    toast('Order confirmed — logistics & payment pipeline created.', 'success');
    offers.reload();
    orders.reload();
    logistics.reload();
  };

  const settle = async (orderId: string) => {
    await api.settlePayment(orderId);
    toast('Payment settled (demo UPI).', 'success');
    payments.reload();
    orders.reload();
  };

  if (lots.loading) return <PageLoader />;

  const tabs = [
    { id: 'discover', label: 'Discover & Offer' },
    { id: 'ai', label: 'AI Recommended' },
    { id: 'offers', label: `My Offers (${myOffers.length})` },
    { id: 'orders', label: 'Orders & Logistics' },
    { id: 'payments', label: 'Payments' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-irrig-50 to-leaf-50">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-irrig-500 to-irrig-700 text-xl font-extrabold text-white">SE</span>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900">Star Agri Exports</h1>
            <p className="text-sm text-ink-600">Nashik · Export · ₹19.4/kg tomato · 50% advance · reliability 93%</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone="green" dot>KYC verified</Badge>
          <Badge tone="blue" dot>Active buyer</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Boxes} label="Available lots" value={lots.data?.lots.length ?? 0} sub="matching tomato & more" accent="leaf" />
        <StatCard icon={HandCoins} label="Avg best quote" value="₹19.4/kg" sub="for tomato Grade A" accent="irrig" />
        <StatCard icon={CheckCircle2} label="Open offers" value={myOffers.filter((o) => ['pending', 'countered'].includes(o.status)).length} sub={`accepted ${myOffers.filter((o) => o.status === 'accepted').length}`} accent="amber" />
        <StatCard icon={Truck} label="In-transit orders" value={((logistics.data?.logistics as unknown as { status: string }[]) ?? []).filter((l) => l.status === 'in_transit').length} accent="violet" />
      </div>

      <div className="mb-1 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`tab ${tab === t.id ? 'tab-active' : ''}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'discover' && (
        <div className="card">
          <SectionHeader title="Digital lots in the marketplace" sub={`${lots.data?.lots.length ?? 0} lots available now`} />
          {lots.data?.lots.length === 0 ? <EmptyState title="No lots available" /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lots.data?.lots.map((lot) => (
                <div key={lot.id} className="rounded-xl border border-slate-100 p-4 hover:border-leaf-300 hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-ink-900">{lot.id}</p>
                    <Badge tone={statusTone(lot.status)}>{prettifyStatus(lot.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm capitalize font-bold text-ink-700">{lot.crop} · {lot.quantity_kg.toLocaleString('en-IN')} kg · {lot.grade}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{lot.location} · {lot.market} · {lot.seller}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Harvest {fmtDate(lot.harvest_date)}{daysUntil(lot.harvest_date) ? ` · ${daysUntil(lot.harvest_date)}d` : ''}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-extrabold text-leaf-700">₹{inr2(lot.expected_price_per_kg)}<span className="text-xs font-semibold text-slate-500">/kg expected</span></p>
                    <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setDraft({ lot, price: '' })}>Make offer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'ai' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card">
            <SectionHeader title="AI lot recommendations" sub="Lots ranked against your active demand profile" />
            <div className="space-y-2">
              {(recommendedLots.ranked as any[]).slice(0, 6).map((r, i) => {
                return (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <ProgressRing value={r.match_score} size={44} tone="leaf" />
                      <div>
                        <p className="text-sm font-bold text-ink-900">{r.buyer.company}</p>
                        <p className="text-xs text-slate-500">₹{inr2(r.requirement.price_per_kg)}/kg · {r.distance_km}km · {r.requirement.payment_terms_days}d payment</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 hidden sm:block">match</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <SectionHeader title="Recommended lots to bid on" sub="Based on tomato Grade A demand band" />
            <div className="space-y-2">
              {(lots.data?.lots ?? []).filter((l) => l.crop === 'tomato').slice(0, 5).map((lot) => (
                <div key={lot.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div>
                    <Link to={`/app/lots/${lot.id}`} className="text-sm font-bold text-irrig-700 hover:underline">{lot.id} · {lot.quantity_kg.toLocaleString('en-IN')} kg · {lot.grade}</Link>
                    <p className="text-xs text-slate-500">{lot.location} · {lot.market} · harvest {fmtDate(lot.harvest_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-leaf-700">₹{inr2(lot.expected_price_per_kg)}</span>
                    <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setDraft({ lot, price: '' })}>Offer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'offers' && (
        <div className="space-y-4">
          {myOffers.length === 0 && <EmptyState title="You haven't placed any offers yet" sub="Browse lots and make your first offer." />}
          {myOffers.map((o) => (
            <div key={o.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-ink-900">Offer {o.id} → lot {o.lot_id} <Badge tone={statusTone(o.status)}>{prettifyStatus(o.status)}</Badge></p>
                  <p className="text-sm text-slate-600">{o.message}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-leaf-700">{inr2(o.price_per_kg)}<span className="text-sm text-slate-500">/kg</span></p>
                  <p className="text-xs text-slate-500">{o.quantity_kg.toLocaleString('en-IN')} kg · {o.delivery_days}d delivery</p>
                </div>
              </div>
              <button onClick={() => loadThread(o.id)} className="btn-ghost mt-3 p-1.5 text-xs">Negotiation thread</button>
              {thread[o.id] && (
                <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                  {thread[o.id].map((n) => (
                    <div key={n.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${n.side === 'buyer' ? 'bg-white border border-slate-200' : 'bg-leaf-100 text-leaf-900'}`}>
                      <span className="text-[10px] font-bold uppercase text-slate-500">{n.side} · {n.price_per_kg ? `₹${inr2(n.price_per_kg)}/kg` : 'note'}</span>
                      <p className="mt-0.5">{n.message}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input className="input" placeholder="Reply…" id={`reply-${o.id}`} />
                    <button className="btn-primary" onClick={async () => {
                      const el = document.getElementById(`reply-${o.id}`) as HTMLInputElement;
                      if (el.value) {
                        await api.negotiate({ offer_id: o.id, side: 'buyer', message: el.value });
                        el.value = '';
                        toast('Reply sent.', 'success');
                        await loadThread(o.id);
                      }
                    }}><Send className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button className="btn-primary" disabled={o.status === 'accepted'} onClick={() => acceptOrder(o.id)}><CheckCircle2 className="h-4 w-4" /> Confirm order</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="card">
          <SectionHeader title="Orders & logistics" sub="From confirmed order to delivered goods" />
          {myOrders.length === 0 && <EmptyState title="No confirmed orders" />}
          <div className="space-y-3">
            {myOrders.map((o) => {
              const lod = (logistics.data?.logistics as any[] ?? []).find((l) => l.order_id === o.id);
              return (
                <div key={o.id as string} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-extrabold text-ink-900">{(o as any).id} · Lot {(o as any).lot_id} <Badge tone={statusTone((o as any).status)}>{prettifyStatus((o as any).status)}</Badge></p>
                    <p className="font-extrabold text-leaf-700">{inr2((o as any).amount)}</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {lod && (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <Truck className="h-4 w-4 text-irrig-600" />
                        {lod.carrier}: {lod.from} → {lod.to} ({lod.distance_km}km) · {prettifyStatus(lod.status)}
                      </div>
                    )}
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <Wallet2 className="h-4 w-4 text-leaf-600" /> {(payments.data?.payments ?? []).find((p) => p.order_id === o.id)?.status ?? '—'} payment
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="card">
          <SectionHeader title="Payment tracking" sub="Settlement ledger for your orders" />
          <div className="space-y-2">
            {payments.data?.payments.length === 0 && <EmptyState title="No payments yet" />}
            {payments.data?.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Wallet2 className="h-4 w-4 text-leaf-600" />
                  <p className="text-sm font-bold text-ink-900">{p.id} · {p.method} · order {p.order_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold text-ink-900">{inr2(p.amount)}</p>
                  <Badge tone={statusTone(p.status)}>{prettifyStatus(p.status)}</Badge>
                  {p.status === 'pending' && <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => settle(p.order_id)}>Simulate settlement</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!draft.lot} onClose={() => setDraft({ lot: null, price: '' })} title={`Place offer · ${draft.lot?.id}`}>
        {draft.lot && (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-bold capitalize text-ink-900">{draft.lot.crop} · {draft.lot.quantity_kg.toLocaleString('en-IN')} kg · {draft.lot.grade}</p>
              <p className="text-xs text-slate-500">{draft.lot.location} · {draft.lot.seller} · expected ₹{inr2(draft.lot.expected_price_per_kg)}/kg</p>
            </div>
            <div><label className="label">Your offer (₹/kg)</label>
              <input type="number" step="0.1" className="input" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder={`${(draft.lot.expected_price_per_kg * 1.02).toFixed(1)} suggested`} /></div>
            <div className="rounded-xl border border-irrig-200 bg-irrig-50 p-3 text-xs text-irrig-800">
              Your profile: 50% advance · same-day settlement · verified exporter. Recommended offer: ₹{(draft.lot.expected_price_per_kg * 1.02).toFixed(1)}/kg (matches AI WHO match).
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary" onClick={() => setDraft({ lot: null, price: '' })}>Cancel</button>
              <button className="btn-primary" onClick={() => placeOffer(draft.lot!)}>Place offer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}