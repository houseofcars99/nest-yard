import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { createHash } from "node:crypto";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
const MAX_ENTRY_BYTES = 5 * 1024 * 1024;
const MAX_ENTRIES = 250;

function sha256(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
function normalize(value: string) { return value.trim().toUpperCase().replace(/[\s-]+/g, ""); }
function safeName(name: string) { const clean = name.replaceAll("\\", "/").split("/").pop() ?? "file"; return clean.replace(/[^a-zA-Z0-9._-]/g, "_"); }
function normalizeDate(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : value;
}
function parseConfirmation(text: string) {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  return {
    registrationNumber: normalized.match(/(?:registration number|license plate|spz|registrační značka)\s*[:\-]?\s*([A-Z0-9 .-]{2,16})/i)?.[1]?.trim() ?? null,
    registrationCountry: normalized.match(/(?:registration country|country of registration|stát registrace)\s*[:\-]?\s*([A-Z]{2})/i)?.[1]?.trim() ?? null,
    validity: normalized.match(/(?:validity|vignette type|period|druh časového poplatku|druh známky)\s*[:\-]?\s*([^\n]{1,40})/i)?.[1]?.trim() ?? null,
    startDate: normalizeDate(normalized.match(/(?:valid from|start date|beginning of validity|počátek platnosti)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i)?.[1]?.trim() ?? null),
    operatorReference: normalized.match(/(?:transaction|order|reference|identifikační číslo obchodní transakce|číslo dokladu|autorizační kód)\s*(?:number|no\.?|id)?\s*[:\-]?\s*([A-Z0-9-]{4,64})/i)?.[1]?.trim() ?? null,
  };
}

async function sendQueuedEmail(orderId: string, matchId: string, recipientEmail: string) {
  let { data: message } = await supabase.from("vignette_delivery_messages").select("id,status").eq("order_id", orderId).maybeSingle();
  if (!message) {
    const { data: created } = await supabase.from("vignette_delivery_messages").insert({ order_id: orderId, fulfilment_match_id: matchId, recipient_email: recipientEmail, status: "pending" }).select("id,status").single();
    message = created;
  }
  if (!message || message.status === "sent") return;
  if (!Deno.env.get("RESEND_API_KEY") || !Deno.env.get("VIGNETTE_FROM_EMAIL")) return;
  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-vignette-email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, "Content-Type": "application/json" },
    body: JSON.stringify({ messageId: message.id }),
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const { batchId, archivePath } = await req.json();
  if (!batchId || !archivePath) return Response.json({ error: "batchId and archivePath are required" }, { status: 400 });

  const { data: batch, error: batchError } = await supabase.from("vignette_fulfilment_batches").select("id,snapshot,status").eq("id", batchId).single();
  if (batchError || !batch) return Response.json({ error: "Batch not found" }, { status: 404 });
  const { data: archive, error: downloadError } = await supabase.storage.from("vignettes").download(archivePath);
  if (downloadError || !archive) return Response.json({ error: "Archive not found" }, { status: 404 });
  const bytes = new Uint8Array(await archive.arrayBuffer());
  if (bytes.byteLength > MAX_ARCHIVE_BYTES) return Response.json({ error: "Archive too large" }, { status: 413 });

  let zip;
  try { zip = await JSZip.loadAsync(bytes); } catch { return Response.json({ error: "Invalid ZIP archive" }, { status: 400 }); }
  const entries = Object.values(zip.files).filter((entry: any) => !entry.dir);
  if (entries.length > MAX_ENTRIES) return Response.json({ error: "Too many files in archive" }, { status: 413 });

  const snapshot = Array.isArray(batch.snapshot?.items) ? batch.snapshot.items : [];
  const processed: Array<{ sourceFile: string; storagePath: string; sha256: string; status: string; orderId?: string | null }> = [];

  for (const entry of entries as any[]) {
    const name = safeName(entry.name);
    if (!/\.(pdf|txt)$/i.test(name)) continue;
    const fileBytes = await entry.async("uint8array");
    if (fileBytes.byteLength > MAX_ENTRY_BYTES) return Response.json({ error: `Entry too large: ${name}` }, { status: 413 });
    const storagePath = `fulfilment/cz/${batchId}/${crypto.randomUUID()}-${name}`;
    const { error: uploadError } = await supabase.storage.from("vignettes").upload(storagePath, fileBytes, { contentType: /\.pdf$/i.test(name) ? "application/pdf" : "text/plain", upsert: false });
    if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

    const parsed = /\.txt$/i.test(name) ? parseConfirmation(new TextDecoder().decode(fileBytes)) : { registrationNumber: null, registrationCountry: null, validity: null, startDate: null, operatorReference: null };
    const normalizedName = normalize(name.replace(/\.[^.]+$/, ""));
    const candidates = snapshot.filter((item: any) => {
      const plate = normalize(String(item.registrationNumber ?? ""));
      const textPlate = parsed.registrationNumber ? normalize(parsed.registrationNumber) : null;
      return (textPlate && plate === textPlate && (!parsed.registrationCountry || normalize(item.registrationCountry) === normalize(parsed.registrationCountry))) || (!textPlate && plate && normalizedName.includes(plate));
    });
    const matched = candidates.length === 1 ? candidates[0] : null;
    const status = matched ? "matched" : candidates.length > 1 ? "needs_review" : "unmatched";
    const { data: inserted, error } = await supabase.from("vignette_fulfilment_matches").upsert({
      batch_id: batchId, fulfilment_id: matched?.fulfilmentId ?? null, order_id: matched?.orderId ?? null, source_file: name, status,
      match_data: { ...parsed, source: /\.txt$/i.test(name) ? "text" : "filename" }, operator_reference: parsed.operatorReference,
      confirmation_file_path: storagePath, confirmation_sha256: sha256(fileBytes),
    }, { onConflict: "batch_id,source_file" }).select("id,order_id,status").single();
    if (error) return Response.json({ error: error.message }, { status: 500 });

    if (matched && inserted?.id) {
      await supabase.from("vignette_order_items").update({ fulfilment_status: "completed", operator_reference: parsed.operatorReference, operator_confirmation: storagePath, fulfilment_completed_at: new Date().toISOString(), fulfilment_last_error: null }).eq("id", matched.itemId);
      if (matched.orderId && matched.customerEmail) await sendQueuedEmail(matched.orderId, inserted.id, matched.customerEmail);
    }
    processed.push({ sourceFile: name, storagePath, sha256: sha256(fileBytes), status, orderId: matched?.orderId ?? null });
  }

  const matchedCount = processed.filter((file) => file.status === "matched").length;
  const expectedCount = snapshot.length;
  const batchStatus = expectedCount > 0 && matchedCount === expectedCount ? "completed" : "processing";
  await supabase.from("vignette_fulfilment_batches").update({ status: batchStatus, source_file_path: archivePath, received_at: new Date().toISOString(), completed_at: batchStatus === "completed" ? new Date().toISOString() : null }).eq("id", batchId);

  const orderIds = [...new Set(processed.filter((file) => file.orderId).map((file) => file.orderId!))];
  for (const orderId of orderIds) {
    const { data: orderItems } = await supabase.from("vignette_order_items").select("fulfilment_status").eq("order_id", orderId);
    if (orderItems?.length && orderItems.every((item) => item.fulfilment_status === "completed")) await supabase.from("vignette_orders").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", orderId);
  }

  return Response.json({ batchId, processedCount: processed.length, matchedCount, expectedCount, status: batchStatus, files: processed });
}

Deno.serve(handler);
