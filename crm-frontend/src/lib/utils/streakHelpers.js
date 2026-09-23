// Builds a proper GitHub/LeetCode-style contribution grid: weeks as
// columns, each column containing 7 day-cells (Sun-Sat), from oldest week
// on the left to the current week on the right.
//
// PREVIOUS BUG: this returned a flat array which the component tried to
// render with a combination of `grid grid-cols-15` (grid-cols-15 isn't a
// real Tailwind class - default Tailwind only ships up to grid-cols-12,
// so it silently did nothing) AND `flex flex-wrap` on the SAME element.
// Mixing `display: grid` and `display: flex` utilities on one element
// means one silently wins over the other depending on CSS rule order, and
// neither actually laid out a weeks x days grid - hence everything
// collapsing into one long vertical line.
export function buildStreakWeeks(heatmapData, days = 98) {
  const map = new Map(heatmapData.map((d) => [d.date, d]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Walk back `days` days, then align to the Sunday on/before that date so
  // every column is a complete Sun-Sat week.
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay());

  const totalDays = Math.round((today - rangeStart) / 86400000) + 1;
  const weeksCount = Math.ceil(totalDays / 7);

  const weeks = Array.from({ length: weeksCount }, () => Array(7).fill(null));
  const monthLabels = Array(weeksCount).fill(null);

  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    if (d > today) break;

    const key = d.toISOString().slice(0, 10);
    const weekIdx = Math.floor(i / 7);
    const weekday = d.getDay();

    weeks[weekIdx][weekday] = map.get(key) || { date: key, count: 0, state: 'none' };

    // Label a week column with its month the first time that month appears.
    if (d.getDate() <= 7 && monthLabels[weekIdx] === null) {
      monthLabels[weekIdx] = d.toLocaleDateString('en-US', { month: 'short' });
    }
  }

  return { weeks, monthLabels };
}

export const STATE_COLORS = {
  complete: '#22c55e', // green
  partial: '#f59e0b', // amber
  missed: '#ef4444', // red
  none: '#e5e7eb', // grey
};

export const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
