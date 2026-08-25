import { createHash } from 'node:crypto';
import { decideDelivery } from './delivery-policy';
import { isSafeForAutomaticDelivery, parseCZConfirmationText, type ParsedCZConfirmation } from './cz-confirmation-parser';
import { matchCZConfirmation, type CZBatchItem, type CZConfirmation } from './cz-batch';

export type CZZipEntry = {
  sourceFile: string;
  extractedText: string;
  filePath: string;
  bytes: Buffer;
};

export type CZProcessedEntry = {
  sourceFile: string;
  sha256: string;
  parsed: ParsedCZConfirmation;
  match: ReturnType<typeof matchCZConfirmation>;
  delivery: ReturnType<typeof decideDelivery>;
};

export function sha256(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Processes already-extracted confirmation files. ZIP extraction itself should
 * happen in a trusted server-side worker. This function intentionally never
 * guesses missing confirmation fields and never authorizes delivery by itself.
 */
export function processCZConfirmationEntries(
  entries: CZZipEntry[],
  batchItems: CZBatchItem[],
  alreadySentOrderIds: Set<string>,
): CZProcessedEntry[] {
  return entries.map((entry) => {
    const parsed = parseCZConfirmationText(entry.extractedText, entry.sourceFile);
    const confirmation: CZConfirmation = {
      sourceFile: entry.sourceFile,
      registrationCountry: parsed.registrationCountry ?? '',
      registrationNumber: parsed.registrationNumber ?? '',
      validity: parsed.validity ?? '',
      startDate: parsed.startDate,
      operatorReference: parsed.operatorReference,
      filePath: entry.filePath,
    };

    const match = matchCZConfirmation(confirmation, batchItems);
    const matchedOrderId = match.status === 'matched' ? match.item.orderId : null;
    const delivery = decideDelivery({
      matchStatus: match.status,
      confirmationComplete: isSafeForAutomaticDelivery(parsed),
      emailAlreadySent: matchedOrderId ? alreadySentOrderIds.has(matchedOrderId) : false,
    });

    return {
      sourceFile: entry.sourceFile,
      sha256: sha256(entry.bytes),
      parsed,
      match,
      delivery,
    };
  });
}
