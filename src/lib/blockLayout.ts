export type BlockDimensionsCm = {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  maxCm: number;
};

export type UnitDimensionsCm = {
  unitValue: bigint;
  unitWidthCm: number;
  unitHeightCm: number;
  unitDepthCm: number;
};

const MAX_UNIT_INSTANCES = 10_000n;

function pow10(exp: number): bigint {
  let out = 1n;
  for (let i = 0; i < exp; i++) out *= 10n;
  return out;
}

export function chooseUnitForValue(value: bigint): UnitDimensionsCm {
  if (value <= 0n) {
    return { unitValue: 1n, unitWidthCm: 1, unitHeightCm: 1, unitDepthCm: 1 };
  }

  // Prefer "cubic" units: 1, 1000, 1,000,000, ... so that:
  // 10,000 = 10 × (1000-cube), 100,000 = 100 × (1000-cube), etc.
  const digitsMinus1 = Math.max(0, value.toString().length - 1);
  let unitExp = value < 10_000n ? 0 : Math.floor(digitsMinus1 / 3) * 3;
  let unitValue = pow10(unitExp);

  while (value / unitValue > MAX_UNIT_INSTANCES) {
    unitExp += 3;
    unitValue *= 1000n;
  }

  const sideExp = Math.floor(unitExp / 3);
  const sideCm = 10 ** sideExp;
  return { unitValue, unitWidthCm: sideCm, unitHeightCm: sideCm, unitDepthCm: sideCm };
}

export function estimateBlockDimensionsCm(value: bigint): BlockDimensionsCm {
  const { unitValue, unitWidthCm, unitHeightCm, unitDepthCm } = chooseUnitForValue(value);
  const unitCount = value / unitValue;

  const baseX = 10;
  const baseZ = 10;
  const perLayer = BigInt(baseX * baseZ);
  const layers = unitCount === 0n ? 0 : Number((unitCount + perLayer - 1n) / perLayer);

  const widthCm = baseX * unitWidthCm;
  const depthCm = baseZ * unitDepthCm;
  const heightCm = Math.max(1, layers) * unitHeightCm;
  const maxCm = Math.max(widthCm, heightCm, depthCm);

  return { widthCm, heightCm, depthCm, maxCm };
}
