import { useEffect, useState } from 'react';
import type { FieldEditorProps } from '../types.js';
import { parseNaturalDate } from '../parse-date.js';

/**
 * Datetime field — single ISO-UTC string on the wire, two inputs in
 * the UI: a natural-language-parsed date (tomorrow, tuesday, the 10th,
 * 4 June …) and a native time picker.
 *
 * The date input accepts free text. On blur, `parseNaturalDate`
 * resolves it to a concrete future date in the browser's timezone and
 * re-renders as `Tue, 28 Apr 2026`. Unparseable input is left in place
 * with an error attribute so the theme can style it (red border etc.)
 * — we never mangle what the user typed.
 *
 * Timezone is intentionally hidden. Everything is stored UTC; display
 * and input both use browser-local. If a future consumer needs to
 * render event-anchored times (concert at the venue), add an optional
 * `targetTz` prop and wire into a `@verevoir/time` helper at that
 * point.
 */
export function DateTimeField({
  name,
  value,
  onChange,
  field,
}: FieldEditorProps<string>) {
  const [dateText, setDateText] = useState(() => formatDate(value));
  const [timeText, setTimeText] = useState(() => formatTime(value));
  const [parseError, setParseError] = useState(false);

  // Re-sync local display state when the external value changes (e.g.
  // another field edit resets this one). Guard against loops by only
  // resyncing when the incoming value would produce different display
  // strings than we currently show.
  useEffect(() => {
    const nextDate = formatDate(value);
    const nextTime = formatTime(value);
    if (nextDate !== dateText) setDateText(nextDate);
    if (nextTime !== timeText) setTimeText(nextTime);
    setParseError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commitDate = () => {
    const text = dateText.trim();
    if (text === '') {
      setParseError(false);
      if (value) onChange('');
      return;
    }
    const parsed = parseNaturalDate(text);
    if (!parsed) {
      setParseError(true);
      return;
    }
    setParseError(false);
    const display = formatDate(parsed.toISOString());
    setDateText(display);
    onChange(combine(parsed, timeText));
  };

  const handleTimeChange = (next: string) => {
    setTimeText(next);
    const parsed = parseNaturalDate(dateText.trim());
    if (!parsed) return; // date side invalid; don't emit
    onChange(combine(parsed, next));
  };

  return (
    <div data-datetime-field>
      <input
        id={name}
        type="text"
        value={dateText}
        onChange={(e) => {
          setDateText(e.target.value);
          if (parseError) setParseError(false);
        }}
        onBlur={commitDate}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitDate();
          }
        }}
        placeholder="e.g. tomorrow, tuesday, 4 June"
        required={field.meta.required}
        data-datetime-date
        data-datetime-error={parseError ? 'true' : undefined}
      />
      <input
        type="time"
        value={timeText}
        onChange={(e) => handleTimeChange(e.target.value)}
        data-datetime-time
      />
    </div>
  );
}

function formatDate(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // HH:MM in local time — what <input type="time"> expects.
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function combine(date: Date, timeText: string): string {
  // `date` is midnight in local tz (from parseNaturalDate). Overlay
  // the time if one was picked; otherwise leave at 00:00. toISOString
  // converts the resulting local instant to UTC for storage.
  const [hStr, mStr] = (timeText || '00:00').split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const result = new Date(date);
  result.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return result.toISOString();
}
