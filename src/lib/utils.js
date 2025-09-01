import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatMonthDay(isoDateString) {
  const date = new Date(isoDateString);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
}

export function formatMonthDayNumeric(isoDateString) {
  if (!isoDateString || typeof isoDateString !== 'string') return '';
  const parts = isoDateString.split('-');
  if (parts.length < 3) return isoDateString;
  
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  return `${month}/${day}`;
}

export function capitalizeFirstLetter(str) {
  if (!str) return str;
    return str
      .split('_')
      .map(word => 
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      )
      .join(' ');
}

export function daysUntilOrSince(dateStr) {
  const timeZone = 'America/New_York';
  const now = new Date();
  const todayFormatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
  const today = new Date(todayFormatter.format(now));
  const target = new Date(dateStr);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    return { status: "upcoming", daysLeft: diffDays };
  } else {
    return { status: "past", daysLate: Math.abs(diffDays) };
  }
}


export const byDate = (rowA, rowB, columnId) => {
  const toTime = (v) => {
    if (v == null) return NaN
    if (v instanceof Date) return v.getTime()
    if (typeof v === "number") {
      // If your DB returns seconds, convert: return v * 1000
      return v
    }
    const s = String(v).trim()

    // YYYY-MM-DD (treat as midnight UTC)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return Date.parse(`${s}T00:00:00Z`)

    const t = Date.parse(s)
    return Number.isNaN(t) ? NaN : t
  }

  const ta = toTime(rowA.getValue(columnId))
  const tb = toTime(rowB.getValue(columnId))

  // Put invalid/missing dates at the end regardless of asc/desc
  const aInvalid = Number.isNaN(ta)
  const bInvalid = Number.isNaN(tb)
  if (aInvalid && bInvalid) return 0
  if (aInvalid) return 1
  if (bInvalid) return -1

  return ta - tb // asc by default; use desc:true to show newest first
}