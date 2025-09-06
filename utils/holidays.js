
const FIXED_HOLIDAYS = [
  // New Year, Reunification Day, International Workers' Day, National Day
  '01-01', '04-30', '05-01', '09-02',
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
  const md = ymd.slice(5); // MM-DD
  return FIXED_HOLIDAYS.includes(md);
}

module.exports = {
  FIXED_HOLIDAYS,
  isHoliday,
};
