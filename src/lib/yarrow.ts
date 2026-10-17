import { hexFromLines, type Hexagram } from "./iching.ts";

/** Classical 大衍 weights: 老阴 1/16, 少阳 5/16, 少阴 7/16, 老阳 3/16. */
export type LineValue = 6 | 7 | 8 | 9;

export type YiState = {
  lines: readonly LineValue[];
  benKey: number;
  zhiKey: number;
  ben: Hexagram;
  zhi: Hexagram;
  changing: readonly boolean[];
  /** Sum of the six line values. Equal to the stalk-count 策 divided by four. */
  clock: number;
};

const WEIGHTS: readonly LineValue[] = [
  6,
  7, 7, 7, 7, 7,
  8, 8, 8, 8, 8, 8, 8,
  9, 9, 9,
];

export function drawLine(rng: () => number = Math.random): LineValue {
  return WEIGHTS[Math.floor(rng() * WEIGHTS.length)] ?? 8;
}

export function lineYang(value: LineValue): boolean {
  return value === 7 || value === 9;
}

export function lineChanges(value: LineValue): boolean {
  return value === 6 || value === 9;
}

export function lineLabel(value: LineValue): string {
  if (value === 6) return "老阴";
  if (value === 7) return "少阳";
  if (value === 8) return "少阴";
  return "老阳";
}

function keyOf(bits: readonly boolean[]): number {
  let key = 0;
  for (let i = 0; i < 6; i++) if (bits[i]) key |= 1 << i;
  return key;
}

export function castYi(rng: () => number = Math.random): YiState {
  const lines = [0, 1, 2, 3, 4, 5].map(() => drawLine(rng)) as LineValue[];
  const benBits = lines.map(lineYang);
  const changing = lines.map(lineChanges);
  const zhiBits = benBits.map((yang, i) => (changing[i] ? !yang : yang));
  const benKey = keyOf(benBits);
  const zhiKey = keyOf(zhiBits);
  return {
    lines,
    benKey,
    zhiKey,
    ben: hexFromLines(benBits.map((bit) => (bit ? 1 : 0))),
    zhi: hexFromLines(zhiBits.map((bit) => (bit ? 1 : 0))),
    changing,
    clock: lines.reduce((sum, value) => sum + value, 0),
  };
}
