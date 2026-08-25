export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmailConfirmation(email: string, confirmation: string) {
  const normalized = normalizeEmail(email);
  const normalizedConfirmation = normalizeEmail(confirmation);

  return {
    normalized,
    valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized),
    matchesConfirmation: normalized.length > 0 && normalized === normalizedConfirmation,
  };
}
