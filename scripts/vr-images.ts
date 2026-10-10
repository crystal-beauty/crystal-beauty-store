/**
 * TEMP SVG placeholders for visual review ONLY — deleted by vr-cleanup.
 * Neutral navy/white art so we test layout, not assets.
 */
const ball = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#f4f5f7"/><circle cx="400" cy="380" r="190" fill="#0a1f44" opacity="0.92"/><circle cx="340" cy="320" r="52" fill="#ffffff" opacity="0.18"/><rect x="310" y="565" width="180" height="46" rx="10" fill="#0a1f44" opacity="0.85"/><rect x="330" y="611" width="140" height="18" rx="6" fill="#0a1f44" opacity="0.6"/><text x="400" y="740" font-family="Arial" font-size="26" fill="#0a1f44" text-anchor="middle" opacity="0.45">TEST IMAGE</text></svg>`;
const rose = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#eef0f3"/><path d="M400 620 L400 380" stroke="#0a1f44" stroke-width="14" stroke-linecap="round" opacity="0.85"/><circle cx="400" cy="310" r="90" fill="#0a1f44" opacity="0.9"/><circle cx="372" cy="284" r="26" fill="#ffffff" opacity="0.2"/><path d="M400 500 q-60 -18 -78 -70" stroke="#0a1f44" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.7"/><path d="M400 540 q62 -20 80 -74" stroke="#0a1f44" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.7"/><rect x="300" y="620" width="200" height="60" rx="12" fill="#0a1f44" opacity="0.8"/><text x="400" y="740" font-family="Arial" font-size="26" fill="#0a1f44" text-anchor="middle" opacity="0.45">TEST IMAGE</text></svg>`;
const cat = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#0a1f44"/><circle cx="400" cy="420" r="150" fill="#ffffff" opacity="0.12"/><text x="400" y="450" font-family="Arial" font-size="44" fill="#ffffff" text-anchor="middle" opacity="0.85">CATÉGORIE</text><text x="400" y="510" font-family="Arial" font-size="26" fill="#ffffff" text-anchor="middle" opacity="0.5">TEST VISUEL</text></svg>`;

import { writeFileSync, mkdirSync } from "fs";
mkdirSync("public/uploads", { recursive: true });
writeFileSync("public/uploads/vr-test-crystal-ball.svg", ball);
writeFileSync("public/uploads/vr-test-rose.svg", rose);
writeFileSync("public/uploads/vr-test-cat.svg", cat);
console.log("VR images OK");
