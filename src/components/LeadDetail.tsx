import { useState } from 'react';
import { Bot, CalendarCheck, Check, Flag, FlaskConical, Phone, UserRound, X } from 'lucide-react';
import type { BookingStatus, Lead } from '../data/types';
import { MAX_AI_ATTEMPTS, STAFF } from '../data/constants';
import { useLeads, type SimOutcome } from '../store/LeadsContext';
import { needsIntervention, nextAction } from '../lib/leadLogic';
import { fmtDayTime, fmtDuration, fmtTime } from '../lib/format';
import { BookingBadge, CallBadge } from './StatusBadge';

const BOOKING_OPTIONS: BookingStatus[] = ['Pending', 'Interested', 'Slot requested', 'Follow-up Required', 'Booked', 'Not interested'];

function toSlotLabel(date: string, time: string) {
  const d = new Date(`${date}T${time}`);
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/^(\w+)/, '$1,');
  return `${day} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

function tomorrowISO() {
  const d = new Date(Date.now() + 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function LeadDetail({ lead, onClose, overlay }: { lead: Lead; onClose: () => void; overlay: boolean }) {
  const { dispatch } = useLeads();
  const [slotForm, setSlotForm] = useState(false);
  const [slotDate, setSlotDate] = useState(tomorrowISO);
  const [slotTime, setSlotTime] = useState('10:00');

  const na = nextAction(lead);
  const flagged = needsIntervention(lead);
  const contacted = lead.callStatus === 'Staff contacted';
  const closed = lead.bookingStatus === 'Booked' || lead.bookingStatus === 'Not interested';
  const canSimulate = lead.isDemo && (lead.callStatus === 'AI call queued' || (lead.callStatus === 'No Answer' && lead.callAttempts < MAX_AI_ATTEMPTS));

  const onBookingChange = (status: BookingStatus) => {
    if (status === 'Booked') {
      if (lead.requestedSlot) dispatch({ type: 'setBooking', id: lead.id, status, slot: lead.requestedSlot });
      else setSlotForm(true);
      return;
    }
    setSlotForm(false);
    dispatch({ type: 'setBooking', id: lead.id, status });
  };

  const aiCallText = () => {
    if (lead.aiOptOut) return lead.preference === 'human' ? 'Not called — patient chose a team callback' : 'AI calls disabled — patient opted out';
    if (!lead.aiCallAt) return 'Queued — not yet called';
    const firstAi = lead.firstContactAt === lead.aiCallAt;
    return `${fmtDayTime(lead.aiCallAt)}${firstAi ? ` · ${fmtDuration(lead.aiCallAt - lead.enquiryAt)} after enquiry` : ''}`;
  };

  const simulate = (outcome: SimOutcome) => dispatch({ type: 'simulate', id: lead.id, outcome });

  return (
    <aside className={`detail ${overlay ? 'detail--overlay' : ''}`} aria-label={`Lead details for ${lead.name}`}>
      <div className="detail__head">
        <div>
          <h2>{lead.name}</h2>
          <p className="muted">{lead.id} · {lead.clinic}</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close lead details"><X size={18} /></button>
      </div>

      <div className="detail__scroll">
        <div className={`next-box next-box--${na.tone}`}>
          <span className="next-box__label">{flagged ? 'Needs staff action' : 'Next recommended action'}</span>
          <span className="next-box__text">{na.label}</span>
          {lead.handoffReason && flagged && <span className="next-box__reason">Handoff reason: {lead.handoffReason}</span>}
        </div>

        {canSimulate && (
          <div className="sim">
            <div className="sim__title"><FlaskConical size={14} /> Prototype only — simulate AI call outcome</div>
            <div className="sim__btns">
              <button className="btn btn--sm btn--secondary" onClick={() => simulate('interested')}>Interested, requests slot</button>
              <button className="btn btn--sm btn--secondary" onClick={() => simulate('human')}>Asks for a person</button>
              <button className="btn btn--sm btn--secondary" onClick={() => simulate('clinical')}>Asks clinical question</button>
              <button className="btn btn--sm btn--secondary" onClick={() => simulate('noanswer')}>No answer</button>
            </div>
          </div>
        )}

        <dl className="facts">
          <div><dt>Phone</dt><dd>{lead.phone}</dd></div>
          <div><dt>Treatment interest</dt><dd>{lead.treatment}</dd></div>
          <div><dt>Preferred language</dt><dd>{lead.language}</dd></div>
          <div>
            <dt>Callback consent</dt>
            <dd>{lead.aiOptOut ? <span className="consent-tag consent-tag--human"><UserRound size={13} /> Human only</span> : <span className="consent-tag"><Bot size={13} /> AI call consented</span>}</dd>
          </div>
          <div><dt>Enquiry received</dt><dd>{fmtDayTime(lead.enquiryAt)}</dd></div>
          <div><dt>AI callback</dt><dd>{aiCallText()}</dd></div>
          <div><dt>Call status</dt><dd><CallBadge status={lead.callStatus} />{!lead.aiOptOut && <span className="muted"> · AI attempts {lead.callAttempts}/{MAX_AI_ATTEMPTS}</span>}</dd></div>
          <div>
            <dt>Booking status</dt>
            <dd>
              <BookingBadge status={lead.bookingStatus} />
              {(lead.confirmedSlot || lead.requestedSlot) && <span className="muted"> · {lead.confirmedSlot ?? `requested ${lead.requestedSlot}`}</span>}
            </dd>
          </div>
          <div>
            <dt><label htmlFor="assign">Assigned to</label></dt>
            <dd>
              <select id="assign" className="inline-select" value={lead.assignedTo} onChange={(e) => dispatch({ type: 'assign', id: lead.id, staff: e.target.value })}>
                {STAFF.map((s) => <option key={s}>{s}</option>)}
              </select>
            </dd>
          </div>
        </dl>

        <section className="summary-box">
          <div className="summary-box__head">
            <span><Bot size={14} /> AI interaction summary</span>
            <span className="muted">AI-generated · verify with patient</span>
          </div>
          <p>{lead.summary}</p>
        </section>

        <section className="actions">
          <h3>Staff actions</h3>

          {lead.bookingStatus === 'Slot requested' && lead.requestedSlot && (
            <button className="btn btn--primary btn--block" onClick={() => dispatch({ type: 'setBooking', id: lead.id, status: 'Booked', slot: lead.requestedSlot })}>
              <CalendarCheck size={16} /> Confirm slot · {lead.requestedSlot}
            </button>
          )}

          <div className="actions__row">
            <button className="btn btn--secondary" disabled={contacted || closed} onClick={() => dispatch({ type: 'markContacted', id: lead.id })}>
              {contacted ? <><Check size={16} /> Contacted</> : <><Phone size={16} /> Mark as contacted</>}
            </button>
            <button className="btn btn--secondary" disabled={!flagged} onClick={() => dispatch({ type: 'completeFollowUp', id: lead.id })}>
              <Check size={16} /> {lead.followUpDone ? 'Follow-up completed' : 'Mark follow-up complete'}
            </button>
          </div>

          <button
            className={`btn btn--block ${lead.priority ? 'btn--priority-on' : 'btn--secondary'}`}
            disabled={closed}
            aria-pressed={lead.priority}
            onClick={() => dispatch({ type: 'togglePriority', id: lead.id })}
          >
            <Flag size={16} /> {lead.priority ? 'Prioritised human callback — remove' : 'Prioritise human callback'}
          </button>

          <label className="field">
            <span>Update booking status</span>
            <select value={slotForm ? 'Booked' : lead.bookingStatus} onChange={(e) => onBookingChange(e.target.value as BookingStatus)}>
              {BOOKING_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>

          {slotForm && (
            <div className="slot-form">
              <p className="muted">Enter the slot you have confirmed in the clinic calendar. No live calendar is connected in this prototype.</p>
              <div className="slot-form__row">
                <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} aria-label="Appointment date" />
                <input type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} aria-label="Appointment time" />
              </div>
              <div className="slot-form__row">
                <button className="btn btn--primary btn--sm" disabled={!slotDate || !slotTime} onClick={() => { dispatch({ type: 'setBooking', id: lead.id, status: 'Booked', slot: toSlotLabel(slotDate, slotTime) }); setSlotForm(false); }}>
                  Confirm appointment
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => setSlotForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </section>

        <section className="timeline">
          <h3>Activity</h3>
          <ol>
            {lead.activity.map((a, i) => (
              <li key={i} className={`tl tl--${a.actor.toLowerCase()}`}>
                <span className="tl__dot" aria-hidden />
                <div>
                  <span className="tl__text">{a.text}</span>
                  <span className="muted">{a.actor} · {fmtTime(a.at)}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  );
}
