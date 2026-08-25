export type ParsedCZConfirmation = {
  sourceFile: string;
  registrationCountry: string | null;
  registrationNumber: string | null;
  validity: string | null;
  startDate: string | null;
  operatorReference: string | null;
};

const clean = (value: string | undefined) => value?.trim() || null;

/**
 * Parses text extracted from an eDalnice confirmation.
 * Deliberately returns null for fields that cannot be identified rather than
 * guessing. A null field must never be treated as a successful match.
 */
export function parseCZConfirmationText(text: string, sourceFile: string): ParsedCZConfirmation {
  const normalized = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ');

  const registrationNumber = clean(
    normalized.match(/(?:registration number|license plate|spz|rz)\s*[:\-]?\s*([A-Z0-9 .-]{2,16})/i)?.[1],
  );
  const registrationCountry = clean(
    normalized.match(/(?:registration country|country of registration)\s*[:\-]?\s*([A-Z]{2})/i)?.[1],
  );
  const operatorReference = clean(
    normalized.match(/(?:transaction|order|reference)\s*(?:number|no\.?|id)?\s*[:\-]?\s*([A-Z0-9-]{4,64})/i)?.[1],
  );
  const startDate = clean(
    normalized.match(/(?:valid from|start date|beginning of validity)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i)?.[1],
  );
  const validity = clean(
    normalized.match(/(?:validity|vignette type|period)\s*[:\-]?\s*([^\n]{1,40})/i)?.[1],
  );

  return {
    sourceFile,
    registrationCountry,
    registrationNumber,
    validity,
    startDate,
    operatorReference,
  };
}

export function isSafeForAutomaticDelivery(parsed: ParsedCZConfirmation) {
  return Boolean(
    parsed.registrationCountry &&
    parsed.registrationNumber &&
    parsed.validity &&
    parsed.startDate,
  );
}
