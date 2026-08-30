import { ArrowLeft, CheckCircle2, Send, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import Badge, { prettifyStatus, statusTone } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import SectionHeader from '../components/SectionHeader';
import { useApp } from '../context/AppContext';
import { useFetch } from '../hooks/useFetch';
import type { Lot } from '../types';
import { daysUntil, fmtDate, inr2 } from '../utils/format';

export default function LotDetail() {
  const { id } = useParams();
  const lotId = id || 'KSL-1001';
  const { toast } = useApp();
  const detail = useFetch(() => api.lotDetail(lotId), [lotId]);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (window.scrollTo) window.scrollTo(0, 0);
  }, [lotId]);

  if (detail.loading) return <PageLoader />;
  if (!detail.data) return <EmptyState title="Lot not found" sub={`No data for ${lotId}`} />;

  const lot: Lot = detail.data.lot;
  const isFpoLot = lot.seller_type === 'fpo';

  const sendReply = async () => {
    if (!reply.trim()) return;
    await api.negotiate({ offer_id: detail.data?.offers[0]?.id, side: lot.seller_type === 'fpo' ? 'fpo' : 'farmer', message: reply.trim() });
    setReply('');
    toast('Counter-message sent.', 'success');
    detail.reload();
  };

  const acceptOffer = async (offerId: string) => {
    await api.createOrder({ offer_id: offerId, note: `Accepted on lot ${lot.id}` });
    toast('Accepted — order + logistics + payment created. See Transaction flow.', 'success');
    detail.reload();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link to="/app/lots" className="inline-flex items-center gap-1.5 text-sm font-semibold text-irrig-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to lots
      </Link>

      <div className="card bg-gradient-to-r from-ink-900 to-ink-800 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold">{lot.id}</h1>
              <Badge tone={statusTone(lot.status) as any}>{prettifyStatus(lot.status)}</Badge>
              {isFpoLot && <Badge tone="violet">FPO bulk lot</Badge>}
            </div>
            <p className="mt-1 capitalize text-white/70">{lot.crop} · {lot.quantity_kg.toLocaleString('en-IN')} kg · Grade {lot.grade} · {lot.market}</p>
            <p className="text-sm text-white/60">{lot.seller} · {lot.location} · harvest {fmtDate(lot.harvest_date)}{daysUntil(lot.harvest_date) ? ` (${daysUntil(lot.harvest_date)}d)` : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-leaf-300">{inr2(lot.expected_price_per_kg)}<span className="text-sm text-white/60">/kg expected</span></p>
            <p className="text-sm text-white/60">{lot.quantity_kg.toLocaleString('en-IN')} kg → est. {(lot.expected_price_per_kg * lot.quantity_kg / 100000).toFixed(2)}L</p>
          </div>
        </div>
        {lot.description && <p className="mt-3 max-w-3xl text-sm text-white/70">{lot.description}</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <SectionHeader title="Offers received" sub={`${detail.data.offers.length} buyer offers`} />
          {detail.data.offers.length === 0 ? <EmptyState title="No offers yet" sub="Buyers have not bid on this lot yet." /> : (
            <div className="space-y-3">
              {detail.data.offers.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-leaf-500 to-irrig-500 text-xs font-extrabold text-white">{o.buyer.slice(0, 1)}</span>
                      <div>
                        <p className="text-sm font-bold text-ink-900">{o.buyer}</p>
                        <p className="text-xs text-slate-500">{o.quantity_kg.toLocaleString('en-IN')} kg · {o.delivery_days}d delivery · {o.created_at}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-leaf-700">{inr2(o.price_per_kg)}<span className="text-xs text-slate-500">/kg</span></p>
                      <Badge tone={statusTone(o.status)}>{prettifyStatus(o.status)}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    <button className="btn-primary px-3 py-1.5 text-xs" disabled={o.status === 'accepted'} onClick={() => acceptOffer(o.id)}><CheckCircle2 className="h-4 w-4" /> Accept & convert to order</button>
                    <Link to="/app/flow" className="btn-secondary px-3 py-1.5 text-xs"><Truck className="h-4 w-4" /> Track order</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <SectionHeader title="Quality snapshot" sub="Verified & self-reported quality fields" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['Grade', `Grade ${lot.grade}`],
              ['Moisture', '≤ 4% (self-reported)'],
              ['Physical purity', '≥ 97%'],
              ['Packaging', '20 kg net jute bag'],
              ['Pest report', isFpoLot ? 'FPO certified' : 'Farm lab verified'],
              ['Aggregation', isFpoLot ? `${(detail.data as any).quality?.farmers ?? 24} farmers bundled` : 'Single origin'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase text-slate-500">{k}</p>
                <div className="mt-1 flex items-center gap-1 text-sm font-bold text-ink-900"><ShieldCheck className="h-3.5 w-3.5 text-leaf-600" />{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-irrig-200 bg-irrig-50 p-3 text-xs text-irrig-800">
            Simulated demo quality. In production this links to FAW lab certificates, cold-chain logs and farmer/FPO self-declared data.
          </div>
        </div>
      </div>

      <div className="card">
        <SectionHeader title="Negotiation thread" sub="Structured counter-offers, tracked contractually" />
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {detail.data.negotiations.length === 0 && <EmptyState title="Start the conversation" sub="Send a counter-message to the first offer." />}
          {detail.data.negotiations.map((n) => (
            <div key={n.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${n.side === 'buyer' ? 'bg-white border border-slate-200' : 'bg-leaf-100 text-leaf-900'}`}>
              <span className="text-[10px] font-bold uppercase text-slate-500">{n.side}{n.price_per_kg ? ` · ₹${inr2(n.price_per_kg)}/kg` : ''}</span>
              <p className="mt-0.5">{n.message}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Counter with price / message…" />
          <button className="btn-primary" onClick={sendReply} disabled={!reply.trim()}><Send className="h-4 w-4" /> Send</button>
        </div>
      </div>
    </div>
  );
}