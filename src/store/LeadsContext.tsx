import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { BookingStatus, CallPreference, Language, Lead } from '../data/types';
import { MOCK_LEADS } from '../data/mockLeads';
import { CURRENT_STAFF, MAX_AI_ATTEMPTS } from '../data/constants';
import { fmtDuration } from '../lib/format';

export type SimOutcome = 'interested' | 'human' | 'clinical' | 'noanswer';

type Action =
  | { type: 'submitEnquiry'; language: Language; preference: CallPreference }
  | { type: 'setLanguage'; language: Language }
  | { type: 'markContacted'; id: string }
  | { type: 'setBooking'; id: string; status: BookingStatus; slot?: string }
  | { type: 'completeFollowUp'; id: string }
  | { type: 'togglePriority'; id: string }
  | { type: 'assign'; id: string; staff: string }
  | { type: 'simulate'; id: string; outcome: SimOutcome };

export const DEMO_ID = 'L-1043';
export const DEMO_PATIENT = {
  name: 'Riya Malhotra',
  phone: '+91 98201 •••10',
  treatment: 'Braces Consultation',
  clinic: 'Koramangala, Bengaluru',
  ref: 'HS-KRM-24871',
};

function reducer(state: Lead[], a: Action): Lead[] {
  const now = Date.now();
  const update = (id: string, fn: (l: Lead) => Lead) => state.map((l) => (l.id === id ? fn(l) : l));
  const log = (l: Lead, actor: Lead['activity'][number]['actor'], text: string) => [...l.activity, { at: now, actor, text }];

  switch (a.type) {
    case 'submitEnquiry': {
      const existing = state.find((l) => l.id === DEMO_ID);
      const enquiryAt = existing?.enquiryAt ?? now - 45_000;
      const base: Lead = existing ?? {
        id: DEMO_ID,
        ...DEMO_PATIENT,
        enquiryAt,
        language: a.language,
        preference: a.preference,
        aiOptOut: false,
        callStatus: 'AI call queued',
        callAttempts: 0,
        bookingStatus: 'Pending',
        summary: '',
        priority: false,
        followUpDone: false,
        assignedTo: 'Unassigned',
        isDemo: true,
        activity: [{ at: enquiryAt, actor: 'Patient', text: 'Submitted online enquiry — Braces Consultation' }],
      };
      const ai = a.preference === 'ai';
      const lead: Lead = {
        ...base,
        language: a.language,
        preference: a.preference,
        aiOptOut: !ai,
        callStatus: ai ? 'AI call queued' : 'Human requested',
        callAttempts: 0,
        aiCallAt: undefined,
        firstContactAt: undefined,
        handoffReason: undefined,
        nextRetryAt: undefined,
        requestedSlot: undefined,
        bookingStatus: 'Pending',
        priority: !ai,
        followUpDone: false,
        summary: ai
          ? 'Patient consented to an automated AI callback. Call queued — no conversation yet.'
          : 'Patient chose a callback from the clinic team. No AI call will be made.',
        activity: ai
          ? [...base.activity, { at: now, actor: 'Patient', text: `Consented to AI callback (${a.language})` }, { at: now, actor: 'System', text: 'AI callback queued — target within 5 min' }]
          : [...base.activity, { at: now, actor: 'Patient', text: `Requested a human callback (${a.language}) — no automated calls` }, { at: now, actor: 'System', text: 'Prioritised in front-desk queue' }],
      };
      return [lead, ...state.filter((l) => l.id !== DEMO_ID)];
    }

    case 'setLanguage':
      return update(DEMO_ID, (l) => (l.language === a.language ? l : { ...l, language: a.language, activity: log(l, 'Patient', `Changed call language to ${a.language}`) }));

    case 'markContacted':
      return update(a.id, (l) => ({
        ...l,
        callStatus: 'Staff contacted',
        firstContactAt: l.firstContactAt ?? now,
        priority: false,
        activity: log(l, 'Staff', `${CURRENT_STAFF} marked patient as contacted`),
      }));

    case 'setBooking':
      return update(a.id, (l) => ({
        ...l,
        bookingStatus: a.status,
        confirmedSlot: a.status === 'Booked' ? a.slot ?? l.requestedSlot : undefined,
        followUpDone: a.status === 'Booked' || a.status === 'Not interested' ? l.followUpDone : false,
        nextRetryAt: a.status === 'Interested' ? l.nextRetryAt : undefined,
        priority: a.status === 'Booked' || a.status === 'Not interested' ? false : l.priority,
        activity: log(
          l,
          'Staff',
          a.status === 'Booked'
            ? `${CURRENT_STAFF} confirmed appointment · ${a.slot ?? l.requestedSlot ?? ''}`
            : `${CURRENT_STAFF} updated booking status to “${a.status}”`,
        ),
      }));

    case 'completeFollowUp':
      return update(a.id, (l) => ({
        ...l,
        followUpDone: true,
        priority: false,
        callStatus: l.callStatus === 'Human requested' || l.callStatus === 'Human Handoff' || l.callStatus === 'No Answer' ? 'Staff contacted' : l.callStatus,
        firstContactAt: l.firstContactAt ?? now,
        activity: log(l, 'Staff', `${CURRENT_STAFF} marked follow-up complete`),
      }));

    case 'togglePriority':
      return update(a.id, (l) => ({
        ...l,
        priority: !l.priority,
        activity: log(l, 'Staff', l.priority ? `${CURRENT_STAFF} removed priority` : `${CURRENT_STAFF} prioritised human callback`),
      }));

    case 'assign':
      return update(a.id, (l) => ({ ...l, assignedTo: a.staff, activity: log(l, 'Staff', `Assigned to ${a.staff}`) }));

    case 'simulate':
      return update(a.id, (l) => {
        const attempt = l.callAttempts + 1;
        const after = fmtDuration(now - l.enquiryAt);
        const connected = {
          ...l,
          callAttempts: attempt,
          aiCallAt: now,
          firstContactAt: l.firstContactAt ?? now,
          nextRetryAt: undefined,
        };
        const hello = { at: now, actor: 'AI' as const, text: `AI callback connected (${after} after enquiry), disclosed as AI assistant` };
        switch (a.outcome) {
          case 'interested':
            return {
              ...connected,
              callStatus: 'AI connected',
              bookingStatus: 'Slot requested',
              requestedSlot: 'Sat, 22 Nov · 11:00 AM',
              summary:
                'Asked about braces types, treatment duration and cost. Shared the approved price range (₹35,000–₹1,20,000; final quote after consultation). No clinical advice given. Requested Sat 22 Nov, 11:00 AM — awaiting staff confirmation.',
              activity: [...l.activity, hello, { at: now, actor: 'AI', text: 'Patient requested Sat 22 Nov, 11:00 AM — sent to staff for slot confirmation' }],
            };
          case 'human':
            return {
              ...connected,
              callStatus: 'Human Handoff',
              handoffReason: 'Patient requested a human',
              bookingStatus: 'Interested',
              priority: true,
              summary: 'Patient is interested but asked to speak with a person about payment options. AI confirmed a team member will call back.',
              activity: [...l.activity, hello, { at: now, actor: 'AI', text: 'Patient asked for a person — handed off and prioritised' }],
            };
          case 'clinical':
            return {
              ...connected,
              callStatus: 'Human Handoff',
              handoffReason: 'Clinical question',
              bookingStatus: 'Follow-up Required',
              priority: true,
              summary: 'Asked whether braces are suitable given current gum bleeding. AI did not advise and handed off to the clinic team. Patient still wants a consultation.',
              activity: [...l.activity, hello, { at: now, actor: 'AI', text: 'Clinical question detected — no advice given, handed off to staff' }],
            };
          case 'noanswer': {
            const exhausted = attempt >= MAX_AI_ATTEMPTS;
            return {
              ...l,
              callAttempts: attempt,
              aiCallAt: now,
              callStatus: 'No Answer',
              bookingStatus: exhausted ? 'Follow-up Required' : 'Pending',
              nextRetryAt: exhausted ? undefined : now + 30 * 60_000,
              summary: exhausted
                ? 'Two AI attempts unanswered. Automated retries stopped as per policy — needs a staff call or SMS.'
                : 'No answer on the first AI attempt. One retry is scheduled; after 2 unanswered attempts the lead moves to staff.',
              activity: [
                ...l.activity,
                { at: now, actor: 'AI', text: `Attempt ${attempt} of ${MAX_AI_ATTEMPTS} — no answer` },
                { at: now, actor: 'System', text: exhausted ? 'Automated retries stopped — moved to staff queue' : 'Retry scheduled in 30 min' },
              ],
            };
          }
        }
      });
  }
}

interface Ctx {
  leads: Lead[];
  dispatch: React.Dispatch<Action>;
}

const LeadsContext = createContext<Ctx | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, dispatch] = useReducer(reducer, MOCK_LEADS);
  return <LeadsContext.Provider value={{ leads, dispatch }}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads must be used inside LeadsProvider');
  return ctx;
}
