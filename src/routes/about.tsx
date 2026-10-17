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
    title: "停在哪一代，有什么分别",
    body: "规则 110 从随机初态出发会经过三个阶段。头几十代，环上大半还是哈希本身的比特，读头读到的是问题，不是法则对它的回答——界面上叫「混沌未分」。之后周期性的背景（以太）开始铺开，结构在成形、相遇、相撞，这是最丰富的一段，叫「成象」。再往后环几乎都是以太，只剩少数旅行者；以太每七代回到原样，读头落在里面时读到的卦也七代一循环，叫「以太」。推演时界面实时显示以太占比、结构数、读头是否压着结构，停不停由你，但不是盲停。至于代数本身，应用只把它对六十四和六取余看一眼回声，明说那不是证据。",
  },
  {
    title: "此刻的干支",
    body: "结果页按起卦那一刻的本地时间给出年月日时四柱。年以立春为界，月以十二节为界（小寒、立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪），节气日期按寿星公式取到日，边界上可能差一天。二十三点起算次日子时。日柱按儒略日数推，经 2000 年 1 月 1 日戊午、1949 年 10 月 1 日甲子校验。干支写进链接里的时间戳，分享出去的人看到的是同一刻，只是换成他所在时区的本地时间来算。",
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
