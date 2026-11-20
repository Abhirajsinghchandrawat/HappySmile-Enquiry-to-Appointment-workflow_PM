export const CLINICS = [
  'Koramangala, Bengaluru',
  'Indiranagar, Bengaluru',
  'Whitefield, Bengaluru',
  'HSR Layout, Bengaluru',
  'Andheri West, Mumbai',
  'Bandra, Mumbai',
  'Powai, Mumbai',
  'Saket, Delhi',
  'Dwarka, Delhi',
  'Sector 29, Gurugram',
  'Banjara Hills, Hyderabad',
  'Kothrud, Pune',
] as const;

export const STAFF = ['Unassigned', 'Priya Nair', 'Rahul Verma', 'Sneha Kulkarni', 'Arjun Mehta'];
export const CURRENT_STAFF = 'Priya Nair';

/** Guardrail: AI never makes more than this many unanswered attempts. */
export const MAX_AI_ATTEMPTS = 2;

/** Clinic operating hours (calls are only placed inside this window). */
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 20;

export const CLINIC_PHONE = '080-4718-2200';
