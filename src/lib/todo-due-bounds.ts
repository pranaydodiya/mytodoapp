/** UTC calendar day bounds for the given instant (default: now). */
export function utcDayBounds(d = new Date()): { start: Date; end: Date } {
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  return {
    start: new Date(Date.UTC(y, m, day, 0, 0, 0, 0)),
    end: new Date(Date.UTC(y, m, day, 23, 59, 59, 999)),
  }
}
