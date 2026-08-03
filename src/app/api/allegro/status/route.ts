import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { allegroConfig } from "@/lib/allegro-server";

export async function GET() {
  const config = allegroConfig();
  const cookieStore = await cookies();
  return NextResponse.json({
    configured: config.configured,
    connected: Boolean(cookieStore.get("ny_allegro_access")?.value || cookieStore.get("ny_allegro_refresh")?.value),
    environment: config.environment,
    missing: config.missing,
  });
}
