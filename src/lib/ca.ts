/** Elementary cellular automata, tuned for the Rule 110 × I Ching reading. */

export const COLS = 400;
/** Seed sits right of center: Rule 110's complex front walks left. */
export const ORIGIN = 292;
export const MAX_ROWS = 280;

export type SeedId = "one" | "meet" | "lu" | "dust" | "hand";

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** One generation. Open boundaries read 0 outside; periodic ones wrap the row into a ring. */
export function stepRow(row: Uint8Array, rule: number, periodic = false): Uint8Array {
  const n = row.length;
  const next = new Uint8Array(n);
  const r = rule & 255;
  for (let i = 0; i < n; i++) {
    const left = i > 0 ? row[i - 1] : periodic ? row[n - 1] : 0;
    const center = row[i];
    const right = i + 1 < n ? row[i + 1] : periodic ? row[0] : 0;
    const nb = (left << 2) | (center << 1) | right;
    next[i] = (r >> nb) & 1;
  }
  return next;
}

export function leftmost(row: Uint8Array): number | null {
  for (let i = 0; i < row.length; i++) if (row[i]) return i;
  return null;
}

export function makeSeed(id: SeedId, hand: readonly number[]): Uint8Array {
  const row = new Uint8Array(COLS);
  if (id === "one") {
    row[ORIGIN] = 1;
  } else if (id === "meet") {
    row[ORIGIN] = 1;
    row[ORIGIN - 36] = 1;
  } else if (id === "lu") {
    const bits = [1, 1, 0, 1, 1, 1];
    for (let i = 0; i < bits.length; i++) row[ORIGIN + i] = bits[i];
  } else if (id === "dust") {
    let s = 110;
    for (let i = 16; i < COLS - 16; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      if (s % 100 < 11) row[i] = 1;
    }
  } else {
    for (let i = 0; i < hand.length && ORIGIN + i < COLS; i++) {
      row[ORIGIN + i] = hand[i] ? 1 : 0;
    }
  }
  return row;
}

/** Wolfram byte, neighborhood 111 down to 000. */
export function byteBits(rule: number): number[] {
  const bits: number[] = [];
  for (let n = 7; n >= 0; n--) bits.push((rule >> n) & 1);
  return bits;
}

/**
 * Drop the two end bits of the written byte (outputs of 111 and 000)
 * and read the middle six bottom-to-top, left-to-right.
 */
export function middleHexLines(rule: number): number[] {
  return byteBits(rule).slice(1, 7);
}

export function reflectRule(rule: number): number {
  let out = 0;
  for (let n = 0; n < 8; n++) {
    const left = (n >> 2) & 1;
    const center = (n >> 1) & 1;
    const right = n & 1;
    const m = (right << 2) | (center << 1) | left;
    if ((rule >> n) & 1) out |= 1 << m;
  }
  return out;
}

export function isSymmetric(rule: number): boolean {
  return reflectRule(rule & 255) === (rule & 255);
}

export function birthCount(rule: number): number {
  let c = 0;
  let r = rule & 255;
  while (r) {
    c += r & 1;
    r >>= 1;
  }
  return c;
}

/**
 * Trigram key: bit0 = bottom line = left neighbor,
 * bit1 = middle = center cell, bit2 = top = right neighbor.
 */
export function trigramOutput(rule: number, triKey: number): 0 | 1 {
  const left = triKey & 1;
  const center = (triKey >> 1) & 1;
  const right = (triKey >> 2) & 1;
  const n = (left << 2) | (center << 1) | right;
  return ((rule >> n) & 1) as 0 | 1;
}

export const RULE_VERDICTS: Record<number, string> = {
  0: "八种邻域全部归阴。没有第二代，世界停在初爻里。",
  30: "混沌。局部几乎像抛硬币，长寿的旅行者很少，记忆难有可骑的结构。",
  90: "左右对称的分形。无限自相似，好看，但几乎没有可以称为个体的象。",
  110: "有序与混沌的边缘。有背景，有旅行者，有碰撞，并且能做通用计算。",
  184: "守恒的队列。粒子礼貌地挪动，秩序清楚，但担不起任意计算。",
  204: "每一爻复制自己。不易到了取消变易，历史被掐灭。",
};

export function verdictFor(rule: number): string {
  return (
    RULE_VERDICTS[rule] ??
    `八个邻域里有 ${birthCount(rule)} 个会生出阳。${
      isSymmetric(rule)
        ? "左右对称，时间之箭不来自这条规则。"
        : "左右不对称，时间有一个偏好的方向。"
    }`
  );
}

/** Shift every row right, discarding the right edge, so a left-moving front can run forever. */
export function shiftRowsRight(rows: Uint8Array[], amount: number): boolean {
  if (amount <= 0 || rows.length === 0) return false;
  const width = rows[0].length;
  if (amount >= width) return false;
  for (const row of rows) {
    row.copyWithin(amount, 0, width - amount);
    row.fill(0, 0, amount);
  }
  return true;
}
