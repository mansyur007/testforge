// F-23: flexible duration parsing/formatting for case time estimates and
// run-page forecasts. Accepted input formats: bare seconds ("90"),
// unit-suffixed ("1m 30s", "1h 2m"), or colon-separated ("1:30" mm:ss,
// "1:02:03" hh:mm:ss).

export function parseDuration(input: string): number | null {
  const s = input.trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) return parseInt(s, 10);

  if (/^\d{1,3}(:\d{1,2}){1,2}$/.test(s)) {
    const parts = s.split(":").map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return null;
    return parts.length === 2
      ? parts[0] * 60 + parts[1]
      : parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  const unitRe = /(\d+)\s*(h|m|s)/gi;
  let total = 0;
  let matched = false;
  let m: RegExpExecArray | null;
  while ((m = unitRe.exec(s))) {
    matched = true;
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    total += unit === "h" ? n * 3600 : unit === "m" ? n * 60 : n;
  }
  return matched ? total : null;
}

// Compact human string, e.g. 90 -> "1m 30s", 8100 -> "2h 15m", 45 -> "45s".
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "≈ 0m remaining";
  return `≈ ${formatDuration(seconds)} remaining`;
}
