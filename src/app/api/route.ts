import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ store: "Crystal Beauty", status: "ok" });
}