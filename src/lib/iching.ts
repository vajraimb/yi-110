/**
 * King Wen hexagrams addressed by a 6-bit window.
 * Bit 0 / line index 0 is the bottom line (初爻).
 * In the spacetime diagram, left = bottom.
 */

export type Trigram = {
  key: number;
  name: string;
  pinyin: string;
  nature: string;
  virtue: string;
  lines: readonly [0 | 1, 0 | 1, 0 | 1];
};

export const TRIGRAMS: readonly Trigram[] = [
  { key: 0, name: "坤", pinyin: "Kūn", nature: "地", virtue: "顺", lines: [0, 0, 0] },
  { key: 1, name: "震", pinyin: "Zhèn", nature: "雷", virtue: "动", lines: [1, 0, 0] },
  { key: 2, name: "坎", pinyin: "Kǎn", nature: "水", virtue: "陷", lines: [0, 1, 0] },
  { key: 3, name: "兑", pinyin: "Duì", nature: "泽", virtue: "悦", lines: [1, 1, 0] },
  { key: 4, name: "艮", pinyin: "Gèn", nature: "山", virtue: "止", lines: [0, 0, 1] },
  { key: 5, name: "离", pinyin: "Lí", nature: "火", virtue: "丽", lines: [1, 0, 1] },
  { key: 6, name: "巽", pinyin: "Xùn", nature: "风", virtue: "入", lines: [0, 1, 1] },
  { key: 7, name: "乾", pinyin: "Qián", nature: "天", virtue: "健", lines: [1, 1, 1] },
];

/** Short judgements when the law is Rule 110. Keyed by trigram key. */
export const JUDGEMENT_110: Record<number, string> = {
  7: "盛极归静",
  3: "开口而生",
  5: "附丽而生",
  1: "孤阳不生",
  6: "渗入而生",
  2: "险中仍生",
  4: "止处有生",
  0: "空无保持",
};

export type Hexagram = {
  king: number;
  name: string;
  pinyin: string;
  gloss: string;
  lower: number;
  upper: number;
  lines: readonly [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];
};

type Spec = {
  name: string;
  pinyin: string;
  lower: number;
  upper: number;
  gloss: string;
};

const KING: readonly Spec[] = [
  { name: "乾", pinyin: "Qián", lower: 7, upper: 7, gloss: "纯阳。六个「是」叠满，而 111 的邻域在 110 里恰恰归零——盛极的下一步往往是折。" },
  { name: "坤", pinyin: "Kūn", lower: 0, upper: 0, gloss: "纯阴。空并不自动生有。000 维持静默，直到窗口外面有人走进来。" },
  { name: "屯", pinyin: "Zhūn", lower: 1, upper: 2, gloss: "初生的拥堵。底下已经发动，上面仍是险。世界刚开机，结构挤在一起。" },
  { name: "蒙", pinyin: "Méng", lower: 2, upper: 4, gloss: "雾中的格局。信息不够，只能靠三格邻域摸索，没有全局公式可背。" },
  { name: "需", pinyin: "Xū", lower: 7, upper: 2, gloss: "等待。复杂的前沿还没走到这里。爻象在积蓄，不必急着被叫成命运。" },
  { name: "讼", pinyin: "Sòng", lower: 2, upper: 7, gloss: "同一条带子，两边读法相反。规则不对称，所以「对」无法左右互换。" },
  { name: "师", pinyin: "Shī", lower: 2, upper: 0, gloss: "险被大地包住。一列守纪律的阳，像滑翔体，靠队形而不是靠奇迹活着。" },
  { name: "比", pinyin: "Bǐ", lower: 0, upper: 2, gloss: "靠近。孤立的细胞死在边缘，暂时不散的模式才能穿过背景。" },
  { name: "小畜", pinyin: "Xiǎo Chù", lower: 7, upper: 6, gloss: "密云不雨。小结构蓄着，碰撞还没发生，计算尚未写下结果。" },
  { name: "履", pinyin: "Lǚ", lower: 3, upper: 7, gloss: "踩着虎尾走。110 的输出字节去掉乾坤两端，读出来正是这一卦：不对称，才有路。" },
  { name: "泰", pinyin: "Tài", lower: 7, upper: 0, gloss: "天地交。阴阳通气，像带子上两种相开始交换信息。" },
  { name: "否", pinyin: "Pǐ", lower: 0, upper: 7, gloss: "闭塞。交通过了，上下不往来。有序得太干净，故事就暂停。" },
  { name: "同人", pinyin: "Tóng Rén", lower: 5, upper: 7, gloss: "在旷野里认同。不同位置读到同一模式，象开始有了名字。" },
  { name: "大有", pinyin: "Dà Yǒu", lower: 7, upper: 5, gloss: "所持甚多。阳爻密集，记忆很重，一步踏错就会溢。" },
  { name: "谦", pinyin: "Qiān", lower: 4, upper: 0, gloss: "山藏在地下。真正走得远的结构往往看起来不高，只是刚好不被抹掉。" },
  { name: "豫", pinyin: "Yù", lower: 0, upper: 1, gloss: "雷出地上。一个小扰动预备出发，像单一种子即将长出的前沿。" },
  { name: "随", pinyin: "Suí", lower: 1, upper: 3, gloss: "跟随。滑翔体不跟背景打架，它骑在周期上旅行。" },
  { name: "蛊", pinyin: "Gǔ", lower: 6, upper: 4, gloss: "败坏需要整治。重复太久的周期会腐，碰撞才把带子从循环里打出来。" },
  { name: "临", pinyin: "Lín", lower: 3, upper: 0, gloss: "监临。镜头移近这六爻：你只能看见这么宽，宇宙比窗口大得多。" },
  { name: "观", pinyin: "Guān", lower: 0, upper: 6, gloss: "退一步看时空图。单行没有意义，几十代叠起来才现出象。" },
  { name: "噬嗑", pinyin: "Shì Kè", lower: 1, upper: 5, gloss: "咬合。两个模式相撞，障碍在中间被咬碎——通用计算发生在这种地方。" },
  { name: "贲", pinyin: "Bì", lower: 5, upper: 4, gloss: "文饰。纹样是演化留下的，不是谁预先画上去的装饰。" },
  { name: "剥", pinyin: "Bō", lower: 0, upper: 4, gloss: "剥落。阳被逐级拆掉。再稳的结构，也会在错误的邻域里解体。" },
  { name: "复", pinyin: "Fù", lower: 1, upper: 0, gloss: "一阳来复。全阴之中回到一个「是」。经典的 110 宇宙，就从这一枚细胞开始。" },
  { name: "无妄", pinyin: "Wú Wàng", lower: 1, upper: 7, gloss: "不妄为。没有外加的目的，规则自己会长出看起来像目的的东西。" },
  { name: "大畜", pinyin: "Dà Chù", lower: 7, upper: 4, gloss: "大的积蓄。很多代的结果压在窗口里，历史变厚，不可压缩。" },
  { name: "颐", pinyin: "Yí", lower: 1, upper: 4, gloss: "两端为阳、中间为空，像一张嘴。结构靠吞吐背景活着。" },
  { name: "大过", pinyin: "Dà Guò", lower: 6, upper: 3, gloss: "栋梁太刚，两端托不住。过度的模式会从中间折断。" },
  { name: "坎", pinyin: "Kǎn", lower: 2, upper: 2, gloss: "重重险陷，仍是水的轨迹。旅行者反复穿过同一类窄门。" },
  { name: "离", pinyin: "Lí", lower: 5, upper: 5, gloss: "火必须附着在燃料上。没有背景，亮纹无法独自存在。" },
  { name: "咸", pinyin: "Xián", lower: 4, upper: 3, gloss: "无心的感应。两个象进入彼此的邻域，不必商量就改了对方。" },
  { name: "恒", pinyin: "Héng", lower: 6, upper: 1, gloss: "规则一行都不改，卦象却换了无数次。不易的是法，不是风景。" },
  { name: "遁", pinyin: "Dùn", lower: 4, upper: 7, gloss: "退避。该离开的结构让开格子，留给还走得动的那些。" },
  { name: "大壮", pinyin: "Dà Zhuàng", lower: 7, upper: 1, gloss: "阳太盛，往前冲。110 的前沿就是这种不肯停的壮。" },
  { name: "晋", pinyin: "Jìn", lower: 0, upper: 5, gloss: "光明升到地上。代际向下铺展，复杂在前进，不在原点。" },
  { name: "明夷", pinyin: "Míng Yí", lower: 5, upper: 0, gloss: "光明没入背景。一时看不见，不等于已经没有。" },
  { name: "家人", pinyin: "Jiā Rén", lower: 5, upper: 6, gloss: "各爻有位。内卦像室，外卦像野：同一条规则，两种尺度。" },
  { name: "睽", pinyin: "Kuí", lower: 3, upper: 5, gloss: "背向而行。同一条法，走出相反的速度。" },
  { name: "蹇", pinyin: "Jiǎn", lower: 4, upper: 2, gloss: "难行。前面是险，脚下是止。这一步的邻域不许可，就停在卦里。" },
  { name: "解", pinyin: "Xiè", lower: 2, upper: 1, gloss: "碰撞结束，束缚松开，带子重新流出还能读的纹。" },
  { name: "损", pinyin: "Sǔn", lower: 3, upper: 4, gloss: "减掉一爻，有时整艘滑翔体才过得了窄门。" },
  { name: "益", pinyin: "Yì", lower: 1, upper: 6, gloss: "一次碰撞写入新信息。窗口比上一代更有内容。" },
  { name: "夬", pinyin: "Guài", lower: 7, upper: 3, gloss: "决断发生在边缘那一个比特。五阳之下，一阴就是事件。" },
  { name: "姤", pinyin: "Gòu", lower: 6, upper: 7, gloss: "一阴突然遇见五阳。意外的相遇是计算的原料，也是故事的原料。" },
  { name: "萃", pinyin: "Cuì", lower: 0, upper: 3, gloss: "离散的阳聚到一处。宇宙里「东西」的诞生，就是比特暂时不散。" },
  { name: "升", pinyin: "Shēng", lower: 6, upper: 0, gloss: "积小以高大。110 减去六十四，余数正落在这一卦：一步不许跳。" },
  { name: "困", pinyin: "Kùn", lower: 2, upper: 3, gloss: "通道被堵住。局部规则此刻不给出路，只能先改邻域。" },
  { name: "井", pinyin: "Jǐng", lower: 6, upper: 2, gloss: "同一个位置反复提供结构，像稳定的背景周期，养人而不穷。" },
  { name: "革", pinyin: "Gé", lower: 5, upper: 3, gloss: "到了必须换皮的一代。变爻一多，世界就不再是刚才那个名字。" },
  { name: "鼎", pinyin: "Dǐng", lower: 6, upper: 5, gloss: "把原料煮成可食的象。规则是火，六爻是器。" },
  { name: "震", pinyin: "Zhèn", lower: 1, upper: 1, gloss: "连续的动。110 拒绝左右对称，所以震动总有方向。" },
  { name: "艮", pinyin: "Gèn", lower: 4, upper: 4, gloss: "该停的地方停。不是所有邻域都该产出 1。" },
  { name: "渐", pinyin: "Jiàn", lower: 4, upper: 6, gloss: "没有捷径。不能从初爻跳到上爻，代数是诚实的。" },
  { name: "归妹", pinyin: "Guī Mèi", lower: 3, upper: 1, gloss: "组合能存在，却不稳，像寿命很短的粒子。" },
  { name: "丰", pinyin: "Fēng", lower: 5, upper: 1, gloss: "窗口被光占满。越丰盛，越接近不可压缩的极限。" },
  { name: "旅", pinyin: "Lǚ", lower: 4, upper: 5, gloss: "不属于背景的模式在以太里旅行。到站就散，或变成别的卦。" },
  { name: "巽", pinyin: "Xùn", lower: 6, upper: 6, gloss: "风无孔不入。影响沿邻域渗进下一格，不走直线宣告。" },
  { name: "兑", pinyin: "Duì", lower: 3, upper: 3, gloss: "交换发生在开口处。信息被旁边收下，这就是悦。" },
  { name: "涣", pinyin: "Huàn", lower: 2, upper: 6, gloss: "聚过的象重新化开，回到接近噪声的带子。" },
  { name: "节", pinyin: "Jié", lower: 3, upper: 2, gloss: "通用并不等于浪费。格子有限，六爻有限，制度才可能。" },
  { name: "中孚", pinyin: "Zhōng Fú", lower: 3, upper: 6, gloss: "中间空着，外面抱着。中空的结构有时最能传信。" },
  { name: "小过", pinyin: "Xiǎo Guò", lower: 4, upper: 1, gloss: "小偏差过得去，大结构会撞墙。鸟不必飞过整座山。" },
  { name: "既济", pinyin: "Jì Jì", lower: 5, upper: 2, gloss: "阴阳相间，每个位都好像放对了。完成同时是停滞的开始。" },
  { name: "未济", pinyin: "Wèi Jì", lower: 2, upper: 5, gloss: "与既济只差一个平移。停在将成未成，时间才还值得存在。" },
];

function linesOf(lower: number, upper: number): Hexagram["lines"] {
  const L = TRIGRAMS[lower].lines;
  const U = TRIGRAMS[upper].lines;
  return [L[0], L[1], L[2], U[0], U[1], U[2]];
}

function keyOf(lines: readonly number[]): number {
  let key = 0;
  for (let i = 0; i < 6; i++) if (lines[i]) key |= 1 << i;
  return key;
}

function build(): { byKey: Hexagram[]; byKing: Hexagram[] } {
  const byKey: Hexagram[] = new Array(64);
  const byKing: Hexagram[] = new Array(65);
  const seen = new Set<number>();
  KING.forEach((spec, index) => {
    const lines = linesOf(spec.lower, spec.upper);
    const key = keyOf(lines);
    if (seen.has(key)) throw new Error(`duplicate hexagram bits at ${spec.name}`);
    seen.add(key);
    const hex: Hexagram = {
      king: index + 1,
      name: spec.name,
      pinyin: spec.pinyin,
      gloss: spec.gloss,
      lower: spec.lower,
      upper: spec.upper,
      lines,
    };
    byKey[key] = hex;
    byKing[hex.king] = hex;
  });
  if (seen.size !== 64) throw new Error("hexagram table is not 64");
  return { byKey, byKing };
}

const TABLES = build();

export const HEX_BY_KEY: readonly Hexagram[] = TABLES.byKey;
export const HEX_BY_KING: readonly Hexagram[] = TABLES.byKing;

export function hexFromLines(lines: readonly number[]): Hexagram {
  return HEX_BY_KEY[keyOf(lines)];
}

export function kingFromRuleNumber(rule: number): number | null {
  if (rule <= 0) return null;
  const mod = rule % 64;
  return mod === 0 ? 64 : mod;
}

export const LINE_NAMES = ["初", "二", "三", "四", "五", "上"] as const;

export function imageName(hex: Hexagram): string {
  const upper = TRIGRAMS[hex.upper];
  const lower = TRIGRAMS[hex.lower];
  return `${upper.nature}${lower.nature}${hex.name}`;
}
