import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSessionToken, setSessionCookie, getSession } from "@/lib/auth";
import { loginAllowed, loginFailure, loginSuccess } from "@/lib/order-guard";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (!loginAllowed(ip)) {
      return NextResponse.json(
        { error: "Trop de tentatives infructueuses. Veuillez patienter 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const session = await authenticate(email, password);
    if (!session) {
      const blocked = loginFailure(ip);
      const msg = blocked
        ? "Trop de tentatives infructueuses. Accès temporairement bloqué pendant 15 minutes."
        : "Email ou mot de passe incorrect.";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    loginSuccess(ip);
    const token = createSessionToken(session);
    await setSessionCookie(token);
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null }, { status: 401 });
  return NextResponse.json({ session });
}
