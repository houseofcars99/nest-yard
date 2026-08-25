import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const PRODUCTS = {
  "cz-car-1d-standard": { country: "CZ", productName: "1 dzień", validity: "1 dzień", vehicleType: "Samochód", price: 230, currency: "CZK" },
  "cz-car-10d-standard": { country: "CZ", productName: "10 dni", validity: "10 dni", vehicleType: "Samochód", price: 300, currency: "CZK" },
  "cz-car-30d-standard": { country: "CZ", productName: "30 dni", validity: "30 dni", vehicleType: "Samochód", price: 480, currency: "CZK" },
  "cz-car-annual-standard": { country: "CZ", productName: "roczna", validity: "roczna", vehicleType: "Samochód", price: 2570, currency: "CZK" },
  "at-car-1d": { country: "AT", productName: "1 dzień", validity: "1 dzień", vehicleType: "Samochód", price: 9.6, currency: "EUR" },
  "at-car-10d": { country: "AT", productName: "10 dni", validity: "10 dni", vehicleType: "Samochód", price: 12.8, currency: "EUR" },
  "at-car-2m": { country: "AT", productName: "2 miesiące", validity: "2 miesiące", vehicleType: "Samochód", price: 32, currency: "EUR" },
  "at-car-annual": { country: "AT", productName: "roczna", validity: "roczna", vehicleType: "Samochód", price: 106.8, currency: "EUR" },
  "at-moto-1d": { country: "AT", productName: "1 dzień", validity: "1 dzień", vehicleType: "Motocykl", price: 3.8, currency: "EUR" },
  "at-moto-10d": { country: "AT", productName: "10 dni", validity: "10 dni", vehicleType: "Motocykl", price: 5.1, currency: "EUR" },
  "at-moto-2m": { country: "AT", productName: "2 miesiące", validity: "2 miesiące", vehicleType: "Motocykl", price: 12.8, currency: "EUR" },
  "at-moto-annual": { country: "AT", productName: "roczna", validity: "roczna", vehicleType: "Motocykl", price: 106.8, currency: "EUR" },
  "ch-car-annual": { country: "CH", productName: "e-winieta", validity: "roczna", vehicleType: "Samochód", price: 40, currency: "CHF" },
  "ch-moto-annual": { country: "CH", productName: "e-winieta", validity: "roczna", vehicleType: "Motocykl", price: 40, currency: "CHF" },
} as const;

type CartItem = { id: string; registrationNumber: string; registrationNumberConfirmation?: string; registrationCountry: string; fuelType?: string; startDate?: string };
const finalPrice = (price: number) => Math.round(price * 1.15 * 100) / 100;
const validEmail = (value: unknown) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizeRegistration = (value: string) => value.trim().toUpperCase().replace(/[\s-]+/g, "");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const validStartDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= today();

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return NextResponse.json({ error: "Server database is not configured." }, { status: 500 });
  try {
    const body = await request.json();
    const { firstName, lastName, email, emailConfirmation, acceptedTerms, items } = body as { firstName?: unknown; lastName?: unknown; email?: unknown; emailConfirmation?: unknown; acceptedTerms?: boolean; items?: CartItem[] };
    const customerFirstName = typeof firstName === "string" ? firstName.trim() : "";
    const customerLastName = typeof lastName === "string" ? lastName.trim() : "";
    const customerEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const confirmedEmail = typeof emailConfirmation === "string" ? emailConfirmation.trim().toLowerCase() : "";

    if (!customerFirstName || !customerLastName || !validEmail(customerEmail) || customerEmail !== confirmedEmail || acceptedTerms !== true) return NextResponse.json({ error: "Uzupełnij dane klienta, powtórz prawidłowo e-mail i zaakceptuj regulamin." }, { status: 400 });
    if (!Array.isArray(items) || items.length < 1 || items.length > 20) return NextResponse.json({ error: "Koszyk jest pusty lub zawiera zbyt wiele pozycji." }, { status: 400 });

    const serverItems = items.map((item) => {
      const productId = item.id.replace(/-\d+$/, "");
      const product = PRODUCTS[productId as keyof typeof PRODUCTS];
      if (!product) throw new Error("Nieznany produkt w koszyku.");
      const registration = normalizeRegistration(item.registrationNumber ?? "");
      const registrationConfirmation = normalizeRegistration(item.registrationNumberConfirmation ?? "");
      if (!registration || registration !== registrationConfirmation || !item.registrationCountry?.trim()) throw new Error("Numer rejestracyjny musi zostać podany dwukrotnie i być identyczny.");
      if (product.country !== "CH" && (!item.startDate || !validStartDate(item.startDate))) throw new Error("Data rozpoczęcia winiety nie może być wcześniejsza niż dzisiaj.");
      return { ...item, registrationNumber: registration, productId, product, finalPrice: finalPrice(product.price) };
    });

    const currencies = [...new Set(serverItems.map((item) => item.product.currency))];
    const totalByCurrency = Object.fromEntries(currencies.map((currency) => [currency, Math.round(serverItems.filter((item) => item.product.currency === currency).reduce((sum, item) => sum + item.finalPrice, 0) * 100) / 100]));
    const orderNumber = `VG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const orderPayload = { order_number: orderNumber, customer_first_name: customerFirstName, customer_last_name: customerLastName, customer_email: customerEmail, status: "pending", payment_status: "unpaid", total_amount: currencies.length === 1 ? totalByCurrency[currencies[0]] : null, currency: currencies.length === 1 ? currencies[0] : "MULTI", accepted_terms_at: new Date().toISOString() };

    const headers = { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}`, "Content-Type": "application/json" };
    const orderResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_orders`, { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(orderPayload) });
    if (!orderResponse.ok) { console.error("Supabase order creation failed", await orderResponse.text()); return NextResponse.json({ error: "Nie udało się utworzyć zamówienia." }, { status: 502 }); }
    const [order] = await orderResponse.json();

    const itemPayload = serverItems.map((item) => ({ order_id: order.id, product_id: item.productId, country_code: item.product.country, product_name: item.product.productName, validity: item.product.validity, vehicle_type: item.product.vehicleType, registration_country: item.registrationCountry, registration_number: item.registrationNumber, fuel_type: item.fuelType ?? null, start_date: item.startDate ?? null, final_price: item.finalPrice, currency: item.product.currency, fulfilment_status: "pending" }));
    const itemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_order_items`, { method: "POST", headers, body: JSON.stringify(itemPayload) });
    if (!itemsResponse.ok) { console.error("Supabase order items creation failed", await itemsResponse.text()); return NextResponse.json({ error: "Zamówienie utworzono, ale nie udało się zapisać jego pozycji." }, { status: 502 }); }

    return NextResponse.json({ orderNumber, status: "pending", totals: totalByCurrency, message: "Zamówienie zostało przygotowane. Płatność nie została jeszcze pobrana." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nieprawidłowe dane zamówienia." }, { status: 400 });
  }
}
