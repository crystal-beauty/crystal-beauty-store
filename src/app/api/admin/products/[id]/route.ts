import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession, canDelete } from "@/lib/auth";
import { slugify } from "@/lib/format";

interface VariantInput {
  name: string;
  required?: boolean;
  sortOrder?: number;
  options?: { label: string; priceModifier?: number; hexColor?: string; stock?: number; sortOrder?: number }[];
}

// GET /api/admin/products/[id]
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("products");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { id } = await ctx.params;
  const product = await db.product.findUnique({
    where: { id },
    include: { category: true, variants: { include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

// PUT /api/admin/products/[id]
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("products");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const price = parseFloat(String(body.price));
    if (!body.name?.trim() || isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Product name and a valid price are required." }, { status: 400 });
    }

    const slug = slugify(String(body.slug || body.name || "")) || `product-${Date.now()}`;
    const clash = await db.product.findFirst({ where: { slug, id: { not: id } } });

    const variants = (Array.isArray(body.variants) ? body.variants : []) as VariantInput[];

    const product = await db.$transaction(async (tx) => {
      await tx.variantOption.deleteMany({ where: { variant: { productId: id } } });
      await tx.variant.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          name: String(body.name).trim(),
          slug: clash ? `${slug}-${Date.now().toString(36)}` : slug,
          sku: body.sku ? String(body.sku).trim() : null,
          shortDescription: body.shortDescription ? String(body.shortDescription) : null,
          description: body.description ? String(body.description) : null,
          price,
          comparePrice: body.comparePrice ? parseFloat(String(body.comparePrice)) || null : null,
          costPrice: body.costPrice ? parseFloat(String(body.costPrice)) || null : null,
          stock: body.trackStock === false ? 0 : parseInt(String(body.stock ?? 0)) || 0,
          trackStock: body.trackStock !== false,
          active: body.active !== false,
          featured: Boolean(body.featured),
          media: typeof body.media === "string" ? body.media : JSON.stringify(body.media || []),
          categoryId: body.categoryId ? String(body.categoryId) : null,
          variants: {
            create: variants
              .filter((v) => v.name?.trim())
              .map((v, vi) => ({
                name: v.name.trim(),
                required: v.required !== false,
                sortOrder: v.sortOrder ?? vi,
                options: {
                  create: (v.options || [])
                    .filter((o) => o.label?.trim())
                    .map((o, oi) => ({
                      label: o.label.trim(),
                      priceModifier: parseFloat(String(o.priceModifier ?? 0)) || 0,
                      hexColor: o.hexColor || null,
                      stock: o.stock === null || o.stock === undefined ? null : parseInt(String(o.stock)) || null,
                      sortOrder: o.sortOrder ?? oi,
                    })),
                },
              })),
          },
        },
        include: { variants: { include: { options: true } } },
      });
    });

    return NextResponse.json({ product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not update the product." }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireApiSession("products");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!canDelete(guard.session.role, "products")) {
    return NextResponse.json({ error: "You do not have permission to delete products." }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    // Product referenced by orders — soft-delete instead
    await db.product.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true, softDeleted: true, message: "Product is referenced by orders, so it was archived (deactivated) instead." });
  }
}
