import { memo } from "react";

const NOTES: readonly { title: string; body: string }[] = [
  {
    title: "简易 · 法律只有一个字节",
    body: "初等元胞自动机一共 256 条。每一条都是一个字节：左、中、右三格组成八种邻域，每种邻域只判决下一枚细胞是阴是阳。规则 110 的字节写成 01101110。它左右不对称。时间之箭不必从外面焊上去，不对称本身就是方向。",
  },
  {
    title: "八卦是规则的视力",
    body: "把左邻当作初爻、中位当作中爻、右邻当作上爻，八种邻域就是八卦。110 对它们很苛刻：乾（三阳）与坤（三阴）都归静——盛极与空无都不产生下一枚阳。震也不生：孤阳留在左边，中右皆空，动无所附。兑、离、巽、坎、艮才生阳。这条法律偏爱不纯的局面。",
  },
  {
    title: "六爻是人能读的尺度",
    body: "细胞是爻。三爻是法的视野。六爻是两个三爻叠起来：内卦是已经成形的势，外卦是它所遇到的更大名字。世界的状态远远多于 64 种——一条带子的可能是 2 的宽度次方。六十四卦不是物理学的全部，而是人一次能稳住、能称呼、能传下去的注意力宽度。",
  },
  {
    title: "变爻不可压缩",
    body: "马修·库克在 2004 年证明：规则 110 可以模拟循环标签系统，因此是图灵完备的。一个能做通用计算的过程，足够长的未来一般不能被大幅压缩。你想知道第 n 代，往往就得真的跑到第 n 代。易传讲「生生之谓易」。占要起卦、标出变爻、走到之卦，而不能靠一条代数直接报出明年。说成「天机不可泄漏」是神话；说成「计算不可约」是同一种直觉的现代形状。",
  },
  {
    title: "数的回声，不是证据",
    body: "110 = 64 + 46。六十四是局势的全集，余数 46 是升：积小以高大。把输出字节 01101110 的两端去掉——两端正好是乾与坤的判决，都是 0——中间六位 110111 自下而上读，下兑上乾，是履：踩着虎尾，不对称地走。所以这条法律的号码像升，形状像履。宇宙若是这种东西，它不是炸出来的，它是小心地、一步一步踩上去的。这是我们选择的读法看见的巧合。110 本身就会大量制造「看起来像意义」的结构。",
  },
  {
    title: "三种易",
    body: "简易：法律只有一个字节。变易：每一代都可能改写卦象。能在周期背景里走一段而不散的模式，就是象——物、机构、念头。它们相撞的地方，就是占。不易：规则自己不变。变的是卦，不是道。",
  },
  {
    title: "为什么不是另外 255 条",
    body: "全 0 是死寂，没有世。规则 204 让每爻复制自己，恒到取消了历史。规则 90 是漂亮的分形，几乎没有可以称为个体的旅行者。规则 30 像噪声，局部预言崩溃，长寿命的象很少。规则 184 是守秩序的队列，普遍认为不足以承担任意计算。规则 110 贴着有序与混沌的边缘：有背景，有旅行者，有碰撞，并且被证明算得了任何可计算的东西。若「世界」的最低标准是能记住、能相遇、能长出规则里没写过的结构，256 则里，110 是最窄的那道门之一。",
  },
];

export const Essay = memo(function Essay() {
  return (
    <section className="mx-auto max-w-2xl" aria-labelledby="essay-title">
      <h2 id="essay-title" className="text-2xl font-semibold text-balance">
        八比特的道，六比特的世
      </h2>
      <p className="mt-3 text-pretty leading-relaxed text-muted">
        这不是考证，也不是证明。库克证明了 110 能计算；易经给人六比特的名字。中间这条路是推演。
      </p>
      <ol className="mt-8 flex flex-col gap-6">
        {NOTES.map((note, index) => (
          <li key={note.title} className="border-l border-cinnabar pl-4">
            <h3 className="text-lg font-semibold text-balance">
              <span className="mr-2 font-mono text-sm text-cinnabar tabular-nums">
                0{index + 1}
              </span>
              {note.title}
            </h3>
            <p className="mt-2 text-pretty leading-relaxed">{note.body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-pretty leading-relaxed text-muted">
        你在图上移动的六爻窗口就是一次占。窗口里的名字是古人对局势的称呼；窗口外面继续蔓延的，是法律自己的事。
      </p>
    </section>
  );
});
