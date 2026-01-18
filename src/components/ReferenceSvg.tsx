"use client";

import type { ReferenceObject } from "@/lib/references";
import { getReferenceArt } from "@/lib/referenceArt";

const STROKE = "#db2e7b";

function svgFor(kind: ReferenceObject["kind"]) {
  const art = getReferenceArt(kind);
  if (!art) return null;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="${art.viewBox}">
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
      ${art.innerSvg}
    </g>
  </svg>
  `;

  return svg;
}

export function ReferenceSvg({ reference }: { reference: ReferenceObject }) {
  const svg = svgFor(reference.kind);
  if (!svg) return null;
  return (
    <span
      className="block h-full w-auto"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

