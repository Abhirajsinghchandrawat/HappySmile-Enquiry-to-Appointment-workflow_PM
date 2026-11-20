import type { Lead } from '../data/types';
import { MAX_AI_ATTEMPTS } from '../data/constants';
import { fmtTime, fmtDayTime } from './format';

export type ActionTone = 'urgent' | 'action' | 'auto' | 'done';

/** A lead needs staff intervention when the AI workflow cannot (or must not) progress it alone. */
export function needsIntervention(l: Lead): boolean {
  if (l.followUpDone || l.bookingStatus === 'Booked' || l.bookingStatus === 'Not interested') return false;
  if (l.callStatus === 'Human requested' || l.callStatus === 'Human Handoff') return true;
  if (l.bookingStatus === 'Slot requested' || l.bookingStatus === 'Follow-up Required') return true;
  if (l.callStatus === 'No Answer' && l.callAttempts >= MAX_AI_ATTEMPTS) return true;
  if (l.callStatus === 'Staff contacted' && l.bookingStatus === 'Pending') return true;
  if (l.bookingStatus === 'Interested' && !l.nextRetryAt) return true;
  return false;
}

export function nextAction(l: Lead): { label: string; tone: ActionTone } {
  if (l.bookingStatus === 'Booked') return { label: `Appointment confirmed${l.confirmedSlot ? ` · ${l.confirmedSlot}` : ''}`, tone: 'done' };
  if (l.bookingStatus === 'Not interested') return { label: 'Closed — no further calls', tone: 'done' };
  if (l.followUpDone) return { label: 'Follow-up completed', tone: 'done' };
  if (l.callStatus === 'Human requested') return { label: 'Call patient — human callback requested', tone: 'urgent' };
  if (l.callStatus === 'Human Handoff') {
    if (l.handoffReason === 'Clinical question') return { label: 'Staff call — clinical question (no AI advice given)', tone: 'urgent' };
    if (l.handoffReason === 'Patient requested a human') return { label: 'Call patient — asked for a person', tone: 'urgent' };
    return { label: 'Staff call — AI unsure of patient intent', tone: 'action' };
  }
  if (l.bookingStatus === 'Slot requested') return { label: `Confirm requested slot · ${l.requestedSlot ?? ''}`, tone: 'action' };
  if (l.callStatus === 'No Answer') {
    if (l.callAttempts >= MAX_AI_ATTEMPTS) return { label: 'Staff call or SMS — AI retries stopped', tone: 'action' };
    return { label: `AI retry at ${l.nextRetryAt ? fmtTime(l.nextRetryAt) : 'next window'} (${l.callAttempts + 1} of ${MAX_AI_ATTEMPTS})`, tone: 'auto' };
  }
  if (l.callStatus === 'AI call queued') return { label: 'AI callback in progress — target < 5 min', tone: 'auto' };
  if (l.bookingStatus === 'Follow-up Required') return { label: 'Staff follow-up', tone: 'action' };
  if (l.bookingStatus === 'Interested') {
    if (l.nextRetryAt) return { label: `AI follow-up call ${fmtDayTime(l.nextRetryAt)} (agreed)`, tone: 'auto' };
    return { label: 'Offer an appointment slot', tone: 'action' };
  }
  if (l.callStatus === 'Staff contacted') return { label: 'Record call outcome — update booking status', tone: 'action' };
  return { label: 'Qualify patient', tone: 'action' };
}

/** Human requests first, then other interventions, then newest. */
export function sortLeads(leads: Lead[]): Lead[] {
  const rank = (l: Lead) => (needsIntervention(l) ? (l.priority ? 0 : 1) : 2);
  return [...leads].sort((a, b) => rank(a) - rank(b) || b.enquiryAt - a.enquiryAt);
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
