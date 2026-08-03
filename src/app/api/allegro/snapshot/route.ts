import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllegroSnapshot, refreshAccessToken } from "@/lib/allegro-server";

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("ny_allegro_access")?.value || "";
  const refreshToken = cookieStore.get("ny_allegro_refresh")?.value || "";
  let refreshed: { access_token: string; refresh_token: string; expires_in: number } | null = null;

  try {
    if (!accessToken && refreshToken) {
      refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
    }
    if (!accessToken) {
      return NextResponse.json({ connected: false, error: "Konto Allegro nie jest połączone." }, { status: 401 });
    }
    const orders = await getAllegroSnapshot(accessToken);
    const response = NextResponse.json({ connected: true, orders });
    if (refreshed) {
      const common = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      };
      response.cookies.set("ny_allegro_access", refreshed.access_token, { ...common, maxAge: Math.max(60, refreshed.expires_in - 60) });
      response.cookies.set("ny_allegro_refresh", refreshed.refresh_token, { ...common, maxAge: 60 * 60 * 24 * 89 });
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { connected: Boolean(accessToken), error: error instanceof Error ? error.message : "Błąd Allegro API." },
      { status: 502 },
    );
  }
}
