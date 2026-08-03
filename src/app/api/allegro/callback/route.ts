import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/allegro-server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("ny_allegro_state")?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/admin?allegro=invalid-state", request.url));
  }
  try {
    const token = await exchangeCode(code);
    const response = NextResponse.redirect(new URL("/admin?allegro=connected", request.url));
    const common = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    response.cookies.set("ny_allegro_access", token.access_token, { ...common, maxAge: Math.max(60, token.expires_in - 60) });
    response.cookies.set("ny_allegro_refresh", token.refresh_token, { ...common, maxAge: 60 * 60 * 24 * 89 });
    response.cookies.delete("ny_allegro_state");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/admin?allegro=oauth-error", request.url));
  }
}
