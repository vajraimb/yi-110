/**
 * Rule 110's background ("ether") has spatial period 14 and temporal period
 * 7, drifting four cells per generation. Measuring how much of the ring has
 * settled into it tells the asker which phase the universe is in when they
 * stop: raw question, forming structures, or periodic background.
 */

import { RING } from "./universe.ts";

export const ETHER: readonly number[] = [0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1];
const PERIOD = ETHER.length;

const ROTATIONS: ReadonlySet<number> = new Set(
  Array.from({ length: PERIOD }, (_, s) => {
    let v = 0;
    for (let i = 0; i < PERIOD; i++) v = (v << 1) | ETHER[(i + s) % PERIOD];
    return v;
  }),
);

/** 1 where the cell lies inside some 14-cell window that is a phase of the ether. */
export function etherMask(row: Uint8Array): Uint8Array {
  const n = row.length;
  const mask = new Uint8Array(n);
  let v = 0;
  for (let i = 0; i < PERIOD - 1; i++) v = (v << 1) | row[i % n];
  for (let start = 0; start < n; start++) {
    v = ((v << 1) | row[(start + PERIOD - 1) % n]) & 0x3fff;
    if (ROTATIONS.has(v)) for (let k = 0; k < PERIOD; k++) mask[(start + k) % n] = 1;
  }
  return mask;
}

export type Phase = "raw" | "forming" | "ether";

export type EtherStats = {
  /** Share of the ring that is background. */
  share: number;
  /** Number of maximal non-background runs: travellers, collisions, debris. */
  structures: number;
  /** True when all six head cells sit in the background. */
  headOnEther: boolean;
  phase: Phase;
};

export function phaseOf(share: number): Phase {
  if (share < 0.3) return "raw";
  if (share < 0.85) return "forming";
  return "ether";
}

export function etherStats(row: Uint8Array, head: number): EtherStats {
  const mask = etherMask(row);
  const n = row.length;
  let on = 0;
  let structures = 0;
  for (let i = 0; i < n; i++) {
    on += mask[i];
    if (!mask[i] && mask[(i + n - 1) % n]) structures += 1;
  }
  if (on === 0) structures = 1;
  let headOnEther = true;
  for (let k = 0; k < 6; k++) if (!mask[(head + k) % RING]) headOnEther = false;
  const share = on / n;
  return { share, structures, headOnEther, phase: phaseOf(share) };
}

export const PHASE_LABEL: Record<Phase, { name: string; hint: string }> = {
  raw: {
    name: "混沌未分",
    hint: "环上大半还是问题本身的比特。此刻停住，读到的是问题，不是法则对它的回答。",
  },
  forming: {
    name: "成象",
    hint: "背景正在铺开，结构在成形、相遇、相撞。读头落在结构上，就是象；落在背景里，就是势。",
  },
  ether: {
    name: "以太",
    hint: "环几乎都是周期背景，只剩少数旅行者。背景里的卦每七代循环一次，再等也多半是重复。",
  },
};
