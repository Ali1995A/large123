import type { ReferenceObject } from "@/lib/references";

export type ReferenceArt = {
  kind: ReferenceObject["kind"];
  viewBox: string;
  innerSvg: string;
};

export const REFERENCE_ART: ReferenceArt[] = [
  {
    kind: "dice",
    viewBox: "0 0 200 220",
    innerSvg: `
      <rect x="40" y="40" width="120" height="120" rx="26" fill="url(#p1)" class="stroke-strong" />
      <circle cx="80" cy="80" r="10" fill="#db2e7b" />
      <circle cx="120" cy="120" r="10" fill="#db2e7b" />
      <circle cx="80" cy="120" r="10" fill="#db2e7b" />
      <circle cx="120" cy="80" r="10" fill="#db2e7b" />
    `,
  },
  {
    kind: "lego",
    viewBox: "0 0 220 240",
    innerSvg: `
      <rect x="30" y="90" width="160" height="90" rx="18" fill="url(#p2)" class="stroke-strong" />
      <circle cx="80" cy="80" r="16" fill="#fff6fa" class="stroke-mid" />
      <circle cx="140" cy="80" r="16" fill="#fff6fa" class="stroke-mid" />
    `,
  },
  {
    kind: "apple",
    viewBox: "0 0 220 260",
    innerSvg: `
      <path d="M110 72c-26-22-74-6-74 52 0 58 40 104 74 104s74-46 74-104c0-58-48-74-74-52Z" fill="url(#p1)" class="stroke-strong" />
      <path d="M112 52c10 0 20-10 20-24" fill="none" class="stroke-strong" />
      <path d="M128 64c20-10 44-4 54 10" fill="none" class="stroke-light" opacity="0.55" />
    `,
  },
  {
    kind: "cup",
    viewBox: "0 0 220 320",
    innerSvg: `
      <path d="M70 70h80v150c0 30-20 50-40 50s-40-20-40-50V70Z" fill="url(#p1)" class="stroke-strong" />
      <path d="M150 120c40 0 40 80 0 80" fill="none" class="stroke-strong" />
      <path d="M80 74h60" fill="none" class="stroke-strong" />
    `,
  },
  {
    kind: "cat",
    viewBox: "0 0 240 320",
    innerSvg: `
      <path d="M70 200c0-52 34-84 50-84s50 32 50 84c0 52-34 86-50 86s-50-34-50-86Z" fill="url(#p2)" class="stroke-strong" />
      <circle cx="120" cy="110" r="44" fill="url(#p1)" class="stroke-strong" />
      <path d="M90 82l-10-24 26 14" fill="url(#p1)" class="stroke-strong" />
      <path d="M150 82l10-24-26 14" fill="url(#p1)" class="stroke-strong" />
      <circle cx="104" cy="110" r="6" fill="#db2e7b" />
      <circle cx="136" cy="110" r="6" fill="#db2e7b" />
      <path d="M114 124c6 6 10 6 16 0" fill="none" class="stroke-mid" />
    `,
  },
  {
    kind: "child",
    viewBox: "0 0 240 380",
    innerSvg: `
      <circle cx="120" cy="86" r="50" fill="url(#p1)" class="stroke-strong" />
      <path d="M82 150c0-18 14-32 32-32h12c18 0 32 14 32 32v92c0 30-24 54-50 54s-26-24-26-54v-92Z" fill="url(#p2)" class="stroke-strong" />
      <path d="M98 234v92" fill="none" class="stroke-strong" />
      <path d="M142 234v92" fill="none" class="stroke-strong" />
      <path d="M78 180c-26 10-26 48 0 60" fill="none" class="stroke-strong" opacity="0.55" />
      <path d="M162 180c26 10 26 48 0 60" fill="none" class="stroke-strong" opacity="0.55" />
      <path d="M106 340c10 8 18 8 28 0" fill="none" class="stroke-mid" opacity="0.55" />
    `,
  },
  {
    kind: "door",
    viewBox: "0 0 220 420",
    innerSvg: `
      <rect x="60" y="50" width="100" height="340" rx="18" fill="url(#p1)" class="stroke-strong" />
      <circle cx="138" cy="230" r="8" fill="#db2e7b" />
    `,
  },
  {
    kind: "car",
    viewBox: "0 0 320 200",
    innerSvg: `
      <path d="M60 120c10-40 30-64 80-64h70c40 0 70 20 90 64v30c0 18-14 32-32 32H92c-18 0-32-14-32-32v-30Z" fill="url(#p2)" class="stroke-strong" />
      <circle cx="110" cy="162" r="20" fill="#fff6fa" class="stroke-strong" />
      <circle cx="246" cy="162" r="20" fill="#fff6fa" class="stroke-strong" />
    `,
  },
  {
    kind: "bus",
    viewBox: "0 0 360 240",
    innerSvg: `
      <rect x="40" y="60" width="280" height="140" rx="24" fill="url(#p1)" class="stroke-strong" />
      <rect x="70" y="84" width="200" height="56" rx="14" fill="#fff6fa" class="stroke-mid" />
      <circle cx="110" cy="198" r="18" fill="#fff6fa" class="stroke-strong" />
      <circle cx="250" cy="198" r="18" fill="#fff6fa" class="stroke-strong" />
    `,
  },
  {
    kind: "house",
    viewBox: "0 0 260 320",
    innerSvg: `
      <path d="M42 154 130 72 218 154" fill="url(#p2)" class="stroke-strong" />
      <rect x="62" y="154" width="136" height="126" rx="16" fill="url(#p1)" class="stroke-strong" />
      <rect x="116" y="206" width="28" height="74" rx="10" fill="#fff6fa" class="stroke-mid" />
      <rect x="82" y="188" width="28" height="28" rx="8" fill="#fff6fa" class="stroke-mid" opacity="0.9" />
      <rect x="150" y="188" width="28" height="28" rx="8" fill="#fff6fa" class="stroke-mid" opacity="0.9" />
    `,
  },
  {
    kind: "tree",
    viewBox: "0 0 240 360",
    innerSvg: `
      <rect x="104" y="210" width="32" height="120" rx="14" fill="#ffd1a8" class="stroke-strong" />
      <path d="M60 140c0-48 38-74 72-74 14-32 46-50 88-50 50 0 84 40 84 86 0 42-28 70-62 76 6 38-24 72-62 72-46 0-78-34-70-82-30-14-50-42-50-78Z" transform="translate(-60 0)" fill="url(#p2)" class="stroke-strong" />
    `,
  },
  {
    kind: "building",
    viewBox: "0 0 240 420",
    innerSvg: `
      <rect x="70" y="60" width="100" height="320" rx="16" fill="url(#p1)" class="stroke-strong" />
      <path d="M92 98h20M92 136h20M92 174h20M92 212h20M92 250h20M92 288h20M128 98h20M128 136h20M128 174h20M128 212h20M128 250h20M128 288h20" fill="none" class="stroke-mid" opacity="0.6" />
    `,
  },
  {
    kind: "mountain",
    viewBox: "0 0 320 260",
    innerSvg: `
      <path d="M40 210 150 70 200 130 250 90 300 210Z" fill="url(#p2)" class="stroke-strong" />
      <path d="M140 90 150 70 170 110" fill="#fff6fa" class="stroke-mid" />
    `,
  },
  {
    kind: "earth",
    viewBox: "0 0 260 260",
    innerSvg: `
      <circle cx="130" cy="130" r="92" fill="url(#p1)" class="stroke-strong" />
      <path d="M90 110c10-22 44-30 62-18 10 6 12 20 2 30-16 16-48 12-56 32-6 16 6 28 22 34" fill="none" class="stroke-strong" opacity="0.6" />
    `,
  },
  {
    kind: "moonDistance",
    viewBox: "0 0 220 420",
    innerSvg: `
      <circle cx="110" cy="86" r="34" fill="url(#p1)" class="stroke-strong" />
      <rect x="102" y="120" width="16" height="236" rx="8" fill="url(#p2)" class="stroke-strong" />
      <circle cx="110" cy="364" r="22" fill="#fff6fa" class="stroke-strong" />
    `,
  },
];

export function getReferenceArt(kind: ReferenceObject["kind"]) {
  return REFERENCE_ART.find((a) => a.kind === kind) ?? null;
}
