import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ADMIN_TOKEN = process.env.FULFILMENT_ADMIN_TOKEN;
const MAX_BYTES = 25 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !ADMIN_TOKEN) return NextResponse.json({ error: "Fulfilment admin is not configured." }, { status: 503 });
  if (request.headers.get("x-fulfilment-token") !== ADMIN_TOKEN) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const form = await request.formData();
  const batchId = typeof form.get("batchId") === "string" ? String(form.get("batchId")) : "";
  const file = form.get("file");
  if (!batchId || !(file instanceof File)) return NextResponse.json({ error: "batchId i plik ZIP są wymagane." }, { status: 400 });
  if (!/\.zip$/i.test(file.name)) return NextResponse.json({ error: "Dozwolony jest wyłącznie plik ZIP." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "ZIP jest zbyt duży (maks. 25 MB)." }, { status: 413 });

  const path = `fulfilment/cz/${batchId}/confirmation-${crypto.randomUUID()}.zip`;
  const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/vignettes/${encodeURIComponent(path)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/zip",
      "x-upsert": "false",
    },
    body: await file.arrayBuffer(),
  });
  if (!uploadResponse.ok) return NextResponse.json({ error: "Nie udało się zapisać ZIP-a." }, { status: 502 });

  const functionResponse = await fetch(`${SUPABASE_URL}/functions/v1/process-cz-confirmation-zip`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      apikey: SUPABASE_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ batchId, archivePath: path }),
  });
  const result = await functionResponse.json().catch(() => ({}));
  if (!functionResponse.ok) return NextResponse.json({ error: result?.error ?? "Nie udało się przetworzyć ZIP-a." }, { status: functionResponse.status });
  return NextResponse.json({ batchId, ...result });
}
