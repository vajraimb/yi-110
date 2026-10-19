/**
 * 纵读, the trial reading down the 初爻 column: the six generations before
 * the stop are the 本卦 the asker watched, the six after are the 之卦 the
 * ring went on to. Lines are time here, 初 earliest. A secondary reading —
 * it never replaces the window's 占断.
 */

import type { Hexagram } from "../iching.ts";
import type { CaCast } from "./cast.ts";
import { hexOfKey } from "./relations.ts";
import { readCast, type Reading } from "./reading.ts";
import { keyOfLines, stepRing } from "./universe.ts";

export type VerticalCast = {
  column: number;
  benLines: number[];
  zhiLines: number[];
  ben: Hexagram;
  zhi: Hexagram;
  changing: boolean[];
  changes: number;
  reading: Reading;
};

/** Null when fewer than six generations have passed. */
export function verticalCast(cast: CaCast): VerticalCast | null {
  const { rows, first } = cast.history;
  const column = cast.head;
  const benIdx = cast.gen - first;
  if (benIdx < 5) return null;
  const benLines: number[] = [];
  for (let k = 5; k >= 0; k--) benLines.push(rows[benIdx - k][column]);
  const zhiLines: number[] = [];
  let row = rows[benIdx];
  for (let k = 0; k < 6; k++) {
    row = benIdx + 1 + k < rows.length ? rows[benIdx + 1 + k] : stepRing(row);
    zhiLines.push(row[column]);
  }
  const ben = hexOfKey(keyOfLines(benLines));
  const zhi = hexOfKey(keyOfLines(zhiLines));
  const changing = benLines.map((b, i) => b !== zhiLines[i]);
  return {
    column,
    benLines,
    zhiLines,
    ben,
    zhi,
    changing,
    changes: changing.filter(Boolean).length,
    reading: readCast(ben, zhi, changing),
  };
}

/** One line for the annotation prompt. */
export function describeVertical(v: VerticalCast | null): string {
  if (!v) return "";
  const main = v.reading.passages.find((p) => p.primary) ?? v.reading.passages[0];
  const pair = v.changes
    ? `${v.ben.name}之${v.zhi.name}，${v.changes}爻变`
    : `${v.ben.name}，六爻皆静`;
  return `${pair}；${v.reading.rule}主经文 ${main.title}：${main.text}`;
}
