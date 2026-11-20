import type { BookingStatus, CallStatus } from '../data/types';

const CALL: Record<CallStatus, string> = {
  'AI call queued': 'blue',
  'AI connected': 'teal',
  'No Answer': 'grey',
  'Human Handoff': 'amber',
  'Human requested': 'rose',
  'Staff contacted': 'green',
};

const BOOKING: Record<BookingStatus, string> = {
  Pending: 'grey',
  Interested: 'blue',
  'Slot requested': 'violet',
  Booked: 'green',
  'Follow-up Required': 'amber',
  'Not interested': 'grey',
};

export function CallBadge({ status }: { status: CallStatus }) {
  return <span className={`badge badge--${CALL[status]}`}>{status}</span>;
}

export function BookingBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge badge--${BOOKING[status]}`}>{status}</span>;
}
