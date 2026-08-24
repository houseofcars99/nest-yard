import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const PRODUCTS = {
  "cz-1d-standard": { country: "CZ", productName: "Winieta elektroniczna", validity: "1 dzień", vehicleType: "Samochód", price: 210, currency: "CZK" },
  "cz-10d-standard": { country: "CZ", productName: "Winieta elektroniczna", validity: "10 dni", vehicleType: "Samochód", price: 290, currency: "CZK" },
  "cz-30d-standard": { country: "CZ", productName: "Winieta elektroniczna", validity: "30 dni", vehicleType: "Samochód", price: 430, currency: "CZK" },
  "at-1d-car": { country: "AT", productName: "Winieta cyfrowa", validity: "1 dzień", vehicleType: "Samochód", price: 9.6, currency: "EUR" },
  "at-10d-car": { country: "AT", productName: "Winieta cyfrowa", validity: "10 dni", vehicleType: "Samochód", price: 12.8, currency: "EUR" },
  "at-2m-car": { country: "AT", productName: "Winieta cyfrowa", validity: "2 miesiące", vehicleType: "Samochód", price: 32, currency: "EUR" },
  "at-1y-car": { country: "AT", productName: "Winieta cyfrowa", validity: "roczna", vehicleType: "Samochód", price: 106.8, currency: "EUR" },
  "at-1d-motorcycle": { country: "AT", productName: "Winieta cyfrowa", validity: "1 dzień", vehicleType: "Motocykl", price: 3.8, currency: "EUR" },
  "at-10d-motorcycle": { country: "AT", productName: "Winieta cyfrowa", validity: "10 dni", vehicleType: "Motocykl", price: 5.1, currency: "EUR" },
  "ch-e-vignette": { country: "CH", productName: "E-winieta", validity: "roczna", vehicleType: "Samochód", price: 40, currency: "CHF" },
} as const;

type CartItem = {
  id: string;
  registrationNumber: string;
  registrationCountry: string;
  fuelType?: string;
  startDate?: string;
};

function finalPrice(basePrice: number) {
  return Math.round(basePrice * 1.15 * 100) / 100;
}

function validEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Server database is not configured." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, email, acceptedTerms, items } = body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      acceptedTerms?: boolean;
      items?: CartItem[];
    };

    if (!firstName?.trim() || !lastName?.trim() || !validEmail(email) || acceptedTerms !== true) {
      return NextResponse.json({ error: "Uzupełnij dane klienta i zaakceptuj regulamin." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
      return NextResponse.json({ error: "Koszyk jest pusty lub zawiera zbyt wiele pozycji." }, { status: 400 });
    }

    const serverItems = items.map((item) => {
      const product = PRODUCTS[item.id as keyof typeof PRODUCTS];
      if (!product) throw new Error(`Unknown product: ${item.id}`);
      if (!item.registrationNumber?.trim() || !item.registrationCountry?.trim()) throw new Error("Brak danych rejestracyjnych.");
      if (product.country !== "CH" && !item.startDate) throw new Error("Brak daty rozpoczęcia.");
      return {
        ...item,
        product,
        finalPrice: finalPrice(product.price),
      };
    });

    const currencies = [...new Set(serverItems.map((item) => item.product.currency))];
    const totalByCurrency = Object.fromEntries(currencies.map((currency) => [
      currency,
      Math.round(serverItems.filter((item) => item.product.currency === currency).reduce((sum, item) => sum + item.finalPrice, 0) * 100) / 100,
    ]));

    const orderNumber = `VG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const orderPayload = {
      order_number: orderNumber,
      customer_first_name: firstName.trim(),
      customer_last_name: lastName.trim(),
      customer_email: email.trim().toLowerCase(),
      status: "pending",
      payment_status: "unpaid",
      total_amount: currencies.length === 1 ? totalByCurrency[currencies[0]] : null,
      currency: currencies.length === 1 ? currencies[0] : "MULTI",
      accepted_terms_at: new Date().toISOString(),
    };

    const orderResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const details = await orderResponse.text();
      console.error("Supabase order creation failed", details);
      return NextResponse.json({ error: "Nie udało się utworzyć zamówienia." }, { status: 502 });
    }

    const [order] = await orderResponse.json();
    const itemPayload = serverItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      country_code: item.product.country,
      product_name: item.product.productName,
      validity: item.product.validity,
      vehicle_type: item.product.vehicleType,
      registration_country: item.registrationCountry,
      registration_number: item.registrationNumber.trim().toUpperCase(),
      fuel_type: item.fuelType ?? null,
      start_date: item.startDate ?? null,
      final_price: item.finalPrice,
      currency: item.product.currency,
      fulfilment_status: "pending",
    }));

    const itemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_order_items`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemPayload),
    });

    if (!itemsResponse.ok) {
      console.error("Supabase order items creation failed", await itemsResponse.text());
      return NextResponse.json({ error: "Zamówienie utworzono, ale nie udało się zapisać jego pozycji." }, { status: 502 });
    }

    return NextResponse.json({
      orderNumber,
      status: "pending",
      totals: totalByCurrency,
      message: "Zamówienie zostało przygotowane. Płatność nie została jeszcze pobrana.",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieprawidłowe dane zamówienia.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
