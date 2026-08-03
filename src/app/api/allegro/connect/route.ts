import { NextResponse } from "next/server";
import { allegroConfig, allegroScopes } from "@/lib/allegro-server";

export async function GET() {
  const config = allegroConfig();
  if (!config.configured) {
    return NextResponse.json({ error: `Brak konfiguracji: ${config.missing.join(", ")}` }, { status: 503 });
  }
  const state = crypto.randomUUID();
  const url = new URL(`${config.authBase}/auth/oauth/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", allegroScopes);
  url.searchParams.set("state", state);
  const response = NextResponse.redirect(url);
  response.cookies.set("ny_allegro_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
