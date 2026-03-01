const DATA_CUTOFF_DATE = new Date('2025-07-12');

const ROI_PERIODS: Record<string, number> = {
  day0: 0,
  day1: 1,
  day3: 3,
  day7: 7,
  day14: 14,
  day30: 30,
  day60: 60,
  day90: 90,
};

export function isInsufficient(dateStr: string, period: string): boolean {
  const date = new Date(dateStr);
  const requiredDays = ROI_PERIODS[period];
  if (requiredDays === undefined) return false;

  const diffMs = DATA_CUTOFF_DATE.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays < requiredDays;
}

export function parseDateColumn(raw: string): { date: string; dayOfWeek: string } {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})\((.+?)\)$/);
  if (match) {
    return { date: match[1], dayOfWeek: match[2] };
  }
  return { date: raw, dayOfWeek: '' };
}

export function parseRoiValue(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const cleaned = raw.replace(/,/g, '').replace(/%/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export { ROI_PERIODS, DATA_CUTOFF_DATE };
