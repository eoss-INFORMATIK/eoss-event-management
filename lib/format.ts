/**
 * Supabase returns timestamps as ISO strings, not Date objects. These helpers
 * keep the parsing in one place instead of `new Date(...)` at every call site.
 */

const DATE_FORMAT = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value: string | Date) =>
  DATE_FORMAT.format(new Date(value));

export const formatDateTime = (value: string | Date) =>
  DATE_TIME_FORMAT.format(new Date(value));

/** For <input type="date">, which needs a plain YYYY-MM-DD value. */
export const toDateInputValue = (value: string | Date) => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};
