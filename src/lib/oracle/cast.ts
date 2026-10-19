/**
 * One cast, whichever way it was made. The route id carries everything
 * needed to replay it:
 *   元胞：64 hex chars of the SHA-256 seed, plus `g` (the stopped generation).
 *   大衍：`y` followed by six digits in 6789, 初爻 first.
 */

import type { Hexagram } from "../iching.ts";
import { lineCauses, type LineCause } from "./causes.ts";
import { hexOfKey, relationsOf, type Relations } from "./relations.ts";
import { readCast, type Reading } from "./reading.ts";
import {
  clampHead,
  keyOfLines,
  readHead,
  readWindow,
  replay,
  seedFromHex,
  type RingHistory,
  type Seed,
} from "./universe.ts";
import { lineChanges, lineYang, type LineValue } from "../yarrow.ts";

export type CastMethod = "ca" | "yarrow";

export type CastBase = {
  id: string;
  method: CastMethod;
  benKey: number;
  zhiKey: number;
  ben: Hexagram;
  zhi: Hexagram;
  benLines: number[];
  zhiLines: number[];
  changing: boolean[];
  reading: Reading;
  relations: Relations;
};

export type CaCast = CastBase & {
  method: "ca";
  seed: Seed;
  gen: number;
  /** Column of the 初爻. The seed's own head unless the asker placed it. */
  head: number;
  placed: boolean;
  history: RingHistory;
  /** 本卦 row around the head: neighbour, six lines, neighbour. */
  window: number[];
  causes: LineCause[];
};

export type YarrowCast = CastBase & {
  method: "yarrow";
  values: LineValue[];
};

export type Cast = CaCast | YarrowCast;

function finish(benLines: number[], zhiLines: number[]) {
  const benKey = keyOfLines(benLines);
  const zhiKey = keyOfLines(zhiLines);
  const ben = hexOfKey(benKey);
  const zhi = hexOfKey(zhiKey);
  const changing = benLines.map((bit, i) => bit !== zhiLines[i]);
  return {
    benKey,
    zhiKey,
    ben,
    zhi,
    benLines,
    zhiLines,
    changing,
    reading: readCast(ben, zhi, changing),
    relations: relationsOf(benKey),
  };
}

export function caCast(seed: Seed, gen: number, head?: number): CaCast {
  const placed = head !== undefined && clampHead(head) !== seed.head;
  const at = head === undefined ? seed.head : clampHead(head);
  const history = replay(seed, gen);
  const benRow = history.rows[gen - history.first];
  const zhiRow = history.rows[gen + 1 - history.first];
  const benLines = readHead(benRow, at);
  const zhiLines = readHead(zhiRow, at);
  const window = readWindow(benRow, at);
  return {
    id: seed.hex,
    method: "ca",
    seed,
    gen,
    head: at,
    placed,
    history,
    window,
    causes: lineCauses(window),
    ...finish(benLines, zhiLines),
  };
}

export function yarrowId(values: readonly LineValue[]): string {
  return `y${values.join("")}`;
}

export function parseYarrowId(id: string): LineValue[] | null {
  if (!/^y[6789]{6}$/.test(id)) return null;
  return id
    .slice(1)
    .split("")
    .map((d) => Number(d) as LineValue);
}

export function yarrowCast(values: readonly LineValue[]): YarrowCast {
  const benLines = values.map((v) => (lineYang(v) ? 1 : 0));
  const zhiLines = values.map((v, i) => (lineChanges(v) ? 1 - benLines[i] : benLines[i]));
  return {
    id: yarrowId(values),
    method: "yarrow",
    values: [...values],
    ...finish(benLines, zhiLines),
  };
}

export type ParsedId =
  { method: "ca"; seed: Seed } | { method: "yarrow"; values: LineValue[] } | null;

export function parseCastId(id: string): ParsedId {
  const values = parseYarrowId(id);
  if (values) return { method: "yarrow", values };
  const seed = seedFromHex(id);
  if (seed) return { method: "ca", seed };
  return null;
}
