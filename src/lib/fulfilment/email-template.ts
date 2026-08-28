export type VignetteEmailData = {
  customerFirstName: string;
  orderNumber: string;
  countryName: string;
  registrationCountry: string;
  registrationNumber: string;
  validity: string;
  startDate: string | null;
  downloadUrl: string;
};

export function buildVignetteDeliveryEmail(data: VignetteEmailData) {
  const subject = `TOLLA – potwierdzenie zakupu winiety – ${data.orderNumber}`;

  const text = [
    `Dzień dobry ${data.customerFirstName},`,
    '',
    `potwierdzamy zakup winiety ${data.countryName}.`,
    '',
    `Numer zamówienia: ${data.orderNumber}`,
    `Pojazd: ${data.registrationCountry} / ${data.registrationNumber}`,
    `Ważność: ${data.validity}`,
    data.startDate ? `Początek ważności: ${data.startDate}` : '',
    '',
    `Potwierdzenie zakupu: ${data.downloadUrl}`,
    '',
    'Pozdrawiamy,',
    'Zespół TOLLA',
  ].filter(Boolean).join('\n');

  return { subject, text };
}
