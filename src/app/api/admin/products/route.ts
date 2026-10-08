import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiSession } from "@/lib/auth";
import { slugify } from "@/lib/format";

interface VariantInput {
  name: string;
  required?: boolean;
  sortOrder?: number;
  options?: { label: string; priceModifier?: number; hexColor?: string; stock?: number; sortOrder?: number }[];
}

function buildProductData(body: Record<string, unknown>) {
  const price = parseFloat(String(body.price));
  if (isNaN(price) || price < 0) return null;
  return {
    name: String(body.name || "").trim(),
    slug: slugify(String(body.slug || body.name || "")) || `product-${Date.now()}`,
    sku: body.sku ? String(body.sku).trim() : null,
    shortDescription: body.shortDescription ? String(body.shortDescription) : null,
    description: body.description ? String(body.description) : null,
    price,
    comparePrice: body.comparePrice ? parseFloat(String(body.comparePrice)) || null : null,
    costPrice: body.costPrice ? parseFloat(String(body.costPrice)) || null : null,
    weightGrams: parseInt(String(body.weightGrams ?? 500)) || 500,
    stock: body.trackStock === false ? 0 : parseInt(String(body.stock ?? 0)) || 0,
    trackStock: body.trackStock !== false,
    active: body.active !== false,
    featured: Boolean(body.featured),
    media: typeof body.media === "string" ? body.media : JSON.stringify(body.media || []),
    categoryId: body.categoryId ? String(body.categoryId) : null,
  };
}

// GET /api/admin/products
export async function GET(req: NextRequest) {
  const guard = await requireApiSession("products");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const products = await db.product.findMany({
    where: search ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] } : undefined,
    include: { category: true, variants: { include: { options: true } }, _count: { select: { orderItems: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
  const guard = await requireApiSession("products");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const body = await req.json();
    const data = buildProductData(body);
    if (!data || !data.name) return NextResponse.json({ error: "Product name and a valid price are required." }, { status: 400 });

    const exists = await db.product.findUnique({ where: { slug: data.slug } });
    if (exists) data.slug = `${data.slug}-${Date.now().toString(36)}`;

    const variants = (Array.isArray(body.variants) ? body.variants : []) as VariantInput[];
    const product = await db.product.create({
      data: {
        ...data,
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
    return NextResponse.json({ product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create the product." }, { status: 500 });
  }
}
