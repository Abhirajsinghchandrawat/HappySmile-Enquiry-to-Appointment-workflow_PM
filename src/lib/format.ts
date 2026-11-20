export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

export const isSameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();

export function fmtDayTime(ts: number) {
  const now = Date.now();
  if (isSameDay(ts, now)) return `today ${fmtTime(ts)}`;
  if (isSameDay(ts, now + 86_400_000)) return `tomorrow ${fmtTime(ts)}`;
  if (isSameDay(ts, now - 86_400_000)) return `yesterday ${fmtTime(ts)}`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ` ${fmtTime(ts)}`;
}

export function fmtAgo(ts: number) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60_000));
  if (!isSameDay(ts, Date.now())) return 'Yesterday';
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export function fmtDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
