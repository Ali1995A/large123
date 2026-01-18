import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { REFERENCE_ART } from "../src/lib/referenceArt";

const STROKE = "#db2e7b";

function buildSvg(viewBox: string, innerSvg: string) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
    <defs>
      <linearGradient id="p1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff6fa" />
        <stop offset="100%" stop-color="#ffc1de" />
      </linearGradient>
      <linearGradient id="p2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff9cc9" />
        <stop offset="100%" stop-color="#ffc1de" />
      </linearGradient>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.12" />
      </filter>
      <style>
        .stroke-strong { stroke: ${STROKE}; stroke-width: 8; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
        .stroke-mid { stroke: ${STROKE}; stroke-width: 6; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
        .stroke-light { stroke: ${STROKE}; stroke-width: 5; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
      </style>
    </defs>
    <g filter="url(#softShadow)">
      ${innerSvg}
    </g>
  </svg>
  `.trim();
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  const outDir = path.join(process.cwd(), "public", "references");
  ensureDir(outDir);

  const targets = [
    { name: "1x", size: 512 },
    { name: "2x", size: 1024 },
  ];

  for (const art of REFERENCE_ART) {
    const svg = buildSvg(art.viewBox, art.innerSvg);
    for (const target of targets) {
      const resvg = new Resvg(svg, {
        fitTo: { mode: "width", value: target.size },
        font: { loadSystemFonts: false },
      });
      const pngData = resvg.render().asPng();
      const filename =
        target.name === "1x"
          ? `${art.kind}.png`
          : `${art.kind}@2x.png`;
      fs.writeFileSync(path.join(outDir, filename), pngData);
    }
  }

  // Basic index file to help humans replace assets later.
  const list = REFERENCE_ART.map((a) => `- ${a.kind}: ${a.kind}.png / ${a.kind}@2x.png`).join("\n");
  fs.writeFileSync(
    path.join(outDir, "README.md"),
    `# Reference PNGs\n\nGenerated from SVG source-of-truth.\n\n${list}\n`,
  );
}

main();

