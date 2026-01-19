export type BlockDimensionsCm = {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  maxCm: number;
};

export type UnitDimensionsCm = {
  unitValue: bigint;
  unitSideCm: number;
  unitCount: bigint;
};

const MAX_UNIT_INSTANCES = 10_000n;

function isPowerOf1000(value: bigint) {
  if (value < 1n) return false;
  let v = value;
  while (v % 1000n === 0n) v /= 1000n;
  return v === 1n;
}

function power1000(exp: number) {
  let out = 1n;
  for (let i = 0; i < exp; i++) out *= 1000n;
  return out;
}

function log1000FloorFromDigits(value: bigint) {
  const digitsMinus1 = Math.max(0, value.toString().length - 1);
  return Math.floor(digitsMinus1 / 3);
}

export function getExactPower1000Exponent(value: bigint): number | null {
  if (value < 1n) return null;
  if (!isPowerOf1000(value)) return null;
  return log1000FloorFromDigits(value);
}

export function computeGridForCount(count: number) {
  if (count <= 0) return { gridX: 0, gridZ: 0, layers: 0 };

  // Canonical shapes for the kid-friendly story:
  // 100 is a 10×10 plate; 1000 is a 10×10×10 cube.
  if (count === 100) return { gridX: 10, gridZ: 10, layers: 1 };
  if (count === 1000) return { gridX: 10, gridZ: 10, layers: 10 };

  // 10 should feel like “10 pieces” but not become a long thin bar.
  if (count === 10) return { gridX: 5, gridZ: 2, layers: 1 };

  // For small counts, keep a single-layer plate so the comparison stays intuitive.
  // Otherwise, with huge unit cubes (e.g. 1km units), an "optimal" packing like 5×5×4
  // would accidentally turn the block into a multi-kilometer-tall tower.
  if (count < 100) {
    const gridX = Math.min(10, Math.max(1, Math.round(Math.sqrt(count))));
    const gridZ = Math.min(10, Math.max(1, Math.ceil(count / gridX)));
    return { gridX, gridZ, layers: 1 };
  }

  let best: { gridX: number; gridZ: number; layers: number } | null = null;
  let bestScore: [number, number, number, number] | null = null;

  for (let gridX = 1; gridX <= 10; gridX++) {
    for (let gridZ = 1; gridZ <= 10; gridZ++) {
      const perLayer = gridX * gridZ;
      const layers = Math.ceil(count / perLayer);
      const maxDim = Math.max(gridX, gridZ, layers);
      const balance =
        Math.abs(gridX - gridZ) + Math.abs(gridX - layers) + Math.abs(gridZ - layers);
      const waste = perLayer * layers - count;
      const footprint = perLayer;
      const score: [number, number, number, number] = [maxDim, balance, waste, footprint];
      if (!bestScore || score < bestScore) {
        bestScore = score;
        best = { gridX, gridZ, layers };
      }
    }
  }

  return best ?? { gridX: 10, gridZ: 10, layers: Math.ceil(count / 100) };
}

export function chooseUnitForValue(value: bigint): UnitDimensionsCm {
  if (value <= 0n) {
    return { unitValue: 1n, unitSideCm: 1, unitCount: 0n };
  }

  // If value is exactly 1000^k, render it as 1000 cubes of the previous unit first.
  // Example: 1000 => 1000×1, 1,000,000 => 1000×1000, ...
  if (value >= 1000n && isPowerOf1000(value)) {
    const k = log1000FloorFromDigits(value);
    const unitValue = power1000(Math.max(0, k - 1));
    const sideExp = Math.max(0, k - 1);
    return { unitValue, unitSideCm: 10 ** sideExp, unitCount: 1000n };
  }

  const k = log1000FloorFromDigits(value);
  let unitValue = power1000(k);
  let unitCount = value / unitValue;

  while (unitCount > MAX_UNIT_INSTANCES) {
    unitValue *= 1000n;
    unitCount = value / unitValue;
  }

  return { unitValue, unitSideCm: 10 ** k, unitCount };
}

export function estimateBlockDimensionsCm(value: bigint): BlockDimensionsCm {
  const { unitSideCm, unitCount } = chooseUnitForValue(value);
  const count = unitCount === 0n ? 0 : Number(unitCount);

  const { gridX, gridZ, layers } = computeGridForCount(count);

  const widthCm = gridX * unitSideCm;
  const depthCm = gridZ * unitSideCm;
  const heightCm = Math.max(1, layers) * unitSideCm;
  const maxCm = Math.max(widthCm, heightCm, depthCm);

  return { widthCm, heightCm, depthCm, maxCm };
}
