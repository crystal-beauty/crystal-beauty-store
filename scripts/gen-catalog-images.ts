/**
 * Catalog image generator — Lumina Gifts starter catalog.
 * Generates 12 illustrated-style product/category images in the SAME
 * art direction as the hero illustration (flat vector, navy #0a1f44 +
 * white, pure white background, no text) per the owner's direction:
 * "illustrated style, not realistic".
 * Output: public/uploads/catalog/*.png
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "public", "uploads", "catalog");

// Shared art direction — every prompt uses this SAME style tail so the
// whole catalog feels like one designed set, matching the hero artwork.
const STYLE =
  "flat minimal vector illustration, elegant premium gift shop aesthetic, " +
  "STRICTLY two colors: dark navy blue (#0a1f44) and white, plus very soft light gray shading only — " +
  "absolutely NO pink, NO red, NO yellow, NO gold, NO green, NO beige, NO warm colors anywhere, " +
  "rounded soft shapes, a few tiny white star sparkles around, " +
  "single centered object on pure white background, " +
  "no text, no letters, no words, no watermark, no border, " +
  "clean crisp edges, high quality";

const IMAGES: { file: string; subject: string }[] = [
  {
    file: "prod-lampe-lune.png",
    subject:
      "a glowing crescent moon night lamp on a small elegant round stand, soft white light halo",
  },
  {
    file: "prod-veilleuse-etoiles.png",
    subject:
      "a dome-shaped star projector night light on a small base, projecting tiny white stars upward",
  },
  {
    file: "prod-bougie.png",
    subject:
      "a scented candle in a dark navy glass jar decorated with tiny white stars, one soft white flame",
  },
  {
    file: "prod-coffret.png",
    subject:
      "an open elegant gift box in dark navy with a white satin ribbon bow and white tissue paper inside",
  },
  {
    file: "prod-mug.png",
    subject:
      "a ceramic mug in dark navy decorated with a white crescent moon and small stars pattern, with steam curling up",
  },
  {
    file: "prod-ours.png",
    subject:
      "a cute round teddy bear plush toy in dark navy blue holding a small white heart",
  },
  {
    file: "prod-rose.png",
    subject:
      "a single elegant rose under a round glass dome cloche on a dark navy wooden base",
  },
  {
    file: "prod-bouquet.png",
    subject:
      "a wrapped flower bouquet in dark navy and white paper wrapping tied with a white ribbon",
  },
  {
    file: "prod-plaid.png",
    subject:
      "a neatly folded soft blanket with a subtle white crescent moon and stars pattern on dark navy fabric",
  },
  {
    file: "cat-luminaires.png",
    subject:
      "a small collection of night lamps: a crescent moon lamp, a star projector dome and a tiny lantern side by side",
  },
  {
    file: "cat-coffrets.png",
    subject:
      "two stacked gift boxes with white ribbon bows next to a scented candle jar",
  },
  {
    file: "cat-peluches.png",
    subject:
      "a cute navy teddy bear sitting next to a bouquet of white flowers wrapped in dark navy blue paper tied with a white satin ribbon, monochrome navy blue and white artwork, all sparkles are white, no fireworks",
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();

  const only = process.argv.slice(2); // allow regen of specific files
  const list = only.length
    ? IMAGES.filter((i) => only.includes(i.file))
    : IMAGES;

  const results: { file: string; ok: boolean; ms: number }[] = [];

  for (const img of list) {
    const outPath = path.join(OUT_DIR, img.file);
    if (fs.existsSync(outPath) && !only.length) {
      console.log(`↷ skip (exists): ${img.file}`);
      results.push({ file: img.file, ok: true, ms: 0 });
      continue;
    }
    const t0 = Date.now();
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: `${img.subject}, ${STYLE}`,
          size: "1024x1024",
        });
        const b64 = res?.data?.[0]?.base64;
        if (!b64) throw new Error("empty base64");
        fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
        ok = true;
        console.log(`✓ ${img.file} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`  attempt ${attempt} failed for ${img.file}: ${msg}`);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    results.push({ file: img.file, ok, ms: Date.now() - t0 });
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nDone: ${results.length - failed.length}/${results.length} generated${
      failed.length ? ` — FAILED: ${failed.map((f) => f.file).join(", ")}` : ""
    }`,
  );
  process.exit(failed.length ? 1 : 0);
}

main();
