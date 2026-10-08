/**
 * Live pricing proof: fetch fees DIRECTLY from the World Express API
 * (force=true bypasses the 6h cache) and print a sample, then compare
 * with what the store serves on /api/delivery/wilayas.
 */
import { getFees } from "../src/lib/carrier";
import { db } from "../src/lib/db";

const SAMPLE = [
  { id: 16, name: "Alger" },
  { id: 6, name: "Béjaïa" },
  { id: 31, name: "Oran" },
  { id: 50, name: "Tindouf (non desservie)" },
];

async function main() {
  console.log("— Forcing a LIVE call to world-express.ecotrack.dz (cache cleared) —");
  await db.carrierCache.deleteMany({}).catch(() => {});
  const fees = await getFees(true);
  console.log(`Carrier returned ${fees.length} wilaya tariffs (live, DZD):\n`);
  for (const s of SAMPLE) {
    const f = fees.find((x) => x.wilaya_id === s.id);
    if (!f) console.log(`${s.name}: NOT SERVED by the carrier`);
    else console.log(`${s.name}: home ${f.tarif} DA · stop desk ${f.tarif_stopdesk} DA`);
  }
  console.log("\n— What the storefront API serves after this refresh —");
  const res = await fetch("http://localhost:3000/api/delivery/wilayas");
  const data = (await res.json()) as { wilayas?: { id: number; homeFee: number; stopDeskFee: number }[] };
  const alg = data.wilayas?.find((w) => w.id === 16);
  console.log(`/api/delivery/wilayas → Alger: ${alg ? `${alg.homeFee} DA home / ${alg.stopDeskFee} DA desk` : "missing"}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
