/**
 * 朱熹《易学启蒙》变占之法。给定本卦、之卦和变爻，决定读哪几段经文。
 */

import type { Hexagram } from "../iching.ts";
import { lineTitle, textOf } from "./texts.ts";

export type Passage = {
  /** 出自本卦还是之卦。 */
  from: "ben" | "zhi";
  /** 卦辞 / 大象 / 爻辞 / 用九用六 */
  kind: "judgment" | "image" | "line" | "extra";
  title: string;
  text: string;
  /** 爻辞的爻位，0 = 初爻。 */
  line?: number;
  /** 多段并读时的主次。 */
  primary: boolean;
};

export type Reading = {
  changes: number;
  rule: string;
  passages: Passage[];
};

function judgment(hex: Hexagram, from: "ben" | "zhi", primary: boolean): Passage[] {
  const t = textOf(hex.king);
  return [
    { from, kind: "judgment", title: `${hex.name}卦 · 卦辞`, text: t.judgment, primary },
    { from, kind: "image", title: `${hex.name}卦 · 象曰`, text: t.image, primary: false },
  ];
}

function line(hex: Hexagram, from: "ben" | "zhi", index: number, primary: boolean): Passage {
  const t = textOf(hex.king);
  return {
    from,
    kind: "line",
    title: `${hex.name} · ${lineTitle(index, hex.lines[index] === 1)}`,
    text: t.lines[index],
    line: index,
    primary,
  };
}

export function readCast(ben: Hexagram, zhi: Hexagram, changing: readonly boolean[]): Reading {
  const moving = changing.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
  const still = changing.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  const n = moving.length;

  if (n === 0) {
    return {
      changes: 0,
      rule: "六爻皆静，以本卦卦辞占。",
      passages: judgment(ben, "ben", true),
    };
  }
  if (n === 1) {
    return {
      changes: 1,
      rule: "一爻变，以本卦变爻爻辞占。",
      passages: [line(ben, "ben", moving[0], true), ...judgment(ben, "ben", false)],
    };
  }
  if (n === 2) {
    return {
      changes: 2,
      rule: "二爻变，以本卦二变爻爻辞占，上爻为主。",
      passages: [
        line(ben, "ben", moving[1], true),
        line(ben, "ben", moving[0], false),
        ...judgment(ben, "ben", false),
      ],
    };
  }
  if (n === 3) {
    return {
      changes: 3,
      rule: "三爻变，占本卦及之卦卦辞，本卦为贞，之卦为悔。",
      passages: [...judgment(ben, "ben", true), ...judgment(zhi, "zhi", false)],
    };
  }
  if (n === 4) {
    return {
      changes: 4,
      rule: "四爻变，以之卦二不变爻爻辞占，下爻为主。",
      passages: [
        line(zhi, "zhi", still[0], true),
        line(zhi, "zhi", still[1], false),
        ...judgment(zhi, "zhi", false),
      ],
    };
  }
  if (n === 5) {
    return {
      changes: 5,
      rule: "五爻变，以之卦不变爻爻辞占。",
      passages: [line(zhi, "zhi", still[0], true), ...judgment(zhi, "zhi", false)],
    };
  }
  const t = textOf(ben.king);
  if (t.extra) {
    return {
      changes: 6,
      rule: ben.king === 1 ? "乾之坤，六爻皆变，以用九占。" : "坤之乾，六爻皆变，以用六占。",
      passages: [
        {
          from: "ben",
          kind: "extra",
          title: `${ben.name}卦 · ${t.extra.slice(0, 2)}`,
          text: t.extra.slice(3),
          primary: true,
        },
        ...judgment(zhi, "zhi", false),
      ],
    };
  }
  return {
    changes: 6,
    rule: "六爻皆变，以之卦卦辞占。",
    passages: [...judgment(zhi, "zhi", true), ...judgment(ben, "ben", false)],
  };
}
