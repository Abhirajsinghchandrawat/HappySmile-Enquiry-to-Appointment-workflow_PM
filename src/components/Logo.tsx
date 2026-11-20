export default function Logo({ sub }: { sub?: string }) {
  return (
    <div className="logo">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--teal-700)" />
        <path d="M9 13c0 5 3 9 7 9s7-4 7-9" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <span className="logo__name">HappySmile</span>
      {sub && <span className="logo__sub">{sub}</span>}
    </div>
  );
}
