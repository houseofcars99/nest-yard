import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("VIGNETTE_FROM_EMAIL");

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  if (!RESEND_API_KEY || !FROM_EMAIL) return Response.json({ error: "Email provider is not configured" }, { status: 503 });

  const { messageId } = await req.json();
  if (!messageId) return Response.json({ error: "messageId is required" }, { status: 400 });

  const { data: message, error } = await supabase
    .from("vignette_delivery_messages")
    .select("id,order_id,fulfilment_match_id,recipient_email,status,attempts")
    .eq("id", messageId)
    .single();
  if (error || !message) return Response.json({ error: "Message not found" }, { status: 404 });
  if (message.status === "sent") return Response.json({ ok: true, status: "already_sent" });

  const { data: match } = await supabase
    .from("vignette_fulfilment_matches")
    .select("status,confirmation_file_path,operator_reference,order_id")
    .eq("id", message.fulfilment_match_id)
    .single();
  if (!match || match.status !== "matched" || match.order_id !== message.order_id || !match.confirmation_file_path) {
    return Response.json({ error: "Delivery is not eligible" }, { status: 409 });
  }

  await supabase.from("vignette_delivery_messages").update({ status: "sending", attempts: message.attempts + 1 }).eq("id", message.id).eq("status", "pending");

  const { data: signed } = await supabase.storage.from("vignettes").createSignedUrl(match.confirmation_file_path, 60 * 60 * 24 * 7);
  if (!signed?.signedUrl) return Response.json({ error: "Confirmation file unavailable" }, { status: 409 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [message.recipient_email],
      subject: "VignetteGO – potwierdzenie zakupu winiety",
      text: `Potwierdzamy realizację zakupu winiety. Dokument potwierdzenia: ${signed.signedUrl}`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    await supabase.from("vignette_delivery_messages").update({ status: "failed", last_error: detail }).eq("id", message.id);
    return Response.json({ error: "Email delivery failed" }, { status: 502 });
  }

  const result = await response.json();
  await supabase.from("vignette_delivery_messages").update({ status: "sent", provider_message_id: result.id ?? null, sent_at: new Date().toISOString(), last_error: null }).eq("id", message.id);
  return Response.json({ ok: true, status: "sent" });
}

Deno.serve(handler);
