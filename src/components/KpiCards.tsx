import { AlertTriangle, CalendarCheck, Inbox, PhoneCall } from 'lucide-react';
import type { Lead } from '../data/types';
import type { Tab } from '../screens/Dashboard';
import { median, needsIntervention } from '../lib/leadLogic';
import { fmtDuration } from '../lib/format';

export default function KpiCards({ leads, onSelectTab }: { leads: Lead[]; onSelectTab: (t: Tab) => void }) {
  const contacted = leads.filter((l) => l.firstContactAt);
  const booked = leads.filter((l) => l.bookingStatus === 'Booked');
  const action = leads.filter(needsIntervention);
  const humanReq = action.filter((l) => l.priority).length;
  const awaiting = leads.filter((l) => !l.firstContactAt && l.bookingStatus !== 'Not interested').length;
  const med = median(
    leads.filter((l) => l.aiCallAt && l.firstContactAt === l.aiCallAt).map((l) => (l.firstContactAt as number) - l.enquiryAt),
  );
  const pct = (n: number) => (leads.length ? Math.round((n / leads.length) * 100) : 0);

  return (
    <div className="kpis">
      <button className="kpi" onClick={() => onSelectTab('all')}>
        <span className="kpi__label"><Inbox size={16} /> New enquiries</span>
        <span className="kpi__value">{leads.length}</span>
        <span className="kpi__sub">{awaiting} not yet reached</span>
      </button>
      <button className="kpi" onClick={() => onSelectTab('all')}>
        <span className="kpi__label"><PhoneCall size={16} /> Contacted</span>
        <span className="kpi__value">{contacted.length}<small>{pct(contacted.length)}%</small></span>
        <span className="kpi__sub">
          Median AI first response <strong>{med != null ? fmtDuration(med) : '—'}</strong> · was 4–6 h
        </span>
      </button>
      <button className="kpi" onClick={() => onSelectTab('booked')}>
        <span className="kpi__label"><CalendarCheck size={16} /> Booked</span>
        <span className="kpi__value">{booked.length}<small>{pct(booked.length)}%</small></span>
        <span className="kpi__sub">Staff-confirmed appointments</span>
      </button>
      <button className={`kpi ${action.length ? 'kpi--alert' : ''}`} onClick={() => onSelectTab('action')}>
        <span className="kpi__label"><AlertTriangle size={16} /> Needs human follow-up</span>
        <span className="kpi__value">{action.length}</span>
        <span className="kpi__sub">{humanReq} prioritised human callback{humanReq === 1 ? '' : 's'} · View queue →</span>
      </button>
    </div>
  );
}
