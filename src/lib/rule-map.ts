/**
 * 补全「阳数」.
 * 阳爻不少于四，用单侧相加规则；否则用不动点规则。
 * 族内序号是 (先天键 * 17 + 3) mod 族大小，两条族里都能选到每一条。
 * 阳爻少于四时用 196 或 236。这两条在六格环上先走再停，不是恒等的 204。
 * 204 以及 15、51、85、170、240 都不在族里。
 */

export const SETTLE_RULES: readonly number[] = [196, 236];

/** Center XOR one neighbor, or that sum complemented. Not a pure shift or flip. */
export const OPEN_RULES: readonly number[] = [60, 102, 153, 195];

export type Temperament = "settle" | "open";
export type BackgroundId = "cycle" | "zero";

/** One phase of the period-14 ether of Rule 110. It returns to itself after 7 steps. */
export const RULE_110_CYCLE: readonly number[] = [0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1];

export function yangCount(key: number): number {
  let count = 0;
  for (let i = 0; i < 6; i++) count += (key >> i) & 1;
  return count;
}

export function temperamentOf(zhiKey: number): Temperament {
  return yangCount(zhiKey) >= 4 ? "open" : "settle";
}

export function ruleForZhi(zhiKey: number): number {
  const family = temperamentOf(zhiKey) === "open" ? OPEN_RULES : SETTLE_RULES;
  const index = (Math.imul(zhiKey, 17) + 3) % family.length;
  return family[index] ?? family[0];
}

export function temperamentLabel(temperament: Temperament): string {
  return temperament === "open" ? "单侧相加规则" : "不动点规则";
}

export function paintBackground(width: number, background: BackgroundId): Uint8Array {
  const row = new Uint8Array(width);
  if (background === "cycle") {
    const origin = (width - 6) >> 1;
    const length = RULE_110_CYCLE.length;
    for (let i = 0; i < width; i++) {
      const phase = (i - origin) % length;
      row[i] = RULE_110_CYCLE[(phase + length) % length] ?? 0;
    }
  }
  return row;
}

export function plantWindow(row: Uint8Array, zhiKey: number): Uint8Array {
  const next = row.slice();
  const origin = (row.length - 6) >> 1;
  for (let i = 0; i < 6; i++) next[origin + i] = (zhiKey >> i) & 1;
  return next;
}

export function paintTape(width: number, zhiKey: number, background: BackgroundId): Uint8Array {
  return plantWindow(paintBackground(width, background), zhiKey);
}

export function stepTape(row: Uint8Array, rule: number, periodic = false): Uint8Array {
  const width = row.length;
  const next = new Uint8Array(width);
  for (let i = 0; i < width; i++) {
    const left = periodic ? row[(i + width - 1) % width] : i > 0 ? row[i - 1] : 0;
    const right = periodic ? row[(i + 1) % width] : i + 1 < width ? row[i + 1] : 0;
    const nb = (left << 2) | (row[i] << 1) | right;
    next[i] = (rule >> nb) & 1;
  }
  return next;
}

/** Steps before a periodic disturbance can travel around and re-enter the window. */
export function safeSteps(width: number): number {
  return width - 6;
}

export function readWindow(row: Uint8Array): number {
  const origin = (row.length - 6) >> 1;
  let key = 0;
  for (let i = 0; i < 6; i++) if (row[origin + i]) key |= 1 << i;
  return key;
}

export function windowOrigin(width: number): number {
  return (width - 6) >> 1;
}

export type RuleProof = {
  diffStop: number;
  diffIfPlanted: number;
  diffAlong: number;
  maxShare: number;
  moved: number;
};

/** 4096 casts, width 126, cycle phase aligned to the window. scripts/accept.mjs. */
export const RING_TABLE_SHA256 = "b60de6fe6a63bece1ebd582f5b0dc2ae2b6209f05d100dbe605b9c408e5096a7";

/** Families, the index formula, and the cycle phase. Not the 256-rule table. */
export const FAMILY_SHA256 = "8b40717e50c14ce40d61cc34a19c4c8ac9ddbf8705ef20fffa256f17c9ccac19";

export const ACCEPTANCE = {
  status: "JS 版已跑验收，OCaml 版的一致性待验证",
  inputs: 4096,
  width: 126,
  safeSteps: 120,
  cycle: { settleEntropy: 4.416, openEntropy: 5.582 },
  zero: { settleEntropy: 4.821, openEntropy: 5.637 },
  proof: {
    60: { diffStop: 1, diffIfPlanted: 1, diffAlong: 1, maxShare: 0.1563, moved: 1 },
    102: { diffStop: 1, diffIfPlanted: 1, diffAlong: 1, maxShare: 0.0656, moved: 1 },
    153: { diffStop: 1, diffIfPlanted: 1, diffAlong: 1, maxShare: 0.0469, moved: 1 },
    195: { diffStop: 1, diffIfPlanted: 1, diffAlong: 1, maxShare: 0.3125, moved: 1 },
    196: { diffStop: 1, diffIfPlanted: 1, diffAlong: 1, maxShare: 0.1875, moved: 0.6875 },
    236: { diffStop: 0.9615, diffIfPlanted: 1, diffAlong: 0.9597, maxShare: 0.1538, moved: 0.6923 },
  } as Record<number, RuleProof>,
} as const;
