import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import Logo from '../components/Logo';
import KpiCards from '../components/KpiCards';
import LeadTable from '../components/LeadTable';
import LeadDetail from '../components/LeadDetail';
import { CLINICS, CURRENT_STAFF } from '../data/constants';
import { useLeads, DEMO_ID } from '../store/LeadsContext';
import { needsIntervention, sortLeads } from '../lib/leadLogic';
import { isSameDay } from '../lib/format';

export type Tab = 'all' | 'action' | 'booked';
type DateFilter = 'today' | 'yesterday' | 'week';

const WIDE = '(min-width: 1280px)';

export default function Dashboard() {
  const { leads } = useLeads();
  const [clinic, setClinic] = useState<string>('all');
  const [date, setDate] = useState<DateFilter>('today');
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [isWide, setIsWide] = useState(() => window.matchMedia(WIDE).matches);

  const scoped = useMemo(() => {
    const now = Date.now();
    return leads.filter((l) => {
      if (clinic !== 'all' && l.clinic !== clinic) return false;
      if (date === 'today') return isSameDay(l.enquiryAt, now);
      if (date === 'yesterday') return isSameDay(l.enquiryAt, now - 86_400_000);
      return now - l.enquiryAt < 7 * 86_400_000;
    });
  }, [leads, clinic, date]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = scoped.filter((l) => {
      if (tab === 'action' && !needsIntervention(l)) return false;
      if (tab === 'booked' && l.bookingStatus !== 'Booked') return false;
      if (q && !`${l.name} ${l.phone} ${l.treatment}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return sortLeads(list);
  }, [scoped, tab, query]);

  const actionCount = scoped.filter(needsIntervention).length;
  const bookedCount = scoped.filter((l) => l.bookingStatus === 'Booked').length;

  // Open the patient's own enquiry when arriving from the patient screen, else the top-priority lead on wide screens.
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (leads.some((l) => l.id === DEMO_ID)) return DEMO_ID;
    return window.matchMedia(WIDE).matches ? sortLeads(leads.filter(needsIntervention))[0]?.id ?? null : null;
  });
  const selected = leads.find((l) => l.id === selectedId) ?? null;

  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const onChange = () => setIsWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isWide && selected) {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedId(null);
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [isWide, selected]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All enquiries', count: scoped.length },
    { id: 'action', label: 'Needs staff action', count: actionCount },
    { id: 'booked', label: 'Booked', count: bookedCount },
  ];

  return (
    <div className="dash">
      <header className="dash__header">
        <div className="dash__brand">
          <Logo sub="Front desk" />
        </div>
        <div className="dash__filters">
          <label className="select">
            <MapPin size={15} aria-hidden />
            <span className="sr-only">Clinic</span>
            <select value={clinic} onChange={(e) => setClinic(e.target.value)}>
              <option value="all">All clinics (12)</option>
              {CLINICS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="select">
            <CalendarDays size={15} aria-hidden />
            <span className="sr-only">Date</span>
            <select value={date} onChange={(e) => setDate(e.target.value as DateFilter)}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 days</option>
            </select>
          </label>
        </div>
        <div className="dash__user">
          <span className="avatar" aria-hidden>PN</span>
          <span className="dash__user-name">{CURRENT_STAFF}<small>Front desk</small></span>
        </div>
      </header>

      <div className="dash__body">
        <div className="dash__main">
          <div className="dash__title">
            <div>
              <h1>Enquiry-to-appointment queue</h1>
              <p>AI handles first callbacks and routine questions. You handle handoffs, clinical questions and slot confirmation.</p>
            </div>
            <span className="proto-tag">Prototype data · not live</span>
          </div>

          <KpiCards leads={scoped} onSelectTab={setTab} />

          <section className="panel">
            <div className="panel__toolbar">
              <div className="tabs" role="tablist" aria-label="Queue views">
                {tabs.map((t) => (
                  <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                    {t.label}
                    <span className={`count ${t.id === 'action' && t.count ? 'count--alert' : ''}`}>{t.count}</span>
                  </button>
                ))}
              </div>
              <label className="search">
                <Search size={15} aria-hidden />
                <span className="sr-only">Search patients</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient or treatment" />
              </label>
            </div>
            <LeadTable leads={visible} selectedId={selectedId} onSelect={setSelectedId} />
          </section>
        </div>

        {selected && (
          <>
            {!isWide && <div className="scrim" onClick={() => setSelectedId(null)} aria-hidden />}
            <LeadDetail key={selected.id} lead={selected} onClose={() => setSelectedId(null)} overlay={!isWide} />
          </>
        )}
      </div>
    </div>
  );
}
