/**
 * Why each line changes. A cell's next state is decided by its three-cell
 * neighbourhood, and three cells are a trigram, so Rule 110 is a map from the
 * eight trigrams to yin or yang. Read over the six-cell window, that map says
 * exactly which part of the 本卦 decides each line of the 之卦:
 *
 *   二 ← 初二三 = 下卦      三 ← 二三四 = 互卦下体
 *   四 ← 三四五 = 互卦上体  五 ← 四五六 = 上卦
 *   初 and 上 each need one cell outside the window.
 */

import { TRIGRAMS, type Trigram } from "../iching.ts";
import { ORACLE_RULE } from "./universe.ts";

export type CauseSource = "外左" | "下卦" | "互下" | "互上" | "上卦" | "外右";

export const SOURCES: readonly CauseSource[] = ["外左", "下卦", "互下", "互上", "上卦", "外右"];

export type LineCause = {
  /** 0 = 初爻. */
  index: number;
  /** The three cells centred on this line, as a trigram (lower line = left cell). */
  trigram: Trigram;
  source: CauseSource;
  /** True for 初 and 上, whose trigram reaches outside the window. */
  outside: boolean;
  was: 0 | 1;
  produces: 0 | 1;
  changes: boolean;
};

export function trigramKeyOf(a: number, b: number, c: number): number {
  return (a & 1) | ((b & 1) << 1) | ((c & 1) << 2);
}

/** What the rule writes under the centre of this trigram. */
export function outputOf(trigramKey: number, rule = ORACLE_RULE): 0 | 1 {
  const [a, b, c] = TRIGRAMS[trigramKey].lines;
  const nb = (a << 2) | (b << 1) | c;
  return ((rule >> nb) & 1) as 0 | 1;
}

/** The rule as a table over the eight trigrams, in 先天 order 乾兑离震巽坎艮坤. */
export function ruleTable(rule = ORACLE_RULE): { trigram: Trigram; out: 0 | 1 }[] {
  return [7, 3, 5, 1, 6, 2, 4, 0].map((key) => ({
    trigram: TRIGRAMS[key],
    out: outputOf(key, rule),
  }));
}

/**
 * `window8` is the 本卦 row around the head: one neighbour, the six lines,
 * one neighbour. Returns one cause per line, 初 first.
 */
export function lineCauses(window8: readonly number[], rule = ORACLE_RULE): LineCause[] {
  if (window8.length !== 8) throw new Error("lineCauses wants 8 cells");
  const causes: LineCause[] = [];
  for (let i = 0; i < 6; i++) {
    const key = trigramKeyOf(window8[i], window8[i + 1], window8[i + 2]);
    const was = (window8[i + 1] & 1) as 0 | 1;
    const produces = outputOf(key, rule);
    causes.push({
      index: i,
      trigram: TRIGRAMS[key],
      source: SOURCES[i],
      outside: i === 0 || i === 5,
      was,
      produces,
      changes: was !== produces,
    });
  }
  return causes;
}

/** One line of prose per cause, for the annotation prompt and tests. */
export function describeCauses(causes: readonly LineCause[]): string {
  const names = ["初", "二", "三", "四", "五", "上"];
  return causes
    .map((c) => {
      const body = `${c.source}${c.outside ? "（含窗外一格）" : ""}为${c.trigram.name}，${c.trigram.name}生${c.produces ? "阳" : "阴"}，本${c.was ? "阳" : "阴"}，故${c.changes ? "变" : "静"}`;
      return `${names[c.index]}爻：${body}`;
    })
    .join("；");
}
