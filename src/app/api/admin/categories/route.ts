import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { slugify } from "@/lib/format";

export async function GET() {
  const guard = await requireApiSession("categories");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const guard = await requireApiSession("categories");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    let slug = slugify(body.slug || body.name);
    const exists = await db.category.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;
    const category = await db.category.create({
      data: {
        name: String(body.name).trim(),
        slug,
        description: body.description ? String(body.description) : null,
        image: body.image ? String(body.image) : null,
        active: body.active !== false,
        sortOrder: parseInt(String(body.sortOrder ?? 0)) || 0,
      },
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Could not create the category." }, { status: 500 });
  }
}
