import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "node:crypto";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalize(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "");
}

function parseConfirmation(text: string) {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  return {
    registrationNumber: normalized.match(/(?:registration number|license plate|spz|rz)\s*[:\-]?\s*([A-Z0-9 .-]{2,16})/i)?.[1]?.trim() ?? null,
    registrationCountry: normalized.match(/(?:registration country|country of registration)\s*[:\-]?\s*([A-Z]{2})/i)?.[1]?.trim() ?? null,
    validity: normalized.match(/(?:validity|vignette type|period)\s*[:\-]?\s*([^\n]{1,40})/i)?.[1]?.trim() ?? null,
    startDate: normalized.match(/(?:valid from|start date|beginning of validity)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4})/i)?.[1]?.trim() ?? null,
    operatorReference: normalized.match(/(?:transaction|order|reference)\s*(?:number|no\.?|id)?\s*[:\-]?\s*([A-Z0-9-]{4,64})/i)?.[1]?.trim() ?? null,
  };
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { batchId, sourceFile, confirmationText, confirmationFilePath } = await req.json();
  if (!batchId || !sourceFile || typeof confirmationText !== "string") {
    return Response.json({ error: "batchId, sourceFile and confirmationText are required" }, { status: 400 });
  }

  const { data: batch, error: batchError } = await supabase
    .from("vignette_fulfilment_batches")
    .select("id,snapshot,status")
    .eq("id", batchId)
    .single();
  if (batchError || !batch) return Response.json({ error: "Batch not found" }, { status: 404 });

  const parsed = parseConfirmation(confirmationText);
  const snapshot = Array.isArray(batch.snapshot) ? batch.snapshot : [];
  const candidates = snapshot.filter((item: any) =>
    parsed.registrationCountry && parsed.registrationNumber &&
    normalize(String(item.registrationCountry)) === normalize(parsed.registrationCountry) &&
    normalize(String(item.registrationNumber)) === normalize(parsed.registrationNumber) &&
    (!parsed.validity || normalize(String(item.validity)) === normalize(parsed.validity)) &&
    (!parsed.startDate || !item.startDate || String(item.startDate) === parsed.startDate)
  );

  const status = candidates.length === 1 && parsed.registrationCountry && parsed.registrationNumber && parsed.validity && parsed.startDate
    ? "matched"
    : candidates.length > 1 ? "needs_review" : "unmatched";

  let confirmationSha256: string | null = null;
  if (confirmationFilePath) {
    const { data: file } = await supabase.storage.from("vignettes").download(confirmationFilePath);
    if (file) confirmationSha256 = sha256(new Uint8Array(await file.arrayBuffer()));
  }

  const matched = status === "matched" ? candidates[0] : null;
  const { data: inserted, error } = await supabase
    .from("vignette_fulfilment_matches")
    .upsert({
      batch_id: batchId,
      fulfilment_id: matched?.fulfilmentId ?? null,
      order_id: matched?.orderId ?? null,
      source_file: sourceFile,
      status,
      match_data: parsed,
      operator_reference: parsed.operatorReference,
      confirmation_file_path: confirmationFilePath ?? null,
      confirmation_sha256: confirmationSha256,
    }, { onConflict: "batch_id,source_file" })
    .select("id,order_id,status")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (status === "matched" && matched?.orderId) {
    const { data: existing } = await supabase
      .from("vignette_delivery_messages")
      .select("id,status")
      .eq("order_id", matched.orderId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("vignette_delivery_messages").insert({
        order_id: matched.orderId,
        fulfilment_match_id: inserted.id,
        recipient_email: matched.customerEmail,
        status: "pending",
      });
    }
  }

  return Response.json({ matchId: inserted.id, status, orderId: matched?.orderId ?? null });
}

Deno.serve(handler);
