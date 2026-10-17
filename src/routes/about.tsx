import { createFileRoute } from "@tanstack/react-router";
import { Essay } from "@/components/cosmos/essay";

export const Route = createFileRoute("/about")({
  component: About,
});

const METHOD: readonly { title: string; body: string }[] = [
  {
    title: "初态怎么来",
    body: "问题文本、此刻的时间戳、四个字节的随机数，三者拼在一起做 SHA-256。得到的 256 位就是 256 个细胞，排成一个首尾相接的环；最后一个字节决定读头停在环上的哪一格。时间戳对应梅花易数里的「时」，随机数对应分蓍时的手。摘要本身写在链接里，所以每一卦都能被任何人原样复现。",
  },
  {
    title: "怎么推演",
    body: "规则 110：每个细胞看自己和左右邻居，三格八种情形，字节 01101110 规定下一代是阴是阳。环上没有边界，所以可以一直走下去。规则 110 已被证明是图灵完备的——它能模拟任何计算，这也意味着没有公式能跳到第 n 代，想知道就得真跑到那里。",
  },
  {
    title: "怎么成卦",
    body: "读头是环上连续的六格，左边是初爻，右边是上爻，阳为 1 阴为 0。你停住的那一代，读头下的六格是本卦；再走一代，是之卦。两代之间翻转的细胞就是变爻。注意初爻和上爻的变化取决于窗口外的邻居——读卦的人永远比卦多看一格。",
  },
  {
    title: "怎么读",
    body: "变占依朱熹《易学启蒙》：六爻皆静读本卦卦辞；一爻变读本卦变爻；二爻变读两变爻，上爻为主；三爻变读本卦与之卦卦辞，本卦为贞之卦为悔；四爻变读之卦两不变爻，下爻为主；五爻变读之卦不变爻；六爻皆变，乾坤用九用六，余卦读之卦卦辞。",
  },
  {
    title: "大衍起卦",
    body: "另一条路是传统的大衍筮法。每爻的成数在 6、7、8、9 之间，比例是老阴一、少阳五、少阴七、老阳三，共十六分。老阴老阳会变，少阳少阴不变。应用里不摆蓍草，直接按这个比例抽签。",
  },
  {
    title: "先天方图",
    body: "邵雍把六十四卦排成 8×8 的方图，行是上卦、列是下卦，顺序都是乾兑离震巽坎艮坤。若把阳记为 0、阴记为 1，从上爻读到初爻，这张图正是 0 到 63 的二进制计数——莱布尼茨在 1703 年看到的就是它。它恰好也是读头可能停住的全部 64 个状态。",
  },
  {
    title: "出处",
    body: "经文用《周易》通行本的卦辞、爻辞和《象传》大象。每卦的「元胞注」是本应用自己的读法，把卦象和元胞自动机里的现象对读，不是传统注疏。Rule 110 的通用性证明见 Matthew Cook, Universality in Elementary Cellular Automata (2004)。",
  },
];

function About() {
  return (
    <>
      <div className="h-1 bg-cinnabar" />
      <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 pt-8 pb-16">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-xs tracking-wide text-cinnabar">方法</p>
          <h1 className="text-4xl font-semibold tracking-wide">这一卦是怎么来的</h1>
          <p className="text-pretty leading-relaxed text-muted">
            从问题到卦象的每一步都是确定的、可复现的。随机只在起手的一瞬间，之后全是法则。
          </p>
        </header>
        <ol className="flex flex-col gap-6">
          {METHOD.map((item, index) => (
            <li key={item.title} className="border-l border-cinnabar pl-4">
              <h2 className="text-lg font-semibold">
                <span className="mr-2 font-mono text-sm text-cinnabar tabular-nums">
                  0{index + 1}
                </span>
                {item.title}
              </h2>
              <p className="mt-2 text-pretty leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ol>
        <div className="border-t border-line pt-10">
          <Essay />
        </div>
      </main>
    </>
  );
}
