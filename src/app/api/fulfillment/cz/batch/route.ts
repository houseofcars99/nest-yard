import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ADMIN_TOKEN = process.env.FULFILMENT_ADMIN_TOKEN;

const dbHeaders = () => ({
  apikey: SUPABASE_SECRET_KEY!,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY!}`,
  "Content-Type": "application/json",
});

const normalize = (value: string) => value.trim().toUpperCase().replace(/[\s-]+/g, "");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function csvForRegistrations(registrations: string[]) {
  return `${registrations.map(normalize).join("\r\n")}\r\n`;
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !ADMIN_TOKEN) {
    return NextResponse.json({ error: "Fulfilment admin is not configured." }, { status: 503 });
  }
  if (request.headers.get("x-fulfilment-token") !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const ordersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vignette_orders?payment_status=eq.paid&status=in.(paid,processing)&select=id,order_number,customer_email`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!ordersResponse.ok) throw new Error("Nie udało się pobrać opłaconych zamówień.");
    const orders = await ordersResponse.json();
    if (!orders.length) return NextResponse.json({ batchId: null, sets: [], manualRequired: [], message: "Brak opłaconych zamówień Czech." });

    const orderIds = orders.map((order: { id: string }) => order.id);
    const itemsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vignette_order_items?country_code=eq.CZ&order_id=in.(${orderIds.join(",")})&fulfilment_status=in.(pending,failed)&select=id,order_id,registration_country,registration_number,fuel_type,start_date,validity,product_name,vehicle_type,fulfilment_batch_id`,
      { headers: dbHeaders(), cache: "no-store" },
    );
    if (!itemsResponse.ok) throw new Error("Nie udało się pobrać pozycji zamówień Czech.");
    const items = await itemsResponse.json();

    const candidates = items.filter((item: any) => !item.fulfilment_batch_id);
    const manualRequired = candidates.filter((item: any) => !item.start_date || String(item.start_date) <= today());
    const batchable = candidates.filter((item: any) => item.start_date && String(item.start_date) > today());
    if (!batchable.length) {
      return NextResponse.json({ batchId: null, sets: [], manualRequired: manualRequired.map((item: any) => ({ itemId: item.id, reason: "Hromadny zakup eDalnice nie obsługuje natychmiastowego początku ważności.", registrationNumber: item.registration_number })), message: "Brak pozycji kwalifikujących się do zakupu grupowego." });
    }

    const groups = new Map<string, any[]>();
    for (const item of batchable) {
      const key = [item.registration_country, item.fuel_type ?? "standard", item.validity, item.start_date, item.vehicle_type].join("|");
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }

    const sets: Array<{ setId: string; registrationCountry: string; fuelType: string; validity: string; startDate: string; vehicleType: string; itemIds: string[]; registrations: string[]; csv: string }> = [];
    for (const [key, group] of groups) {
      const [registrationCountry, fuelType, validity, startDate, vehicleType] = key.split("|");
      for (let offset = 0; offset < group.length; offset += 200) {
        const chunk = group.slice(offset, offset + 200);
        const setId = `${sets.length + 1}`;
        sets.push({
          setId,
          registrationCountry,
          fuelType,
          validity,
          startDate,
          vehicleType,
          itemIds: chunk.map((item) => item.id),
          registrations: chunk.map((item) => normalize(item.registration_number)),
          csv: csvForRegistrations(chunk.map((item) => item.registration_number)),
        });
      }
    }

    const snapshotItems = batchable.map((item: any) => {
      const order = orders.find((candidate: any) => candidate.id === item.order_id);
      const set = sets.find((candidate) => candidate.itemIds.includes(item.id));
      return {
        itemId: item.id,
        orderId: item.order_id,
        orderNumber: order?.order_number ?? null,
        customerEmail: order?.customer_email ?? null,
        registrationCountry: item.registration_country,
        registrationNumber: normalize(item.registration_number),
        fuelType: item.fuel_type ?? "standard",
        validity: item.validity,
        startDate: item.start_date,
        vehicleType: item.vehicle_type,
        fulfilmentId: item.id,
        setId: set?.setId ?? null,
      };
    });

    const batchResponse = await fetch(`${SUPABASE_URL}/rest/v1/vignette_fulfilment_batches`, {
      method: "POST",
      headers: { ...dbHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({ country_code: "CZ", provider: "edalnice-official", status: "draft", snapshot: { items: snapshotItems, sets: sets.map(({ csv, ...set }) => set) } }),
    });
    if (!batchResponse.ok) throw new Error("Nie udało się utworzyć partii realizacyjnej.");
    const [batch] = await batchResponse.json();

    for (const item of batchable) {
      await fetch(`${SUPABASE_URL}/rest/v1/vignette_order_items?id=eq.${item.id}&fulfilment_batch_id=is.null`, {
        method: "PATCH",
        headers: { ...dbHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ fulfilment_batch_id: batch.id, fulfilment_provider: "edalnice-official", fulfilment_status: "processing", fulfilment_started_at: new Date().toISOString(), fulfilment_last_error: null }),
      });
    }

    return NextResponse.json({
      batchId: batch.id,
      provider: "edalnice-official",
      officialBulkUrl: "https://edalnice.gov.cz/cs/hromadny-nakup/krok-1",
      sets,
      manualRequired: manualRequired.map((item: any) => ({ itemId: item.id, registrationNumber: normalize(item.registration_number), reason: "Hromadny zakup eDalnice nie obsługuje natychmiastowego początku ważności." })),
      totalItems: batchable.length,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nie udało się przygotować partii." }, { status: 500 });
  }
}
