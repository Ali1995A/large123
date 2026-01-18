"use client";

import type { ReferenceObject } from "@/lib/references";

const STROKE = "#db2e7b";
const FILL = "#ffc1de";
const FILL2 = "#ff9cc9";

function SvgShell({
  children,
  viewBox = "0 0 200 320",
}: {
  children: React.ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className="h-full w-auto"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="p1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6fa" />
          <stop offset="100%" stopColor={FILL} />
        </linearGradient>
        <linearGradient id="p2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={FILL2} />
          <stop offset="100%" stopColor={FILL} />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>
      <g filter="url(#softShadow)">{children}</g>
    </svg>
  );
}

function strokeProps(width = 6) {
  return {
    stroke: STROKE,
    strokeWidth: width,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };
}

export function ReferenceSvg({ reference }: { reference: ReferenceObject }) {
  switch (reference.kind) {
    case "dice":
      return (
        <SvgShell viewBox="0 0 200 220">
          <rect x="40" y="40" width="120" height="120" rx="26" fill="url(#p1)" {...strokeProps(8)} />
          <circle cx="80" cy="80" r="10" fill={STROKE} />
          <circle cx="120" cy="120" r="10" fill={STROKE} />
          <circle cx="80" cy="120" r="10" fill={STROKE} />
          <circle cx="120" cy="80" r="10" fill={STROKE} />
        </SvgShell>
      );

    case "lego":
      return (
        <SvgShell viewBox="0 0 220 240">
          <rect x="30" y="90" width="160" height="90" rx="18" fill="url(#p2)" {...strokeProps(8)} />
          <circle cx="80" cy="80" r="16" fill="#fff6fa" {...strokeProps(6)} />
          <circle cx="140" cy="80" r="16" fill="#fff6fa" {...strokeProps(6)} />
        </SvgShell>
      );

    case "apple":
      return (
        <SvgShell viewBox="0 0 220 260">
          <path
            d="M110 72c-26-22-74-6-74 52 0 58 40 104 74 104s74-46 74-104c0-58-48-74-74-52Z"
            fill="url(#p1)"
            {...strokeProps(8)}
          />
          <path d="M112 52c10 0 20-10 20-24" fill="none" {...strokeProps(8)} />
          <path d="M128 64c20-10 44-4 54 10" fill="none" {...strokeProps(6)} opacity="0.5" />
        </SvgShell>
      );

    case "cup":
      return (
        <SvgShell viewBox="0 0 220 320">
          <path
            d="M70 70h80v150c0 30-20 50-40 50s-40-20-40-50V70Z"
            fill="url(#p1)"
            {...strokeProps(8)}
          />
          <path
            d="M150 120c40 0 40 80 0 80"
            fill="none"
            {...strokeProps(10)}
          />
          <path d="M80 74h60" fill="none" {...strokeProps(10)} />
        </SvgShell>
      );

    case "cat":
      return (
        <SvgShell viewBox="0 0 240 320">
          <path
            d="M70 200c0-52 34-84 50-84s50 32 50 84c0 52-34 86-50 86s-50-34-50-86Z"
            fill="url(#p2)"
            {...strokeProps(8)}
          />
          <circle cx="120" cy="110" r="44" fill="url(#p1)" {...strokeProps(8)} />
          <path d="M90 82l-10-24 26 14" fill="url(#p1)" {...strokeProps(8)} />
          <path d="M150 82l10-24-26 14" fill="url(#p1)" {...strokeProps(8)} />
          <circle cx="104" cy="110" r="6" fill={STROKE} />
          <circle cx="136" cy="110" r="6" fill={STROKE} />
          <path d="M114 124c6 6 10 6 16 0" fill="none" {...strokeProps(6)} />
        </SvgShell>
      );

    case "child":
      return (
        <SvgShell viewBox="0 0 240 380">
          <circle cx="120" cy="90" r="52" fill="url(#p1)" {...strokeProps(8)} />
          <path
            d="M70 170c0-18 14-32 32-32h36c18 0 32 14 32 32v116c0 24-20 44-44 44s-56-20-56-44V170Z"
            fill="url(#p2)"
            {...strokeProps(8)}
          />
          <path d="M66 214c-26 12-26 48 0 60" fill="none" {...strokeProps(10)} opacity="0.6" />
          <path d="M174 214c26 12 26 48 0 60" fill="none" {...strokeProps(10)} opacity="0.6" />
        </SvgShell>
      );

    case "door":
      return (
        <SvgShell viewBox="0 0 220 420">
          <rect x="60" y="50" width="100" height="340" rx="18" fill="url(#p1)" {...strokeProps(8)} />
          <circle cx="138" cy="230" r="8" fill={STROKE} />
        </SvgShell>
      );

    case "car":
      return (
        <SvgShell viewBox="0 0 320 200">
          <path
            d="M60 120c10-40 30-64 80-64h70c40 0 70 20 90 64v30c0 18-14 32-32 32H92c-18 0-32-14-32-32v-30Z"
            fill="url(#p2)"
            {...strokeProps(8)}
          />
          <circle cx="110" cy="162" r="20" fill="#fff6fa" {...strokeProps(8)} />
          <circle cx="246" cy="162" r="20" fill="#fff6fa" {...strokeProps(8)} />
        </SvgShell>
      );

    case "bus":
      return (
        <SvgShell viewBox="0 0 360 240">
          <rect x="40" y="60" width="280" height="140" rx="24" fill="url(#p1)" {...strokeProps(8)} />
          <rect x="70" y="84" width="200" height="56" rx="14" fill="#fff6fa" {...strokeProps(6)} />
          <circle cx="110" cy="198" r="18" fill="#fff6fa" {...strokeProps(8)} />
          <circle cx="250" cy="198" r="18" fill="#fff6fa" {...strokeProps(8)} />
        </SvgShell>
      );

    case "house":
      return (
        <SvgShell viewBox="0 0 260 320">
          <path d="M40 150 130 70 220 150" fill="url(#p2)" {...strokeProps(8)} />
          <rect x="60" y="150" width="140" height="130" rx="14" fill="url(#p1)" {...strokeProps(8)} />
          <rect x="118" y="205" width="28" height="75" rx="10" fill="#fff6fa" {...strokeProps(6)} />
        </SvgShell>
      );

    case "tree":
      return (
        <SvgShell viewBox="0 0 240 360">
          <rect x="104" y="210" width="32" height="120" rx="14" fill="#ffd1a8" {...strokeProps(8)} />
          <path
            d="M120 52c-50 0-84 40-84 86 0 42 28 70 62 76-6 38 24 72 62 72 46 0 78-34 70-82 30-14 50-42 50-78 0-48-38-74-72-74-14-32-46-50-88-50Z"
            transform="translate(-60 0)"
            fill="url(#p2)"
            {...strokeProps(8)}
          />
        </SvgShell>
      );

    case "building":
      return (
        <SvgShell viewBox="0 0 240 420">
          <rect x="70" y="60" width="100" height="320" rx="16" fill="url(#p1)" {...strokeProps(8)} />
          <path
            d="M92 98h20M92 136h20M92 174h20M92 212h20M92 250h20M92 288h20M128 98h20M128 136h20M128 174h20M128 212h20M128 250h20M128 288h20"
            fill="none"
            {...strokeProps(6)}
            opacity="0.6"
          />
        </SvgShell>
      );

    case "mountain":
      return (
        <SvgShell viewBox="0 0 320 260">
          <path
            d="M40 210 150 70 200 130 250 90 300 210Z"
            fill="url(#p2)"
            {...strokeProps(8)}
          />
          <path d="M140 90 150 70 170 110" fill="#fff6fa" {...strokeProps(6)} />
        </SvgShell>
      );

    case "earth":
      return (
        <SvgShell viewBox="0 0 260 260">
          <circle cx="130" cy="130" r="92" fill="url(#p1)" {...strokeProps(8)} />
          <path
            d="M90 110c10-22 44-30 62-18 10 6 12 20 2 30-16 16-48 12-56 32-6 16 6 28 22 34"
            fill="none"
            {...strokeProps(8)}
            opacity="0.6"
          />
        </SvgShell>
      );

    case "moonDistance":
      return (
        <SvgShell viewBox="0 0 220 420">
          <circle cx="110" cy="86" r="34" fill="url(#p1)" {...strokeProps(8)} />
          <rect x="102" y="120" width="16" height="236" rx="8" fill="url(#p2)" {...strokeProps(8)} />
          <circle cx="110" cy="364" r="22" fill="#fff6fa" {...strokeProps(8)} />
        </SvgShell>
      );

    default:
      return (
        <SvgShell>
          <rect x="50" y="60" width="100" height="200" rx="18" fill="url(#p1)" {...strokeProps(8)} />
        </SvgShell>
      );
  }
}

