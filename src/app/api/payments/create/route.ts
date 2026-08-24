import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Płatność nie jest jeszcze skonfigurowana na serwerze." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
    if (!orderNumber) return NextResponse.json({ error: "Brak numeru zamówienia." }, { status: 400 });

    const dbHeaders = { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}` };
    const orderResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,order_number,customer_email,total_amount,currency,payment_status,status`, { headers: dbHeaders, cache: "no-store" });
    if (!orderResponse.ok) return NextResponse.json({ error: "Nie udało się odczytać zamówienia." }, { status: 502 });
    const orders = await orderResponse.json();
    const order = orders[0];
    if (!order) return NextResponse.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });
    if (order.payment_status === "paid") return NextResponse.json({ error: "To zamówienie jest już opłacone." }, { status: 409 });
    if (!order.total_amount || !order.currency || order.currency === "MULTI") return NextResponse.json({ error: "Jedna płatność może obecnie obejmować tylko winiety w tej samej walucie." }, { status: 400 });

    const itemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_order_items?order_id=eq.${encodeURIComponent(order.id)}&select=product_name,validity,registration_number,final_price,currency`, { headers: dbHeaders, cache: "no-store" });
    if (!itemsResponse.ok) return NextResponse.json({ error: "Nie udało się odczytać pozycji zamówienia." }, { status: 502 });
    const items = await itemsResponse.json();
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: "Zamówienie nie zawiera pozycji." }, { status: 400 });

    const origin = new URL(request.url).origin;
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${origin}/checkout?payment=cancelled`);
    params.set("customer_email", order.customer_email);
    params.set("metadata[order_number]", order.order_number);
    params.set("metadata[order_id]", order.id);
    params.set("payment_intent_data[metadata][order_number]", order.order_number);
    params.set("payment_intent_data[metadata][order_id]", order.id);

    items.forEach((item: { product_name: string; validity: string; registration_number: string; final_price: number; currency: string }, index: number) => {
      params.set(`line_items[${index}][price_data][currency]`, String(item.currency).toLowerCase());
      params.set(`line_items[${index}][price_data][product_data][name]`, `Winieta ${item.product_name}`);
      params.set(`line_items[${index}][price_data][product_data][description]`, `${item.validity} · ${item.registration_number}`);
      params.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(Number(item.final_price) * 100)));
      params.set(`line_items[${index}][quantity]`, "1");
    });

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "no-store",
    });
    const stripeData = await stripeResponse.json();
    if (!stripeResponse.ok || !stripeData.url) {
      console.error("Stripe checkout creation failed", stripeData);
      return NextResponse.json({ error: "Nie udało się uruchomić bezpiecznej płatności." }, { status: 502 });
    }

    const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      headers: { ...dbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ payment_status: "processing" }),
    });
    if (!patchResponse.ok) console.error("Could not update payment status", await patchResponse.text());

    return NextResponse.json({ url: stripeData.url });
  } catch (error) {
    console.error("Payment creation error", error);
    return NextResponse.json({ error: "Nie udało się uruchomić płatności." }, { status: 500 });
  }
}
