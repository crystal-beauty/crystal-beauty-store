import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSessionToken, setSessionCookie, getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const session = await authenticate(email, password);
    if (!session) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
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
