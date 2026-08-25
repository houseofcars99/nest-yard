import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { createHash } from "node:crypto";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;
const MAX_ENTRY_BYTES = 5 * 1024 * 1024;
const MAX_ENTRIES = 250;

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeName(name: string) {
  const clean = name.replaceAll("\\", "/").split("/").pop() ?? "file";
  return clean.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { batchId, archivePath } = await req.json();
  if (!batchId || !archivePath) return Response.json({ error: "batchId and archivePath are required" }, { status: 400 });

  const { data: batch, error: batchError } = await supabase
    .from("vignette_fulfilment_batches")
    .select("id,status")
    .eq("id", batchId)
    .single();
  if (batchError || !batch) return Response.json({ error: "Batch not found" }, { status: 404 });

  const { data: archive, error: downloadError } = await supabase.storage.from("vignettes").download(archivePath);
  if (downloadError || !archive) return Response.json({ error: "Archive not found" }, { status: 404 });

  const bytes = new Uint8Array(await archive.arrayBuffer());
  if (bytes.byteLength > MAX_ARCHIVE_BYTES) return Response.json({ error: "Archive too large" }, { status: 413 });

  let zip;
  try { zip = await JSZip.loadAsync(bytes); }
  catch { return Response.json({ error: "Invalid ZIP archive" }, { status: 400 }); }

  const entries = Object.values(zip.files).filter((entry: any) => !entry.dir);
  if (entries.length > MAX_ENTRIES) return Response.json({ error: "Too many files in archive" }, { status: 413 });

  const processed: Array<{ sourceFile: string; storagePath: string; sha256: string }> = [];
  for (const entry of entries as any[]) {
    const name = safeName(entry.name);
    if (!/\.(pdf|txt)$/i.test(name)) continue;
    const fileBytes = await entry.async("uint8array");
    if (fileBytes.byteLength > MAX_ENTRY_BYTES) return Response.json({ error: `Entry too large: ${name}` }, { status: 413 });
    const storagePath = `fulfilment/cz/${batchId}/${crypto.randomUUID()}-${name}`;
    const { error } = await supabase.storage.from("vignettes").upload(storagePath, fileBytes, {
      contentType: /\.pdf$/i.test(name) ? "application/pdf" : "text/plain",
      upsert: false,
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    processed.push({ sourceFile: name, storagePath, sha256: sha256(fileBytes) });
  }

  await supabase.from("vignette_fulfilment_batches").update({
    status: "processing",
    source_file_path: archivePath,
    received_at: new Date().toISOString(),
  }).eq("id", batchId);

  return Response.json({ batchId, processedCount: processed.length, files: processed });
}

Deno.serve(handler);
