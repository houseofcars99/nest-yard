export type RegistrationValidation = {
  normalized: string;
  valid: boolean;
  matchesConfirmation: boolean;
};

export function normalizeRegistrationNumber(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]+/g, '');
}

export function validateRegistrationNumber(value: string, confirmation: string): RegistrationValidation {
  const normalized = normalizeRegistrationNumber(value);
  const normalizedConfirmation = normalizeRegistrationNumber(confirmation);

  return {
    normalized,
    valid: normalized.length >= 2 && normalized.length <= 16,
    matchesConfirmation: normalized.length > 0 && normalized === normalizedConfirmation,
  };
}
