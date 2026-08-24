import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = signature.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some((value) => {
    try {
      return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(value, "utf8"));
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return new NextResponse("Webhook not configured", { status: 500 });

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET)) return new NextResponse("Invalid signature", { status: 400 });

  try {
    const event = JSON.parse(payload) as { type?: string; data?: { object?: Record<string, unknown> } };
    const supported = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
    if (!supported.has(event.type ?? "")) return NextResponse.json({ received: true });

    const session = event.data?.object ?? {};
    const metadata = (session.metadata ?? {}) as Record<string, unknown>;
    const orderId = typeof metadata.order_id === "string" ? metadata.order_id : "";
    const orderNumber = typeof metadata.order_number === "string" ? metadata.order_number : "";
    const paymentStatus = session.payment_status;
    if (!orderId && !orderNumber) return NextResponse.json({ received: true });
    if (paymentStatus !== "paid") return NextResponse.json({ received: true });

    const headers = { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };
    const filter = orderId ? `id=eq.${encodeURIComponent(orderId)}` : `order_number=eq.${encodeURIComponent(orderNumber)}`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vignette_orders?${filter}`, { method: "PATCH", headers, body: JSON.stringify({ payment_status: "paid", status: "paid" }) });
    if (!response.ok) {
      console.error("Stripe webhook could not mark order paid", await response.text());
      return new NextResponse("Database update failed", { status: 502 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error", error);
    return new NextResponse("Invalid webhook payload", { status: 400 });
  }
}
