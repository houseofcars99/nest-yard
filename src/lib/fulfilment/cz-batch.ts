export type CZBatchItem = {
  fulfilmentId: string;
  orderId: string;
  customerEmail: string;
  registrationCountry: string;
  registrationNumber: string;
  validity: string;
  startDate: string | null;
};

export type CZConfirmation = {
  sourceFile: string;
  registrationCountry: string;
  registrationNumber: string;
  validity: string | null;
  startDate: string | null;
  operatorReference: string | null;
  filePath: string;
};

export type CZMatchResult =
  | { status: 'matched'; item: CZBatchItem; confirmation: CZConfirmation; score: 1 }
  | { status: 'needs_review'; confirmation: CZConfirmation; candidates: CZBatchItem[] }
  | { status: 'unmatched'; confirmation: CZConfirmation };

const normalize = (value: string | null | undefined) =>
  (value ?? '').trim().toUpperCase().replace(/\s+/g, '');

export function matchCZConfirmation(
  confirmation: CZConfirmation,
  items: CZBatchItem[],
): CZMatchResult {
  const country = normalize(confirmation.registrationCountry);
  const registration = normalize(confirmation.registrationNumber);
  const validity = normalize(confirmation.validity);
  const startDate = confirmation.startDate ?? '';

  const candidates = items.filter((item) => {
    if (normalize(item.registrationCountry) !== country) return false;
    if (normalize(item.registrationNumber) !== registration) return false;
    if (validity && normalize(item.validity) !== validity) return false;
    if (startDate && item.startDate && item.startDate !== startDate) return false;
    return true;
  });

  if (candidates.length === 1) {
    return { status: 'matched', item: candidates[0], confirmation, score: 1 };
  }

  if (candidates.length > 1) {
    return { status: 'needs_review', confirmation, candidates };
  }

  return { status: 'unmatched', confirmation };
}

export function buildBatchSnapshot(items: CZBatchItem[]) {
  return items.map((item) => ({
    fulfilmentId: item.fulfilmentId,
    orderId: item.orderId,
    customerEmail: item.customerEmail,
    registrationCountry: normalize(item.registrationCountry),
    registrationNumber: normalize(item.registrationNumber),
    validity: item.validity,
    startDate: item.startDate,
  }));
}
