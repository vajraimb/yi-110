/**
 * 邵雍先天六十四卦方图。八卦按先天序 乾兑离震巽坎艮坤 排列，
 * 行是上卦，列是下卦。阳为 0、阴为 1 自上而下读，正是 0–63 的二进制计数：
 * 乾在左上角，坤在右下角。这张表就是元胞读头可能停住的全部 64 个状态。
 */

import { TRIGRAMS } from "../iching.ts";
import { keyOfLines } from "./universe.ts";

/** Trigram keys (bit0 = bottom line) in 先天 order. */
export const XIANTIAN: readonly number[] = [7, 3, 5, 1, 6, 2, 4, 0];

export type FuxiCell = {
  key: number;
  row: number;
  col: number;
  /** 0 = 乾 … 63 = 坤 */
  ordinal: number;
};

export const FUXI_GRID: readonly FuxiCell[] = XIANTIAN.flatMap((upper, row) =>
  XIANTIAN.map((lower, col) => {
    const L = TRIGRAMS[lower].lines;
    const U = TRIGRAMS[upper].lines;
    return {
      key: keyOfLines([L[0], L[1], L[2], U[0], U[1], U[2]]),
      row,
      col,
      ordinal: row * 8 + col,
    };
  }),
);

export function fuxiOrdinal(key: number): number {
  const cell = FUXI_GRID.find((c) => c.key === key);
  return cell ? cell.ordinal : -1;
}
