import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { db } from "@/lib/db";
import sharp from "sharp";
import heicConvert from "heic-convert";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await requireApiSession("products");
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = (formData.get("productId") as string) || "item";
    const previousUrl = formData.get("previousUrl") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const originalName = file.name || "";
    const ext = path.extname(originalName).toLowerCase();
    const mime = file.type?.toLowerCase() || "";

    const isHeic =
      ext === ".heic" ||
      ext === ".heif" ||
      mime.includes("heic") ||
      mime.includes("heif");

    let rawBuffer = Buffer.from(await file.arrayBuffer());

    // Convert iPhone HEIC/HEIF to JPEG first
    if (isHeic) {
      try {
        const converted = await heicConvert({
          buffer: rawBuffer,
          format: "JPEG",
          quality: 1,
        });
        rawBuffer = Buffer.from(converted);
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        return NextResponse.json(
          { error: "Impossible de convertir l'image iPhone HEIC/HEIF" },
          { status: 400 }
        );
      }
    }

    // Process with sharp: rotate by EXIF, resize max 1200x1200, output webp
    const optimizedBuffer = await sharp(rawBuffer)
      .rotate()
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const cleanProductId = productId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "prod";
    const filename = `prod-${cleanProductId}-${Date.now()}.webp`;

    // 1. Primary: Save directly in Supabase PostgreSQL (Immune to Vercel read-only EROFS)
    await db.uploadedImage.upsert({
      where: { filename },
      create: {
        filename,
        data: Buffer.from(optimizedBuffer),
        mimeType: "image/webp",
        sizeBytes: optimizedBuffer.length,
      },
      update: {
        data: Buffer.from(optimizedBuffer),
        mimeType: "image/webp",
        sizeBytes: optimizedBuffer.length,
      },
    });

    // 2. Clean up previous image from database if replacing
    if (previousUrl && typeof previousUrl === "string") {
      if (previousUrl.startsWith("/api/uploads/")) {
        const prevFilename = path.basename(previousUrl);
        if (prevFilename && prevFilename !== filename && !prevFilename.includes("..")) {
          await db.uploadedImage.deleteMany({
            where: { filename: prevFilename },
          }).catch(() => {});
        }
      }
    }

    // 3. Best-effort local file backup (silent on Vercel EROFS read-only environment)
    try {
      const uploadsDir = path.join(process.cwd(), "data", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        await fs.promises.mkdir(uploadsDir, { recursive: true });
      }
      const destPath = path.join(uploadsDir, filename);
      await fs.promises.writeFile(destPath, optimizedBuffer);

      if (previousUrl && typeof previousUrl === "string") {
        const prevFilename = path.basename(previousUrl);
        if (prevFilename && prevFilename !== filename) {
          const prevPath = path.join(uploadsDir, prevFilename);
          if (fs.existsSync(prevPath)) {
            await fs.promises.unlink(prevPath).catch(() => {});
          }
        }
      }
    } catch {
      // Intentionally ignore EROFS / filesystem errors on Vercel
    }

    const url = `/api/uploads/${filename}`;
    return NextResponse.json({
      url,
      filename,
      type: "image",
    });
  } catch (err) {
    console.error("Admin product upload error:", err);
    return NextResponse.json(
      { error: "Échec du traitement et de l'enregistrement de l'image" },
      { status: 500 }
    );
  }
}
