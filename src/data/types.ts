export type Language = 'English' | 'Hindi';
export type CallPreference = 'ai' | 'human';

export type CallStatus =
  | 'AI call queued'
  | 'AI connected'
  | 'No Answer'
  | 'Human Handoff'
  | 'Human requested'
  | 'Staff contacted';

export type BookingStatus =
  | 'Pending'
  | 'Interested'
  | 'Slot requested'
  | 'Booked'
  | 'Follow-up Required'
  | 'Not interested';

export type HandoffReason =
  | 'Patient requested a human'
  | 'Clinical question'
  | 'AI uncertain';

export interface ActivityItem {
  at: number;
  actor: 'Patient' | 'AI' | 'Staff' | 'System';
  text: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  treatment: string;
  clinic: string;
  enquiryAt: number;
  language: Language;
  preference: CallPreference;
  aiOptOut: boolean;
  callStatus: CallStatus;
  callAttempts: number;
  aiCallAt?: number;
  firstContactAt?: number;
  bookingStatus: BookingStatus;
  requestedSlot?: string;
  confirmedSlot?: string;
  handoffReason?: HandoffReason;
  summary: string;
  priority: boolean;
  followUpDone: boolean;
  assignedTo: string;
  nextRetryAt?: number;
  activity: ActivityItem[];
  isDemo?: boolean;
}
