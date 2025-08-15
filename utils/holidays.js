// List of holidays used for pricing calculations
// - FIXED_HOLIDAYS: repeats every year by month-day (MM-DD)
// - HOLIDAYS: absolute dates (YYYY-MM-DD) for one-off days like Tet schedule each year

const FIXED_HOLIDAYS = [
  // New Year, Reunification Day, International Workers' Day, National Day
  '01-01', '04-30', '05-01', '09-02',
];

// Add or update per-year holiday dates as needed (YYYY-MM-DD)
// Example Tet 2025 range (adjust to your official calendar):
const HOLIDAYS = [
  // '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02'
];

function toDateOnlyString(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  // Format YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isHoliday(dateLike) {
  const ymd = toDateOnlyString(dateLike);
  if (!ymd) return false;
  if (HOLIDAYS.includes(ymd)) return true;
  const md = ymd.slice(5); // MM-DD
  return FIXED_HOLIDAYS.includes(md);
}

module.exports = {
  FIXED_HOLIDAYS,
  HOLIDAYS,
  isHoliday,
};
