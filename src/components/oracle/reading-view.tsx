import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import {
  HEX_BY_KEY,
  HEX_BY_KING,
  LINE_NAMES,
  kingFromRuleNumber,
  type Hexagram,
} from "@/lib/iching";
import { etherStats } from "@/lib/oracle/ether";
import type { Cast } from "@/lib/oracle/cast";
import { useHistory } from "@/lib/oracle/history";
import type { Passage } from "@/lib/oracle/reading";
import { nuclearKey } from "@/lib/oracle/relations";
import { lineTitle, textOf } from "@/lib/oracle/texts";
import { keyOfLines, stepRing } from "@/lib/oracle/universe";
import { lineLabel } from "@/lib/yarrow";
import { HexMark, YinYangLine } from "@/components/cosmos/hex-mark";
import { FuxiGrid } from "./fuxi-grid";
import { HeadLens } from "./head-lens";
import { HexagramCard } from "./hexagram-card";
import { LineCauses, RuleTable } from "./line-causes";
import { MomentCard } from "./moment-card";
import { NoteBlock } from "./note-block";
import { PhaseMeter } from "./phase-meter";
import { RingTape } from "./ring-tape";
import { ShareButton } from "./share-button";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function ReadingView({
  cast,
  question,
  at,
}: {
  cast: Cast;
  question?: string;
  at?: number;
}) {
  const remember = useHistory((s) => s.remember);

  useEffect(() => {
    remember({
      id: cast.id,
      method: cast.method,
      gen: cast.method === "ca" ? cast.gen : undefined,
      head: cast.method === "ca" && cast.placed ? cast.head : undefined,
      question: question ?? "",
      at: at ? at * 1000 : Date.now(),
      benKing: cast.ben.king,
      zhiKing: cast.zhi.king,
      changes: cast.reading.changes,
    });
  }, [cast, question, at, remember]);

  const moved = cast.reading.changes > 0;
  const benText = textOf(cast.ben.king);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-wide text-cinnabar">
          {cast.method === "ca"
            ? `元胞起卦 · 规则 110 · 停于第 ${cast.gen} 代`
            : "大衍起卦 · 十六分之成数"}
        </p>
        <h1 className="text-2xl font-semibold text-balance sm:text-3xl">
          {question ? `「${question}」` : "无题之问"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <ShareButton title={`${cast.ben.name}${moved ? `之${cast.zhi.name}` : ""}`} />
          {cast.method === "ca" ? (
            <Link
              to="/cast/$id"
              params={{ id: cast.id }}
              search={{ q: question || undefined, g: undefined, t: at, h: undefined }}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted hover:text-ink"
            >
              <RotateCcw className="size-4" />
              同一初态，再走一次
            </Link>
          ) : null}
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-md border border-line px-3 text-sm text-muted hover:text-ink"
          >
            再问一卦
          </Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="卦象">
        <article className="flex flex-col gap-5 rounded-card border border-ink/35 bg-surface p-4 shadow-[inset_0_1px_0_rgba(243,236,223,0.08)] sm:p-5">
          <HexagramCard
            hex={cast.ben}
            lines={cast.benLines}
            changing={cast.changing}
            label="本卦"
          />
          <LinesStrip cast={cast} />
          <div className="border-t border-line pt-4">
            <HexagramCard
              hex={cast.zhi}
              lines={cast.zhiLines}
              label={moved ? `之卦 · ${cast.reading.changes} 爻变` : "六爻皆静 · 之卦同本卦"}
              size="md"
            />
          </div>
        </article>

        {cast.method === "ca" ? (
          <article className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:p-5">
            <div>
              <p className="text-xs text-muted">时空图 · 停住前的历史</p>
              <p className="text-sm text-pretty text-muted">
                朱砂框是第 {cast.gen} 代的读头，本卦；下一行虚框是第 {cast.gen + 1}{" "}
                代，之卦。翻转的细胞就是变爻。窄屏只显示读头附近的一段环。
              </p>
            </div>
            <StaticTape cast={cast} />
            <div className="max-w-xs">
              <p className="mb-1 text-xs text-muted">
                读头放大 · 第 {cast.head} 格起，含两侧邻居 ·{" "}
                {cast.placed ? "位由你所定" : "位由散列所定"}
              </p>
              <HeadLens
                benRow={cast.history.rows[cast.gen - cast.history.first]}
                zhiRow={cast.history.rows[cast.gen + 1 - cast.history.first]}
                head={cast.head}
                changing={cast.changing}
              />
            </div>
          </article>
        ) : (
          <article className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:p-5">
            <p className="text-xs text-muted">六爻成数</p>
            <ul className="grid grid-cols-6 gap-2">
              {cast.values.map((value, i) => (
                <li key={i} className="text-center">
                  <p className="font-mono text-2xl tabular-nums">{value}</p>
                  <p className={cx("text-xs", cast.changing[i] ? "text-cinnabar" : "text-muted")}>
                    {lineLabel(value)}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-sm text-pretty leading-relaxed text-muted">
              九与六是老阳老阴，会变；七与八是少阳少阴，不变。老阴十六分之一，少阳五，少阴七，老阳三——这是蓍草三变之后的成数比例。
            </p>
          </article>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="此刻与停处">
        <article className="flex flex-col gap-3 rounded-card border border-line p-4 sm:p-5">
          <MomentCard at={at} />
        </article>
        <article className="flex flex-col gap-3 rounded-card border border-line p-4 sm:p-5">
          {cast.method === "ca" ? <StopNotes cast={cast} /> : <YarrowNotes />}
        </article>
      </section>

      <section
        className="rounded-card border border-cinnabar/60 bg-surface p-4 sm:p-6"
        aria-labelledby="reading-title"
      >
        <p className="text-xs text-cinnabar">占断</p>
        <h2 id="reading-title" className="mt-1 text-xl font-semibold">
          {cast.ben.name}
          {moved ? `之${cast.zhi.name}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">{cast.reading.rule}</p>
        <ol className="mt-5 flex flex-col gap-5">
          {cast.reading.passages.map((p, i) => (
            <PassageItem key={`${p.from}-${p.kind}-${p.line ?? ""}-${i}`} passage={p} />
          ))}
        </ol>
        <NoteBlock cast={cast} question={question} at={at} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="全文与注">
        <article className="flex flex-col gap-3 rounded-card border border-line p-4 sm:p-5">
          {cast.method === "ca" ? (
            <>
              <div>
                <p className="text-xs text-muted">变爻之因 · 每一爻由哪个三爻体决定</p>
                <p className="text-sm text-pretty text-muted">
                  规则 110
                  看三格定一格，三格就是一个三爻卦：乾、坤、震生阴，兑、离、巽、坎、艮生阳。
                </p>
              </div>
              <LineCauses causes={cast.causes} benLines={cast.benLines} />
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted">一一〇的八卦表</p>
                <p className="text-sm text-pretty leading-relaxed text-muted">
                  大衍法的变爻来自成数，不来自邻域，所以这里没有「因」可列。若是元胞起卦，之卦的二至五爻会由本卦的下卦、互卦二体、上卦按这张表决定。
                </p>
              </div>
              <RuleTable compact />
            </>
          )}
        </article>
        <article className="flex flex-col gap-3 rounded-card border border-line p-4 sm:p-5">
          <FullText hex={cast.ben} label="本卦全文" open />
          {moved ? <FullText hex={cast.zhi} label="之卦全文" /> : null}
          <p className="text-xs text-muted">
            {benText.extra
              ? `${cast.ben.name}卦另有${benText.extra.slice(0, 2)}，六爻皆变时用。`
              : "经文依通行本。"}
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]" aria-label="卦的关系与位置">
        <article className="flex flex-col gap-4 rounded-card border border-line p-4 sm:p-5">
          <p className="text-xs text-muted">本卦的三个影子</p>
          <HexagramCard
            hex={cast.relations.nuclear}
            lines={cast.relations.nuclear.lines}
            label="互卦 · 二三四 / 三四五"
            size="md"
          />
          <HexagramCard
            hex={cast.relations.opposite}
            lines={cast.relations.opposite.lines}
            label="错卦 · 六爻皆反"
            size="md"
          />
          <HexagramCard
            hex={cast.relations.reverse}
            lines={cast.relations.reverse.lines}
            label={cast.relations.selfReverse ? "综卦 · 倒过来还是自己" : "综卦 · 上下颠倒"}
            size="md"
          />
        </article>
        <article className="flex flex-col gap-3 rounded-card border border-line p-4 sm:p-5">
          <div>
            <p className="text-xs text-muted">先天方图 · 读头可能停住的全部 64 个状态</p>
            <p className="text-sm text-pretty text-muted">
              邵雍把六十四卦排成 8×8，阳为 0、阴为 1，正是六位二进制计数。
              {cast.method === "ca" ? "元胞读头每一代都在这张表上跳一格或不动。" : ""}
            </p>
          </div>
          <FuxiGrid
            benKey={cast.benKey}
            zhiKey={cast.zhiKey}
            nuclearKey={nuclearKey(cast.benKey)}
          />
        </article>
      </section>

      <p className="text-xs text-pretty text-muted [overflow-wrap:anywhere]">
        {cast.method === "ca"
          ? `这一卦可以完整复现：链接里带着 256 位种子 ${cast.id.slice(0, 12)}…、停住的代数 ${cast.gen}${cast.placed ? `、你放下读头的第 ${cast.head} 格` : ""}。任何人打开，都会看到同一条带子、同一个读头、同一卦。`
          : "这一卦的六个成数都在链接里，打开即是同一卦。"}
      </p>
    </div>
  );
}

function LinesStrip({ cast }: { cast: Cast }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {LINE_NAMES.map((name, i) => {
        const hot = cast.changing[i];
        return (
          <div key={name} className="text-center">
            <p className={cx("text-xs", hot ? "text-cinnabar" : "text-muted")}>
              {lineTitle(i, cast.benLines[i] === 1)}
            </p>
            <div className="mt-1 px-0.5">
              <YinYangLine on={cast.benLines[i] === 1} />
            </div>
            <p className={cx("mt-1 text-xs", hot ? "text-cinnabar" : "text-muted")}>
              {cast.method === "yarrow" ? lineLabel(cast.values[i]) : hot ? "变" : "静"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

type CaReading = Extract<Cast, { method: "ca" }>;

function StaticTape({ cast }: { cast: CaReading }) {
  const rowsRef = useRef(cast.history.rows);
  const firstRef = useRef(cast.history.first);
  rowsRef.current = cast.history.rows;
  firstRef.current = cast.history.first;
  // Cells are 4 css px tall; an early stop has few rows, so don't leave the rest blank.
  const height = Math.min(288, Math.max(64, (cast.gen + 2) * 4));
  return (
    <div className="overflow-hidden rounded-md border border-line bg-bg">
      <RingTape
        rowsRef={rowsRef}
        firstRef={firstRef}
        tick={cast.gen}
        head={cast.head}
        focusGen={cast.gen}
        className="w-full"
        style={{ height }}
      />
    </div>
  );
}

function StopNotes({ cast }: { cast: CaReading }) {
  const row = cast.history.rows[cast.gen - cast.history.first];
  const stats = etherStats(row, cast.head);
  const echoKing = kingFromRuleNumber(cast.gen);
  const echo = echoKing ? HEX_BY_KING[echoKing] : null;
  const rem6 = cast.gen % 6;
  const echoLine = LINE_NAMES[rem6 === 0 ? 5 : rem6 - 1];
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted">停处 · 第 {cast.gen} 代</p>
        <p className="font-mono text-[11px] text-muted tabular-nums">
          约 {(cast.gen * 0.11).toFixed(1)} 秒的推演
        </p>
      </div>
      <PhaseMeter stats={stats} />
      <p className="text-sm text-pretty leading-relaxed text-muted">
        {stats.headOnEther
          ? "读头落在背景里。背景每七代回到原样，所以这一卦更像此刻的势，而不是一件具体的事。"
          : "读头压着一个不属于背景的结构。这是环上正在发生的事，卦从它身上读出来。"}
      </p>
      <VerticalReading cast={cast} />
      <div className="border-t border-line pt-3">
        <p className="text-xs text-muted">回声 · 只是回声，不是证据</p>
        <p className="mt-1 text-sm text-pretty leading-relaxed text-muted">
          以太的周期是七代；复卦辞说「反复其道，七日来复」。同一个七，只是回声。
        </p>
        <p className="mt-1 text-sm text-pretty leading-relaxed text-muted">
          {echo ? (
            <>
              {cast.gen} 除以六十四余 {((cast.gen - 1) % 64) + 1}，对上第 {echo.king} 卦
              <span className="text-ink">{echo.name}</span>；除以六余 {rem6}
              {rem6 === 0 ? "（零作六）" : ""}，对上{echoLine}爻。
              梅花易数以时数取动爻，这里把代数当作时数看一眼，仅此而已。
            </>
          ) : (
            "第 0 代没有余数。还没走一步就停，宇宙只是问题本身。"
          )}
        </p>
      </div>
    </>
  );
}

/**
 * 纵读, a trial: the six lines read down the 初爻 column instead of across
 * the window. The six generations before the stop are the 本卦 the asker
 * watched; the six after are the 之卦 the ring went on to without them.
 */
function VerticalReading({ cast }: { cast: CaReading }) {
  const { rows, first } = cast.history;
  const col = cast.head;
  const benIdx = cast.gen - first;
  if (benIdx < 5) {
    return (
      <div className="border-t border-line pt-3">
        <p className="text-xs text-muted">纵读 · 试</p>
        <p className="mt-1 text-sm text-pretty leading-relaxed text-muted">
          沿初爻那一格往下读六代也能成卦，停前六代为本、停后六代为之。这次停在第 {cast.gen}{" "}
          代，还不够六代。
        </p>
      </div>
    );
  }
  const benLines: number[] = [];
  for (let k = 5; k >= 0; k--) benLines.push(rows[benIdx - k][col]);
  const zhiLines: number[] = [];
  let row = rows[benIdx];
  for (let k = 0; k < 6; k++) {
    row = benIdx + 1 + k < rows.length ? rows[benIdx + 1 + k] : stepRing(row);
    zhiLines.push(row[col]);
  }
  const ben = HEX_BY_KEY[keyOfLines(benLines)];
  const zhi = HEX_BY_KEY[keyOfLines(zhiLines)];
  const changing = benLines.map((b, i) => b !== zhiLines[i]);
  const moved = changing.filter(Boolean).length;
  return (
    <div className="border-t border-line pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted">纵读 · 试</p>
        <p className="font-mono text-[11px] text-muted tabular-nums">第 {col} 格 · 时为爻</p>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8">
            <HexMark lines={benLines} changing={changing} size="sm" />
          </div>
          <div>
            <p className="text-xs text-muted">停前六代</p>
            <p className="font-semibold">{ben.name}</p>
          </div>
        </div>
        <span className="text-muted">→</span>
        <div className="flex items-center gap-2">
          <div className="w-8">
            <HexMark lines={zhiLines} size="sm" />
          </div>
          <div>
            <p className="text-xs text-muted">停后六代</p>
            <p className="font-semibold">
              {zhi.name}
              {moved ? <span className="ml-1 text-xs text-muted">{moved} 爻变</span> : null}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm text-pretty leading-relaxed text-muted">
        爻位本是时序：初为始，上为终。横读是此刻的空间，纵读是这一格的时间；之卦在这里是字面的「将往」——你停下后，环接着走的六代。
      </p>
    </div>
  );
}

function YarrowNotes() {
  return (
    <>
      <p className="text-xs text-muted">停处</p>
      <p className="text-sm text-pretty leading-relaxed text-muted">
        大衍法六爻一次成，没有推演，也就没有停处可言。十八变的时间都压缩在抽签的一瞬里；此刻的干支就是这一卦唯一的时间。
      </p>
    </>
  );
}

function PassageItem({ passage }: { passage: Passage }) {
  return (
    <li className={cx("border-l-2 pl-4", passage.primary ? "border-cinnabar" : "border-line")}>
      <p className={cx("text-xs", passage.primary ? "text-cinnabar" : "text-muted")}>
        {passage.title}
        {passage.primary ? " · 主" : ""}
      </p>
      <p
        className={cx(
          "mt-1 text-pretty leading-relaxed",
          passage.primary ? "text-xl sm:text-2xl" : "text-base text-ink/90",
        )}
      >
        {passage.text}
      </p>
    </li>
  );
}

function FullText({ hex, label, open }: { hex: Hexagram; label: string; open?: boolean }) {
  const t = textOf(hex.king);
  return (
    <details open={open} className="group">
      <summary className="cursor-pointer list-none text-xs text-muted select-none hover:text-ink">
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
        {label} · {hex.name}
      </summary>
      <dl className="mt-3 flex flex-col gap-2 text-sm leading-relaxed">
        <div>
          <dt className="inline text-muted">{hex.name}：</dt>
          <dd className="inline">{t.judgment}</dd>
        </div>
        <div>
          <dt className="inline text-muted">象曰：</dt>
          <dd className="inline">{t.image}</dd>
        </div>
        {t.lines.map((line, i) => (
          <div key={i}>
            <dt className="inline text-muted">{lineTitle(i, hex.lines[i] === 1)}：</dt>
            <dd className="inline">{line}</dd>
          </div>
        ))}
        {t.extra ? (
          <div>
            <dt className="inline text-muted">{t.extra.slice(0, 2)}：</dt>
            <dd className="inline">{t.extra.slice(3)}</dd>
          </div>
        ) : null}
      </dl>
    </details>
  );
}
