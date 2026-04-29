/**
 * Natural-language date parser for the editor's DateTimeField.
 *
 * Resolves relative/incomplete inputs to a concrete future date,
 * interpreted in the browser's timezone. All returned dates are at
 * midnight (00:00) — the caller combines with a separate time value
 * to produce a full timestamp.
 *
 * Handled cases:
 *   today | tomorrow | yesterday
 *   weekday names (monday, mon, tuesday, tue …) — next occurrence
 *     including today if today matches and it hasn't passed midnight
 *   the 10th | 10th | 10 — next 10th-of-month, roll forward if past
 *   4 June | 4th of June | June 4 | 4 Jun 2027 — absolute-ish, this
 *     year unless already past, then next year
 *   ISO / other parseable string — falls back to `new Date(input)`
 *
 * Anything else returns null; the caller should surface an error
 * state without mangling the typed string.
 *
 * Lives here rather than in `@verevoir/time` until the library is
 * extracted — once a second consumer arrives (e.g. public-site
 * "published at" display), move this across unchanged.
 */

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function parseNaturalDate(
  input: string,
  now: Date = new Date(),
): Date | null {
  const raw = input.trim();
  if (!raw) return null;
  const s = raw.toLowerCase();

  if (s === 'today') return startOfDay(now);
  if (s === 'tomorrow') return addDays(startOfDay(now), 1);
  if (s === 'yesterday') return addDays(startOfDay(now), -1);

  // Weekday — next occurrence, today counts
  if (s in WEEKDAYS) {
    const target = WEEKDAYS[s];
    const today = startOfDay(now);
    const diff = (target - today.getDay() + 7) % 7;
    return addDays(today, diff);
  }

  // "the 10th" / "10th" / "10" / "the 10" — day of month
  const dom = s.match(/^(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?$/);
  if (dom) {
    const day = parseInt(dom[1], 10);
    if (day >= 1 && day <= 31) {
      const today = startOfDay(now);
      const candidate = new Date(today.getFullYear(), today.getMonth(), day);
      if (candidate < today) candidate.setMonth(candidate.getMonth() + 1);
      if (candidate.getDate() === day) return candidate;
    }
  }

  // "4 June" / "4th of June" / "June 4" / "4 Jun 2027"
  const monthDay = parseMonthDay(s, now);
  if (monthDay) return monthDay;

  // ISO / native fallback — preserve original casing for ISO strings
  const fallback = new Date(raw);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

function parseMonthDay(s: string, now: Date): Date | null {
  // Strip ordinal suffixes and "of" connectors to simplify matching.
  const cleaned = s
    .replace(/\b(\d{1,2})(?:st|nd|rd|th)\b/g, '$1')
    .replace(/\bof\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Forms: "DAY MONTH [YEAR]" | "MONTH DAY [YEAR]"
  const forms = [
    /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/,
    /^([a-z]+)\s+(\d{1,2})(?:,\s*|\s+)?(\d{4})?$/,
  ];

  for (const re of forms) {
    const m = cleaned.match(re);
    if (!m) continue;
    const [, a, b, yearStr] = m;
    const dayFirst = /^\d/.test(a);
    const day = parseInt(dayFirst ? a : b, 10);
    const monthName = dayFirst ? b : a;
    const month = MONTHS[monthName];
    if (month === undefined || day < 1 || day > 31) continue;

    const today = startOfDay(now);
    let year = yearStr ? parseInt(yearStr, 10) : today.getFullYear();
    const candidate = new Date(year, month, day);
    // Catch overflow (e.g. "31 Feb" → 2/3 Mar). Reject those rather
    // than silently rolling forward to a date the user didn't type.
    if (candidate.getMonth() !== month || candidate.getDate() !== day) continue;

    if (!yearStr && candidate < today) {
      candidate.setFullYear(year + 1);
    }
    return candidate;
  }

  return null;
}

/**
 * Compact, human-friendly date display. Drops the year when it
 * matches the current local year — "20 Mar" for this year,
 * "20 Mar 2025" for older. Accepts an ISO string, a millisecond
 * timestamp, or a Date.
 *
 * Returns an empty string when the input is unparseable, so call
 * sites can render the result without an extra falsy check.
 */
export function formatNaturalDate(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return '';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
