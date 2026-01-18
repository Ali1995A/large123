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

  const gridX = count <= 0 ? 0 : Math.min(10, count);
  const gridZ = count <= 10 ? 1 : Math.min(10, Math.ceil(count / 10));
  const perLayer = Math.max(1, gridX * gridZ);
  const layers = count <= 0 ? 0 : Math.ceil(count / perLayer);

  const widthCm = gridX * unitSideCm;
  const depthCm = gridZ * unitSideCm;
  const heightCm = Math.max(1, layers) * unitSideCm;
  const maxCm = Math.max(widthCm, heightCm, depthCm);

  return { widthCm, heightCm, depthCm, maxCm };
}
