import type { AllegroOrder, OrderStatus, PaymentStatus } from "@/lib/commerce-types";

export const allegroScopes = [
  "allegro:api:profile:read",
  "allegro:api:sale:offers:read",
  "allegro:api:sale:offers:write",
  "allegro:api:orders:read",
  "allegro:api:orders:write",
  "allegro:api:shipments:read",
  "allegro:api:shipments:write",
  "allegro:api:billing:read",
  "allegro:api:payments:read",
].join(" ");

export function allegroConfig() {
  const sandbox = process.env.ALLEGRO_ENV === "sandbox";
  const clientId = process.env.ALLEGRO_CLIENT_ID || "";
  const clientSecret = process.env.ALLEGRO_CLIENT_SECRET || "";
  const redirectUri = process.env.ALLEGRO_REDIRECT_URI || "";
  const missing = [
    !clientId ? "ALLEGRO_CLIENT_ID" : "",
    !clientSecret ? "ALLEGRO_CLIENT_SECRET" : "",
    !redirectUri ? "ALLEGRO_REDIRECT_URI" : "",
  ].filter(Boolean);

  return {
    clientId,
    clientSecret,
    redirectUri,
    missing,
    configured: missing.length === 0,
    environment: sandbox ? ("sandbox" as const) : ("production" as const),
    authBase: sandbox ? "https://allegro.pl.allegrosandbox.pl" : "https://allegro.pl",
    apiBase: sandbox ? "https://api.allegro.pl.allegrosandbox.pl" : "https://api.allegro.pl",
  };
}

export async function exchangeCode(code: string) {
  const config = allegroConfig();
  if (!config.configured) throw new Error(`Brak konfiguracji: ${config.missing.join(", ")}`);
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });
  const response = await fetch(`${config.authBase}/auth/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Allegro OAuth: ${response.status}`);
  return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const config = allegroConfig();
  if (!config.configured) throw new Error(`Brak konfiguracji: ${config.missing.join(", ")}`);
  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: config.redirectUri,
  });
  const response = await fetch(`${config.authBase}/auth/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Odświeżenie tokena Allegro: ${response.status}`);
  return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function allegroGet<T>(path: string, accessToken: string): Promise<T> {
  const config = allegroConfig();
  const response = await fetch(`${config.apiBase}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.allegro.public.v1+json",
      "User-Agent": "Nest-and-Yard/1.0",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Allegro API ${response.status}: ${detail.slice(0, 240)}`);
  }
  return response.json() as Promise<T>;
}

type AllegroCheckoutForm = {
  id?: string;
  status?: string;
  updatedAt?: string;
  buyer?: {
    login?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    taxId?: string;
  };
  payment?: {
    status?: string;
    paidAmount?: { amount?: string };
  };
  summary?: { totalToPay?: { amount?: string } };
  invoice?: { required?: boolean };
  fulfillment?: { status?: string; shipmentSummary?: { lineItemsSent?: string } };
  delivery?: {
    method?: { name?: string };
    cost?: { amount?: string };
    address?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
      street?: string;
      city?: string;
      zipCode?: string;
    };
  };
  lineItems?: Array<{
    id?: string;
    quantity?: number;
    boughtAt?: string;
    offer?: { id?: string; name?: string; external?: { id?: string } };
    price?: { amount?: string };
    tax?: { percentage?: string };
  }>;
};

type CheckoutFormsResponse = { checkoutForms?: AllegroCheckoutForm[] };
type BillingResponse = {
  billingEntries?: Array<{ order?: { id?: string }; value?: { amount?: string } }>;
};

function mapOrderStatus(form: AllegroCheckoutForm): OrderStatus {
  const fulfillment = form.fulfillment?.status;
  if (form.status === "CANCELLED") return "CANCELLED";
  if (fulfillment === "SENT") return "SENT";
  if (fulfillment === "READY_FOR_SHIPMENT") return "READY_FOR_SHIPMENT";
  if (fulfillment === "PROCESSING") return "PROCESSING";
  if (fulfillment === "PICKED_UP" || fulfillment === "COMPLETED") return "COMPLETED";
  return "NEW";
}

function mapPaymentStatus(status: string | undefined): PaymentStatus {
  if (status === "PAID") return "PAID";
  if (status === "REFUNDED") return "REFUNDED";
  if (status === "PARTIALLY_REFUNDED") return "PARTIALLY_REFUNDED";
  return "PENDING";
}

function numberValue(value: string | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function addressValue(form: AllegroCheckoutForm) {
  const address = form.delivery?.address;
  if (!address) return "";
  const recipient = address.companyName || [address.firstName, address.lastName].filter(Boolean).join(" ");
  return [recipient, address.street, [address.zipCode, address.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

export async function getAllegroSnapshot(accessToken: string): Promise<AllegroOrder[]> {
  const [checkoutForms, billing] = await Promise.all([
    allegroGet<CheckoutFormsResponse>("/order/checkout-forms?limit=100&sort=-updatedAt", accessToken),
    allegroGet<BillingResponse>("/billing/billing-entries?limit=100", accessToken).catch(() => ({ billingEntries: [] })),
  ]);

  const feesByOrder = new Map<string, number>();
  for (const entry of billing.billingEntries || []) {
    const orderId = entry.order?.id;
    if (!orderId) continue;
    feesByOrder.set(orderId, (feesByOrder.get(orderId) || 0) + Math.abs(numberValue(entry.value?.amount)));
  }

  return (checkoutForms.checkoutForms || []).map((form, index) => {
    const id = form.id || `allegro-${index}`;
    const lines = form.lineItems || [];
    const createdAt = lines.map((line) => line.boughtAt).filter((value): value is string => Boolean(value)).sort()[0] || form.updatedAt || new Date().toISOString();
    const buyerName = form.buyer?.companyName || [form.buyer?.firstName, form.buyer?.lastName].filter(Boolean).join(" ") || form.buyer?.login || "Kupujący Allegro";
    return {
      id,
      allegroOrderId: id,
      createdAt,
      updatedAt: form.updatedAt || createdAt,
      buyerName,
      buyerLogin: form.buyer?.login || "",
      buyerEmail: form.buyer?.email || "",
      buyerTaxId: form.buyer?.taxId || "",
      deliveryAddress: addressValue(form),
      deliveryMethod: form.delivery?.method?.name || "Dostawa Allegro",
      status: mapOrderStatus(form),
      paymentStatus: mapPaymentStatus(form.payment?.status),
      paidAmount: numberValue(form.payment?.paidAmount?.amount || form.summary?.totalToPay?.amount),
      deliveryCost: numberValue(form.delivery?.cost?.amount),
      allegroFees: feesByOrder.get(id) || 0,
      invoiceRequested: Boolean(form.invoice?.required),
      invoiceId: null,
      trackingNumber: "",
      lineItems: lines.map((line, lineIndex) => ({
        id: line.id || `${id}-${lineIndex}`,
        productId: line.offer?.external?.id || `offer-${line.offer?.id || lineIndex}`,
        offerId: line.offer?.id || "",
        name: line.offer?.name || "Produkt Allegro",
        sku: line.offer?.external?.id || "",
        quantity: line.quantity || 1,
        unitPrice: numberValue(line.price?.amount),
        vatRate: numberValue(line.tax?.percentage) || 23,
      })),
    } satisfies AllegroOrder;
  });
}
