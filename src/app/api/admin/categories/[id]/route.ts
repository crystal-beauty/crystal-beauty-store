import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";
import { slugify } from "@/lib/format";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("categories");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    const slug = slugify(body.slug || body.name);
    const clash = await db.category.findFirst({ where: { slug, id: { not: id } } });
    const category = await db.category.update({
      where: { id },
      data: {
        name: String(body.name).trim(),
        slug: clash ? `${slug}-${Date.now().toString(36)}` : slug,
        description: body.description ? String(body.description) : null,
        image: body.image ? String(body.image) : null,
        active: body.active !== false,
        sortOrder: parseInt(String(body.sortOrder ?? 0)) || 0,
      },
    });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Could not update the category." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("categories");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "categories")) {
    return NextResponse.json({ error: "You do not have permission to delete categories." }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await db.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the category." }, { status: 500 });
  }
}
