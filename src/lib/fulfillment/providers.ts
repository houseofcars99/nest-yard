export type FulfilmentCountry = "CZ" | "AT" | "CH";

export type FulfilmentItem = {
  id: string;
  productId: string;
  countryCode: FulfilmentCountry;
  registrationCountry: string;
  registrationNumber: string;
  fuelType?: string | null;
  startDate?: string | null;
  vehicleType: string;
  productName: string;
  validity: string;
};

export type ProviderResult =
  | { status: "completed"; providerReference: string; confirmation?: string }
  | { status: "queued"; reason: string }
  | { status: "blocked"; reason: string };

export type FulfilmentProvider = {
  code: string;
  country: FulfilmentCountry;
  mode: "manual" | "api" | "authorized-web";
  dispatch(item: FulfilmentItem): Promise<ProviderResult>;
};

/**
 * The provider layer deliberately does not automate CAPTCHA/anti-bot controls
 * or bypass a distributor's terms. A provider is enabled only after we have
 * a documented, permitted integration path (API, authorized reseller access,
 * or an explicitly permitted business portal).
 */

const providers: Record<FulfilmentCountry, FulfilmentProvider> = {
  CZ: {
    code: "edalnice-official",
    country: "CZ",
    mode: "manual",
    async dispatch() {
      return {
        status: "queued",
        reason: "Czech official purchase flow is prepared, but no public reseller API has been verified. Enable only after an approved integration path is confirmed.",
      };
    },
  },
  AT: {
    code: "asfinag-authorized",
    country: "AT",
    mode: "authorized-web",
    async dispatch() {
      return {
        status: "blocked",
        reason: "ASFINAG commercial resale requires express authorization. Do not dispatch Austrian orders automatically until authorization is obtained.",
      };
    },
  },
  CH: {
    code: "via-portal-business",
    country: "CH",
    mode: "manual",
    async dispatch() {
      return {
        status: "queued",
        reason: "Swiss Via Portal supports multi-vehicle business purchases, but no public e-vignette reseller API has been verified. Configure an approved business account/integration before automation.",
      };
    },
  },
};

export function getProvider(country: FulfilmentCountry) {
  return providers[country];
}
