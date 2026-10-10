/**
 * Compose cat-peluches.png from two existing on-palette assets
 * (prod-ours + prod-bouquet) — guarantees strict navy/white palette
 * after the image model kept adding yellow/green to daisies.
 */
import sharp from "sharp";
import fs from "fs";

const DIR = "public/uploads/catalog";

async function main() {
  const W = 1024;
  const H = 1024;
  // Left: teddy ~58% width; Right: bouquet ~50% width, slightly higher
  // linear(255/245, 0) stretches near-white (>=245) to pure white so the
  // source images' faint off-white boxes disappear into the canvas.
  const bear = await sharp(`${DIR}/prod-ours.png`)
    .resize(Math.round(W * 0.58))
    .linear(255 / 245, 0)
    .toBuffer();
  const bearMeta = await sharp(bear).metadata();
  const bouquet = await sharp(`${DIR}/prod-bouquet.png`)
    .resize(Math.round(W * 0.5))
    .linear(255 / 245, 0)
    .toBuffer();
  const bqMeta = await sharp(bouquet).metadata();

  await sharp({
    create: { width: W, height: H, channels: 3, background: "#ffffff" },
  })
    .composite([
      {
        input: bouquet,
        left: Math.round(W * 0.46),
        top: Math.max(0, Math.round(H * 0.62) - bqMeta.height),
      },
      {
        input: bear,
        left: Math.round(W * 0.06),
        top: Math.max(0, Math.round(H * 0.97) - bearMeta.height),
      },
    ])
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(`${DIR}/cat-peluches.png`);

  console.log("Composed cat-peluches.png from ours+bouquet assets");
  fs.statSync(`${DIR}/cat-peluches.png`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
