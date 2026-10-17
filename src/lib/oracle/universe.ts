/**
 * The oracle universe: a ring of 256 cells seeded with the 256 bits of a
 * SHA-256 digest, run under Rule 110. The read head is a six-cell window;
 * the window at the generation the asker stops on is the 本卦, and the next
 * generation is the 之卦. A line "changes" when the cell flips.
 */

import { stepRow } from "../ca.ts";
import { fromHex, sha256, toHex } from "./sha256.ts";

export const RING = 256;
export const ORACLE_RULE = 110;
/** The search-param cap: enough history to look back on, cheap to recompute. */
export const MAX_GEN = 20000;

export type Seed = {
  hex: string;
  bytes: Uint8Array;
  /** Column of the 初爻 cell. The five cells to its right complete the window. */
  head: number;
};

export function seedFromHex(hex: string): Seed | null {
  if (hex.length !== 64) return null;
  const bytes = fromHex(hex.toLowerCase());
  if (!bytes) return null;
  return { hex: hex.toLowerCase(), bytes, head: bytes[31] };
}

function nonce(): string {
  const buf = new Uint8Array(4);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 4; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  return toHex(buf);
}

/**
 * Question + moment + a pinch of entropy. The moment plays the role of the
 * hour in 梅花易数; the nonce plays the hand that divides the stalks. The
 * digest is the whole cast: anyone with the hex can replay it exactly.
 */
export function seedFromQuestion(question: string, at: Date = new Date()): Seed {
  const message = `${question.trim()}\n${at.toISOString()}\n${nonce()}`;
  const bytes = sha256(message);
  return { hex: toHex(bytes), bytes, head: bytes[31] };
}

/** Cell i is bit i of the digest, most significant bit of each byte first. */
export function initialRing(seed: Seed): Uint8Array {
  const row = new Uint8Array(RING);
  for (let i = 0; i < RING; i++) {
    row[i] = (seed.bytes[i >> 3] >> (7 - (i & 7))) & 1;
  }
  return row;
}

export function stepRing(row: Uint8Array): Uint8Array {
  return stepRow(row, ORACLE_RULE, true);
}

/** Six cells starting at head, wrapping around the ring. Index 0 is the 初爻. */
export function readHead(row: Uint8Array, head: number): number[] {
  const lines: number[] = [];
  for (let i = 0; i < 6; i++) lines.push(row[(head + i) % RING]);
  return lines;
}

export function keyOfLines(lines: readonly number[]): number {
  let key = 0;
  for (let i = 0; i < 6; i++) if (lines[i]) key |= 1 << i;
  return key;
}

export function linesOfKey(key: number): number[] {
  return [0, 1, 2, 3, 4, 5].map((i) => (key >> i) & 1);
}

export type RingHistory = {
  /** rows[0] is generation `first`. */
  rows: Uint8Array[];
  first: number;
};

/**
 * Replay a seed through generation `gen + 1` (the 之卦 row), keeping only the
 * last `keep` rows so the spacetime diagram can be drawn without holding
 * tens of thousands of rows.
 */
export function replay(seed: Seed, gen: number, keep = 320): RingHistory {
  const target = Math.min(Math.max(0, gen), MAX_GEN) + 1;
  let row = initialRing(seed);
  const rows: Uint8Array[] = [row];
  for (let g = 1; g <= target; g++) {
    row = stepRing(row);
    rows.push(row);
    if (rows.length > keep) rows.shift();
  }
  return { rows, first: target + 1 - rows.length };
}

export function clampGen(gen: number): number {
  if (!Number.isFinite(gen)) return 0;
  return Math.min(MAX_GEN, Math.max(0, Math.floor(gen)));
}
