export function pageCount(n: number): string {
  return `${n} ${n === 1 ? 'page' : 'pages'}`;
}

export function formatBytes(n: number): string {
  if (n <= 0) return '0 KB';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** "2026-10-13 1530" — used in default document and file names. */
export function timestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}${pad(date.getMinutes())}`;
}

/** "Today, 14:05", "Yesterday", "Oct 3", or "Oct 3, 2025". */
export function relativeDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((dayStart(now) - dayStart(d)) / 86_400_000);
  if (dayDiff === 0) {
    return `Today, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (dayDiff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}
