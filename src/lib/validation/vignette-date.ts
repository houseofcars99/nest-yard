export function toDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getTodayDateOnly() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isVignetteStartDateAllowed(value: string) {
  const selected = toDateOnly(value);
  const today = toDateOnly(getTodayDateOnly());
  return Boolean(selected && today && selected >= today);
}
