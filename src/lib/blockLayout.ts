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

function pow10Number(exp: number): number {
  return 10 ** exp;
}

function unitDimsFromUnitExponent(unitExp: number) {
  if (unitExp <= 0) return { xExp: 0, yExp: 0, zExp: 0 };
  if (unitExp === 2) return { xExp: 1, yExp: 0, zExp: 1 }; // 100 = 10×10×1
  if (unitExp === 4) return { xExp: 2, yExp: 0, zExp: 2 }; // 10,000 = 100×100×1
  if (unitExp === 6) return { xExp: 2, yExp: 2, zExp: 2 }; // 1,000,000 = 100×100×100

  const base = Math.floor(unitExp / 3);
  const remainder = unitExp % 3;
  const exps = [base, base, base] as number[];
  for (let i = 0; i < remainder; i++) exps[i] += 1;
  exps.sort((a, b) => b - a);
  return { xExp: exps[0]!, yExp: exps[2]!, zExp: exps[1]! };
}

export function chooseUnitForValue(value: bigint): UnitDimensionsCm {
  if (value < 10_000n) {
    return { unitValue: 1n, unitWidthCm: 1, unitHeightCm: 1, unitDepthCm: 1 };
  }

  const k = Math.max(0, value.toString().length - 1);
  let unitExp = 2 * (Math.floor((k - 4) / 3) + 1);
  if (unitExp < 2) unitExp = 2;

  let unitValue = pow10(unitExp);
  while (value / unitValue > MAX_UNIT_INSTANCES) {
    unitValue *= 100n;
    unitExp += 2;
  }

  const { xExp, yExp, zExp } = unitDimsFromUnitExponent(unitExp);
  return {
    unitValue,
    unitWidthCm: pow10Number(xExp),
    unitHeightCm: pow10Number(yExp),
    unitDepthCm: pow10Number(zExp),
  };
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

