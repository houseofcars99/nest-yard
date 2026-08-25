import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405 });
  const checks: Record<string, boolean> = {
    supabase: false,
    storage: false,
    email: Boolean(Deno.env.get("RESEND_API_KEY") && Deno.env.get("VIGNETTE_FROM_EMAIL")),
  };

  const { error: dbError } = await supabase.from("vignette_fulfilment_batches").select("id").limit(1);
  checks.supabase = !dbError;
  const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
  checks.storage = !storageError && Boolean(buckets?.some((bucket) => bucket.name === "vignettes" && bucket.public === false));

  const ready = Object.values(checks).every(Boolean);
  return Response.json({ ready, checks }, { status: ready ? 200 : 503 });
});
