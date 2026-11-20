import { Flag } from 'lucide-react';
import type { Lead } from '../data/types';
import { BookingBadge, CallBadge } from './StatusBadge';
import { needsIntervention, nextAction } from '../lib/leadLogic';
import { fmtAgo, fmtTime } from '../lib/format';

interface Props {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function LeadTable({ leads, selectedId, onSelect }: Props) {
  if (!leads.length) {
    return <div className="empty">No enquiries match this view.</div>;
  }
  return (
    <div className="table-wrap">
      <table className="leads">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Treatment interest</th>
            <th>Clinic</th>
            <th>Enquiry time</th>
            <th>Call status</th>
            <th>Booking status</th>
            <th>Next action</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const na = nextAction(l);
            const flagged = needsIntervention(l);
            return (
              <tr
                key={l.id}
                className={`${selectedId === l.id ? 'is-selected' : ''} ${flagged ? 'is-flagged' : ''} ${flagged && l.priority ? 'is-priority' : ''}`}
                onClick={() => onSelect(l.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(l.id))}
                tabIndex={0}
                aria-selected={selectedId === l.id}
              >
                <td>
                  <div className="cell-patient">
                    <span className="cell-patient__name">
                      {l.name}
                      {l.priority && flagged && <Flag size={13} className="flag" aria-label="Priority" />}
                      {l.isDemo && <span className="mini-tag">From patient screen</span>}
                    </span>
                    <span className="muted">{l.phone} · {l.language}</span>
                  </div>
                </td>
                <td>{l.treatment}</td>
                <td className="muted-strong">{l.clinic.split(',')[0]}</td>
                <td>
                  <div className="cell-time">
                    <span>{fmtTime(l.enquiryAt)}</span>
                    <span className="muted">{fmtAgo(l.enquiryAt)}</span>
                  </div>
                </td>
                <td><CallBadge status={l.callStatus} /></td>
                <td><BookingBadge status={l.bookingStatus} /></td>
                <td>
                  <span className={`next next--${na.tone}`}>
                    <span className="next__dot" aria-hidden />
                    {na.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
