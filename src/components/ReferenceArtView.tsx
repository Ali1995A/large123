"use client";

import { useMemo, useState } from "react";
import type { ReferenceObject } from "@/lib/references";
import { ReferenceSvg } from "@/components/ReferenceSvg";

export function ReferenceArtView({ reference }: { reference: ReferenceObject }) {
  const [pngFailed, setPngFailed] = useState(false);

  const src = useMemo(() => `/references/${reference.kind}.png`, [reference.kind]);
  const src2x = useMemo(() => `/references/${reference.kind}@2x.png`, [reference.kind]);
  const version = "v=1";

  if (pngFailed) return <ReferenceSvg reference={reference} />;

  return (
    // PNGs are local and tiny; we also need explicit srcset + onError fallback to SVG.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${src}?${version}`}
      srcSet={`${src}?${version} 1x, ${src2x}?${version} 2x`}
      alt=""
      className="h-full w-auto select-none"
      draggable={false}
      decoding="async"
      loading="lazy"
      onError={() => setPngFailed(true)}
    />
  );
}
