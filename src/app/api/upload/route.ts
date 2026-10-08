import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { requireApiSession } from "@/lib/auth";

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

// POST /api/upload — admin media upload → /public/uploads
export async function POST(req: NextRequest) {
  const guard = await requireApiSession("products");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = ALLOWED[file.type as keyof typeof ALLOWED];
    if (!ext) return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WEBP, GIF, SVG, MP4, WEBM or MOV." }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "File is too large (max 15MB)." }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);

    return NextResponse.json({ url: `/uploads/${name}`, type: file.type.startsWith("video") ? "video" : "image" });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
