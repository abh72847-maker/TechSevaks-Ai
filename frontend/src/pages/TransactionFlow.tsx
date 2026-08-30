import { ArrowRight, CheckCircle2, ClipboardList, FileSignature, HandCoins, PackagePlus, ShieldAlert, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Badge, { prettifyStatus, statusTone } from '../components/Badge';
import PageLoader from '../components/PageLoader';
import SectionHeader from '../components/SectionHeader';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import { inr2 } from '../utils/format';

const DEMO_LOT = 'KSL-1001';

export default function TransactionFlow() {
  const { toast } = useApp();
  const [busy, setBusy] = useState('');

  const lots = useFetch(() => api.listLots(), []);
  const offers = useFetch(() => api.listOffers(DEMO_LOT), [DEMO_LOT]);
  const orders = useFetch(() => api.listOrders(), []);
  const logistics = useFetch<any>(() => api.listLogistics(), []);
  const payments = useFetch(() => api.listPayments(), []);
  const grievances = useFetch(() => api.listGrievances(), []);

  const openedOffers = useMemo(() => (offers.data?.offers ?? []).filter((o) => o.status !== 'rejected'), [offers.data]);
  const acceptedOffer = openedOffers.find((o) => o.status === 'accepted');
  const myOrder = (orders.data?.orders ?? []).find((o) => (o as any).lot_id === DEMO_LOT || (o as any).offer_id === acceptedOffer?.id);
  const shipment = (logistics.data as any)?.logistics?.find((l: any) => l.order_id === myOrder?.id);
  const payment = payments.data?.payments.find((p) => p.order_id === myOrder?.id);
  const grievance = (grievances.data?.grievances ?? []).find((g) => g.lot_id === DEMO_LOT);

  if (lots.loading) return <PageLoader />;

  const stepDone = (s: number) => s < 1 ? true : s === 1 ? openedOffers.length > 0 : s === 2 ? !!acceptedOffer : s === 3 ? !!myOrder : s === 4 ? !!shipment : s === 5 ? (payment?.status === 'settled') : !!grievance;

  const run = async (id: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(id);
    try {
      await fn();
      toast(msg, 'success');
    } finally {
      setBusy('');
      offers.reload(); orders.reload(); logistics.reload(); payments.reload(); grievances.reload();
    }
  };

  const steps = [
    { id: 0, icon: PackagePlus, title: 'Lot created digitally', desc: 'Farmer lists KSL-1001 (Tomato · 1000 kg · Grade A · Nashik) with expected price.', tone: 'leaf' },
    { id: 1, icon: ClipboardList, title: 'Offers received & compared', desc: `AI ranked ${openedOffers.length} buyer offers; best: Star Agri Exports.`, tone: 'irrig' },
    { id: 2, icon: FileSignature, title: 'Negotiation closed · offer accepted', desc: 'Price ₹18.95/kg with 50% advance agreed.', tone: 'amber' },
    { id: 3, icon: CheckCircle2, title: 'Order confirmed (binding)', desc: 'Digital contract generated; order references lot + offer.', tone: 'violet' },
    { id: 4, icon: Truck, title: 'Logistics dispatched', desc: 'Transport booking + live tracking from APMC to buyer.', tone: 'leaf' },
    { id: 5, icon: HandCoins, title: 'Payment settled', desc: 'UPI/IMPS settlement; agricultural-market e-auction rules apply.', tone: 'amber' },
    { id: 6, icon: ShieldAlert, title: 'Grievance & support closed', desc: 'Quality dispute loop if needed; else marked resolved.', tone: 'slate' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SectionHeader title="End-to-end transaction flow" sub="Digital lot → offers → negotiation → binding order → logistics → payment → support" />

      <div className="card bg-gradient-to-r from-leaf-50 via-irrig-50 to-violet-50 p-4 text-sm">
        <p className="font-extrabold text-ink-900">Demo walkthrough</p>
        <p className="mt-0.5 text-ink-600">Use the action buttons to advance each step live — every click calls the real API (falling back to the bundled engine) and the step turns green when it is satisfied by current on-chain data.</p>
      </div>

      <div className="space-y-3">
        {steps.map((s) => {
          const done = stepDone(s.id);
          return (
            <div key={s.id} className={`card relative flex flex-wrap items-center gap-4 border-l-4 ${done ? 'border-leaf-500' : 'border-slate-200'}`}>
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${done ? 'bg-gradient-to-br from-leaf-500 to-irrig-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {done ? <CheckCircle2 className="h-6 w-6" /> : <s.icon className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-ink-900">{s.id + 1}. {s.title} {done && <span className="ml-1 text-xs font-bold text-leaf-600">✓</span>}</p>
                <p className="text-sm text-slate-600">{s.desc}</p>
                {s.id === 1 && openedOffers.map((o) => (
                  <p key={o.id} className="mt-1 text-xs text-slate-500">· {o.buyer}: ₹{inr2(o.price_per_kg)}/kg for {o.quantity_kg.toLocaleString('en-IN')} kg <Badge tone={statusTone(o.status)}>{prettifyStatus(o.status)}</Badge></p>
                ))}
                {s.id === 3 && myOrder && <p className="mt-1 text-xs text-slate-500">Order {(myOrder as any).id} · ₹{inr2((myOrder as any).amount)} · <Badge tone={statusTone((myOrder as any).status)}>{prettifyStatus((myOrder as any).status)}</Badge></p>}
                {s.id === 4 && shipment && <p className="mt-1 text-xs text-slate-500">{shipment.carrier} · {shipment.status} · ETA {shipment.eta}</p>}
                {s.id === 5 && payment && <p className="mt-1 text-xs text-slate-500">{payment.method} · ₹{inr2(payment.amount)} · {payment.status}</p>}
              </div>
              <div className="shrink-0">
                {s.id === 1 && openedOffers.length === 0 && (
                  <button className="btn-primary" disabled={busy === 'o'} onClick={() => run('o', async () => {
                    await api.createOffer({ lot_id: DEMO_LOT, buyer_id: 'b2', price_per_kg: 18.95, quantity_kg: 1000, delivery_days: 2, message: 'AI-matched quote with 50% advance.' });
                  }, 'Offer placed by Star Agri Exports.')}>Simulate buyer offer</button>
                )}
                {s.id === 2 && !acceptedOffer && openedOffers[0] && (
                  <button className="btn-primary" disabled={busy === 'a'} onClick={() => run('a', async () => {
                    await api.acceptOffer(openedOffers[0].id);
                  }, 'Offer accepted — order created.')}>Accept best offer</button>
                )}
                {s.id === 4 && myOrder && (
                  <button className="btn-primary" disabled={busy === 'l' || shipment?.status === 'delivered'} onClick={() => run('l', async () => {
                    const id = (logistics.data as any)?.logistics?.[0]?.id;
                    if (id) await api.advanceLogistics(id);
                  }, 'Shipment status advanced.')}>Advance shipment</button>
                )}
                {s.id === 5 && myOrder && payment && payment.status !== 'settled' && (
                  <button className="btn-primary" disabled={busy === 'p'} onClick={() => run('p', async () => {
                    await api.settlePayment(myOrder.id as string);
                  }, 'Payment settled (simulated UPI).')}>Settle payment</button>
                )}
                {s.id === 6 && !grievance && (
                  <button className="btn-primary" disabled={busy === 'g'} onClick={() => run('g', async () => {
                    await api.createGrievance({ lot_id: DEMO_LOT, category: 'weight_discrepancy', description: 'Small variance in delivered weight reported by buyer.', raised_by: 'buyer' });
                  }, 'Dispute logged.')}>Log sample dispute</button>
                )}
                {s.id === 6 && grievance && grievance.status !== 'resolved' && (
                  <button className="btn-primary" disabled={busy === 'g2'} onClick={() => run('g2', async () => {
                    await api.resolveGrievance(grievance.id as string);
                  }, 'Dispute resolved with FAW conciliation note.')}>Resolve dispute</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-ink-900 p-4 text-sm text-white">
        <p><span className="font-extrabold text-leaf-300">Sum of steps = trust.</span> Each digital artifact (offer, order, tracking, UPI, verdict) is verifiable end-to-end.</p>
        <Link to="/app/admin" className="btn-primary px-3 py-1.5 text-xs">Admin console <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}