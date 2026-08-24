export type CountryCode = "CZ" | "AT" | "CH";
export type Currency = "CZK" | "EUR" | "CHF";

export type VignetteProduct = {
  id: string;
  country: CountryCode;
  countryName: string;
  flag: string;
  productName: string;
  validity: string;
  basePrice: number;
  currency: Currency;
  vehicleType: "car" | "motorcycle";
  requiredFields: string[];
};

export const SERVICE_MARGIN = 0.15;

// Official-source prices checked during MVP implementation.
// Keep these values in one catalog so prices can later be synced from an admin/API source.
export const vignetteProducts: VignetteProduct[] = [
  { id: "cz-car-1d-standard", country: "CZ", countryName: "Czechy", flag: "🇨🇿", productName: "1 dzień", validity: "1 dzień", basePrice: 230, currency: "CZK", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "fuelType", "startDate"] },
  { id: "cz-car-10d-standard", country: "CZ", countryName: "Czechy", flag: "🇨🇿", productName: "10 dni", validity: "10 dni", basePrice: 300, currency: "CZK", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "fuelType", "startDate"] },
  { id: "cz-car-30d-standard", country: "CZ", countryName: "Czechy", flag: "🇨🇿", productName: "30 dni", validity: "30 dni", basePrice: 480, currency: "CZK", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "fuelType", "startDate"] },
  { id: "cz-car-annual-standard", country: "CZ", countryName: "Czechy", flag: "🇨🇿", productName: "roczna", validity: "roczna", basePrice: 2570, currency: "CZK", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "fuelType", "startDate"] },
  { id: "at-car-1d", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "1 dzień", validity: "1 dzień", basePrice: 9.6, currency: "EUR", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "at-car-10d", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "10 dni", validity: "10 dni", basePrice: 12.8, currency: "EUR", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "at-car-2m", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "2 miesiące", validity: "2 miesiące", basePrice: 32, currency: "EUR", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "at-car-annual", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "roczna", validity: "roczna", basePrice: 106.8, currency: "EUR", vehicleType: "car", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "at-moto-1d", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "1 dzień", validity: "1 dzień", basePrice: 3.8, currency: "EUR", vehicleType: "motorcycle", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "at-moto-10d", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "10 dni", validity: "10 dni", basePrice: 5.1, currency: "EUR", vehicleType: "motorcycle", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "at-moto-2m", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "2 miesiące", validity: "2 miesiące", basePrice: 12.8, currency: "EUR", vehicleType: "motorcycle", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "at-moto-annual", country: "AT", countryName: "Austria", flag: "🇦🇹", productName: "roczna", validity: "roczna", basePrice: 42.7, currency: "EUR", vehicleType: "motorcycle", requiredFields: ["registrationCountry", "registrationNumber", "startDate"] },
  { id: "ch-car-annual", country: "CH", countryName: "Szwajcaria", flag: "🇨🇭", productName: "e-winieta", validity: "roczna", basePrice: 40, currency: "CHF", vehicleType: "car", requiredFields: ["vehicleCategory", "registrationCountry", "registrationNumber"] },
  { id: "ch-moto-annual", country: "CH", countryName: "Szwajcaria", flag: "🇨🇭", productName: "e-winieta", validity: "roczna", basePrice: 40, currency: "CHF", vehicleType: "motorcycle", requiredFields: ["vehicleCategory", "registrationCountry", "registrationNumber"] },
];

export function finalPrice(product: VignetteProduct) {
  return Math.round(product.basePrice * (1 + SERVICE_MARGIN) * 100) / 100;
}
