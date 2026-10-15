import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

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

  try {
    // 1. Primary source: Fetch persistent binary image from Supabase PostgreSQL
    // (Works 100% reliably on Vercel Serverless & Read-Only filesystems)
    const dbImage = await db.uploadedImage.findUnique({
      where: { filename: safeFilename },
      select: { data: true, mimeType: true, sizeBytes: true },
    });

    if (dbImage) {
      return new Response(dbImage.data, {
        status: 200,
        headers: {
          "Content-Type": dbImage.mimeType,
          "Content-Length": dbImage.sizeBytes.toString(),
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        },
      });
    }

    // 2. Secondary fallback: Check local disk (data/uploads/ or public/) if running locally or pre-bundled
    const candidateDirs = [
      path.join(process.cwd(), "data", "uploads"),
      path.join(process.cwd(), "public", "uploads"),
      path.join(process.cwd(), "public", "images"),
      path.join(process.cwd(), "public"),
    ];

    for (const dir of candidateDirs) {
      const candidatePath = path.join(dir, safeFilename);
      if (fs.existsSync(candidatePath)) {
        const stat = await fs.promises.stat(candidatePath);
        if (stat.isFile()) {
          const fileBuffer = await fs.promises.readFile(candidatePath);
          const ext = path.extname(safeFilename).toLowerCase();
          const contentType = MIME_MAP[ext] || "application/octet-stream";

          return new Response(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Content-Length": stat.size.toString(),
              "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
            },
          });
        }
      }
    }

    return new Response("Image not found", { status: 404 });
  } catch (error) {
    console.error("Error serving uploaded image:", error);
    return new Response("Error serving file", { status: 500 });
  }
}
