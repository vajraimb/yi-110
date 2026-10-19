import { HEX_BY_KEY, type Hexagram } from "../iching.ts";
import { keyOfLines, linesOfKey } from "./universe.ts";

export function hexOfKey(key: number): Hexagram {
  return HEX_BY_KEY[key & 63];
}

/** 互卦：二三四爻为下卦，三四五爻为上卦。 */
export function nuclearKey(key: number): number {
  const l = linesOfKey(key);
  return keyOfLines([l[1], l[2], l[3], l[2], l[3], l[4]]);
}

/** 错卦：六爻阴阳全变。 */
export function oppositeKey(key: number): number {
  return ~key & 63;
}

/** 综卦：上下颠倒。乾坤坎离颐大过中孚小过八卦自综。 */
export function reverseKey(key: number): number {
  const l = linesOfKey(key);
  return keyOfLines([l[5], l[4], l[3], l[2], l[1], l[0]]);
}

export type Relations = {
  nuclear: Hexagram;
  opposite: Hexagram;
  reverse: Hexagram;
  selfReverse: boolean;
};

export function relationsOf(key: number): Relations {
  const rev = reverseKey(key);
  return {
    nuclear: hexOfKey(nuclearKey(key)),
    opposite: hexOfKey(oppositeKey(key)),
    reverse: hexOfKey(rev),
    selfReverse: rev === key,
  };
}
