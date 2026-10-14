import { NextRequest, NextResponse } from "next/navigation";
import fs from "fs";
import path from "path";

const MIME_MAP: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ filename: string }> }
) {
  const { filename } = await ctx.params;

  // Strict path traversal defense: enforce basename
  const safeFilename = path.basename(filename);
  if (!safeFilename || safeFilename !== filename || safeFilename.includes("..")) {
    return new Response("Invalid filename", { status: 400 });
  }

  const filePath = path.join(process.cwd(), "data", "uploads", safeFilename);

  if (!fs.existsSync(filePath)) {
    return new Response("File not found", { status: 404 });
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      return new Response("Not a file", { status: 400 });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const fileBuffer = await fs.promises.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return new Response("Error serving file", { status: 500 });
  }
}
