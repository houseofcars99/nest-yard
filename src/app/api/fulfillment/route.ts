import { NextResponse } from "next/server";
import { getProvider, type FulfilmentCountry, type FulfilmentItem } from "@/lib/fulfillment/providers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const headers = () => ({
  apikey: SUPABASE_SECRET_KEY!,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY!}`,
  "Content-Type": "application/json",
});

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Server database is not configured." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";
    if (!orderNumber) return NextResponse.json({ error: "Brak numeru zamówienia." }, { status: 400 });

    const orderResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vignette_orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,order_number,status,payment_status`,
      { headers: headers(), cache: "no-store" },
    );
    if (!orderResponse.ok) return NextResponse.json({ error: "Nie udało się odczytać zamówienia." }, { status: 502 });

    const [order] = await orderResponse.json();
    if (!order) return NextResponse.json({ error: "Nie znaleziono zamówienia." }, { status: 404 });

    // Fulfilment must never be triggered before a successful payment.
    if (order.payment_status !== "paid") {
      return NextResponse.json({
        status: "waiting_for_payment",
        message: "Realizacja zostanie uruchomiona dopiero po potwierdzeniu płatności.",
      }, { status: 409 });
    }

    const itemsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vignette_order_items?order_id=eq.${order.id}&select=*`,
      { headers: headers(), cache: "no-store" },
    );
    if (!itemsResponse.ok) return NextResponse.json({ error: "Nie udało się odczytać pozycji zamówienia." }, { status: 502 });

    const items = await itemsResponse.json();
    const results = [];

    for (const item of items) {
      if (item.fulfilment_status === "completed") {
        results.push({ itemId: item.id, status: "completed", skipped: true });
        continue;
      }

      const provider = getProvider(item.country_code as FulfilmentCountry);
      if (!provider) {
        results.push({ itemId: item.id, status: "failed", reason: "Brak dostawcy dla kraju." });
        continue;
      }

      const fulfilmentItem: FulfilmentItem = {
        id: item.id,
        productId: item.product_id,
        countryCode: item.country_code,
        registrationCountry: item.registration_country,
        registrationNumber: item.registration_number,
        fuelType: item.fuel_type,
        startDate: item.start_date,
        vehicleType: item.vehicle_type,
        productName: item.product_name,
        validity: item.validity,
      };

      const startedAt = new Date().toISOString();
      await fetch(`${SUPABASE_URL}/rest/v1/vignette_order_items?id=eq.${item.id}`, {
        method: "PATCH",
        headers: { ...headers(), Prefer: "return=minimal" },
        body: JSON.stringify({
          fulfilment_provider: provider.code,
          fulfilment_status: "processing",
          fulfilment_attempts: (item.fulfilment_attempts ?? 0) + 1,
          fulfilment_started_at: startedAt,
          fulfilment_last_error: null,
        }),
      });

      const result = await provider.dispatch(fulfilmentItem);
      const completed = result.status === "completed";
      const finalStatus = completed ? "completed" : result.status === "queued" ? "pending" : "failed";

      await fetch(`${SUPABASE_URL}/rest/v1/vignette_order_items?id=eq.${item.id}`, {
        method: "PATCH",
        headers: { ...headers(), Prefer: "return=minimal" },
        body: JSON.stringify({
          fulfilment_status: finalStatus,
          operator_reference: completed ? result.providerReference : null,
          operator_confirmation: completed ? result.confirmation ?? null : null,
          fulfilment_last_error: completed ? null : result.reason,
          fulfilment_completed_at: completed ? new Date().toISOString() : null,
        }),
      });

      await fetch(`${SUPABASE_URL}/rest/v1/vignette_fulfilment_events`, {
        method: "POST",
        headers: { ...headers(), Prefer: "return=minimal" },
        body: JSON.stringify({
          order_item_id: item.id,
          provider: provider.code,
          event_type: "dispatch",
          status: result.status,
          message: completed ? "Winieta zrealizowana." : result.reason,
          provider_reference: completed ? result.providerReference : null,
        }),
      });

      results.push({ itemId: item.id, provider: provider.code, status: result.status, reason: result.status === "completed" ? undefined : result.reason });
    }

    const allCompleted = results.length > 0 && results.every((result) => result.status === "completed");
    await fetch(`${SUPABASE_URL}/rest/v1/vignette_orders?id=eq.${order.id}`, {
      method: "PATCH",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify({ status: allCompleted ? "completed" : "processing", updated_at: new Date().toISOString() }),
    });

    return NextResponse.json({ orderNumber, status: allCompleted ? "completed" : "processing", results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się uruchomić realizacji." }, { status: 500 });
  }
}
