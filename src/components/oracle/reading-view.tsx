import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { LINE_NAMES, type Hexagram } from "@/lib/iching";
import type { Cast } from "@/lib/oracle/cast";
import { useHistory } from "@/lib/oracle/history";
import type { Passage } from "@/lib/oracle/reading";
import { nuclearKey } from "@/lib/oracle/relations";
import { lineTitle, textOf } from "@/lib/oracle/texts";
import { lineLabel } from "@/lib/yarrow";
import { YinYangLine } from "@/components/cosmos/hex-mark";
import { FuxiGrid } from "./fuxi-grid";
import { HeadLens } from "./head-lens";
import { HexagramCard } from "./hexagram-card";
import { RingTape } from "./ring-tape";
import { ShareButton } from "./share-button";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function ReadingView({ cast, question }: { cast: Cast; question?: string }) {
  const remember = useHistory((s) => s.remember);

  useEffect(() => {
    remember({
      id: cast.id,
      method: cast.method,
      gen: cast.method === "ca" ? cast.gen : undefined,
      question: question ?? "",
      at: Date.now(),
      benKing: cast.ben.king,
      zhiKing: cast.zhi.king,
      changes: cast.reading.changes,
    });
  }, [cast, question, remember]);

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
              search={{ q: question || undefined, g: undefined }}
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
        <article className="flex flex-col gap-5 rounded-card border border-line bg-surface p-4 sm:p-5">
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
                读头放大 · 第 {cast.seed.head} 格起，含两侧邻居
              </p>
              <HeadLens
                benRow={cast.history.rows[cast.gen - cast.history.first]}
                zhiRow={cast.history.rows[cast.gen + 1 - cast.history.first]}
                head={cast.seed.head}
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
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="全文与注">
        <article className="flex flex-col gap-3 rounded-card border border-line p-4 sm:p-5">
          <p className="text-xs text-muted">元胞注 · 本卦</p>
          <p className="text-pretty leading-relaxed">{cast.ben.gloss}</p>
          {moved ? (
            <>
              <p className="mt-2 text-xs text-muted">元胞注 · 之卦</p>
              <p className="text-pretty leading-relaxed text-muted">{cast.zhi.gloss}</p>
            </>
          ) : null}
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
          ? `这一卦可以完整复现：链接里带着 256 位种子 ${cast.id.slice(0, 12)}… 与停住的代数 ${cast.gen}。任何人打开，都会看到同一条带子、同一个读头、同一卦。`
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

function StaticTape({ cast }: { cast: Extract<Cast, { method: "ca" }> }) {
  const rowsRef = useRef(cast.history.rows);
  const firstRef = useRef(cast.history.first);
  rowsRef.current = cast.history.rows;
  firstRef.current = cast.history.first;
  return (
    <div className="overflow-hidden rounded-md border border-line bg-bg">
      <RingTape
        rowsRef={rowsRef}
        firstRef={firstRef}
        tick={cast.gen}
        head={cast.seed.head}
        focusGen={cast.gen}
        className="h-56 sm:h-72"
      />
    </div>
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
