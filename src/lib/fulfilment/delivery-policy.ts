export type DeliveryDecision =
  | { allowed: true; reason: 'verified_match' }
  | { allowed: false; reason: 'missing_confirmation_data' | 'ambiguous_match' | 'unmatched' | 'already_sent' };

export function decideDelivery(input: {
  matchStatus: 'matched' | 'needs_review' | 'unmatched';
  confirmationComplete: boolean;
  emailAlreadySent: boolean;
}): DeliveryDecision {
  if (input.emailAlreadySent) return { allowed: false, reason: 'already_sent' };
  if (input.matchStatus === 'needs_review') return { allowed: false, reason: 'ambiguous_match' };
  if (input.matchStatus === 'unmatched') return { allowed: false, reason: 'unmatched' };
  if (!input.confirmationComplete) return { allowed: false, reason: 'missing_confirmation_data' };
  return { allowed: true, reason: 'verified_match' };
}
