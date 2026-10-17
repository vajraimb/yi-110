import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Crosshair, Pause, Play, RotateCcw } from "lucide-react";
import {
  COLS,
  ORIGIN,
  MAX_ROWS,
  birthCount,
  byteBits,
  isSymmetric,
  leftmost,
  makeSeed,
  middleHexLines,
  shiftRowsRight,
  stepRow,
  trigramOutput,
  verdictFor,
  type SeedId,
} from "@/lib/ca";
import {
  HEX_BY_KING,
  JUDGEMENT_110,
  LINE_NAMES,
  TRIGRAMS,
  hexFromLines,
  imageName,
  kingFromRuleNumber,
} from "@/lib/iching";
import { Essay } from "@/components/cosmos/essay";
import { HexMark, YinYangLine } from "@/components/cosmos/hex-mark";
import { Spacetime } from "@/components/cosmos/spacetime";

const HAND = 24;
const PRESETS = [
  { id: 0, name: "死寂" },
  { id: 30, name: "混沌" },
  { id: 90, name: "分形" },
  { id: 110, name: "边缘" },
  { id: 184, name: "队列" },
  { id: 204, name: "恒定" },
] as const;

const SEEDS: readonly { id: SeedId; name: string; hint: string }[] = [
  { id: "one", name: "一", hint: "一枚阳，开局读作复" },
  { id: "meet", name: "遇", hint: "两枚阳，等它们的前沿相撞" },
  { id: "lu", name: "履", hint: "把规则的形状种进带子" },
  { id: "dust", name: "尘", hint: "稀疏而确定的初始尘埃" },
  { id: "hand", name: "手绘", hint: "自己写下二十四爻" },
];

const SPEEDS = [
  { id: 1, name: "缓" },
  { id: 4, name: "中" },
  { id: 12, name: "疾" },
] as const;

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function interiorLens(row: Uint8Array, abs: number): number | null {
  const left = leftmost(row);
  if (left === null) return null;
  const inset = Math.min(18, Math.max(0, abs - 12));
  return Math.min(left + inset, COLS - 6);
}

function linesAt(row: Uint8Array, start: number): number[] {
  const lines: number[] = [];
  for (let i = 0; i < 6; i++) {
    const col = start + i;
    lines.push(col >= 0 && col < row.length ? row[col] : 0);
  }
  return lines;
}

export function CosmosApp() {
  const [rule, setRule] = useState(110);
  const [seed, setSeed] = useState<SeedId>("one");
  const [hand, setHand] = useState<number[]>(() => Array.from({ length: HAND }, () => 0));
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["id"]>(1);
  const [lens, setLens] = useState(ORIGIN);
  const [follow, setFollow] = useState(true);
  const [lookback, setLookback] = useState(0);
  const [gen, setGen] = useState(0);

  const rowsRef = useRef<Uint8Array[]>([]);
  const droppedRef = useRef(0);
  const ruleRef = useRef(rule);
  const speedRef = useRef(speed);
  const followRef = useRef(follow);
  const lensRef = useRef(lens);
  const playingRef = useRef(playing);
  ruleRef.current = rule;
  speedRef.current = speed;
  followRef.current = follow;
  lensRef.current = lens;
  playingRef.current = playing;

  const boot = rowsRef.current.length === 0;
  if (boot) {
    rowsRef.current = [makeSeed("one", hand)];
  }

  const resetTo = useCallback((nextSeed: SeedId, nextRule: number, nextHand: readonly number[], play: boolean) => {
    rowsRef.current = [makeSeed(nextSeed, nextHand)];
    droppedRef.current = 0;
    const left = leftmost(rowsRef.current[0]);
    const nextLens =
      nextSeed === "meet"
        ? Math.max(0, ORIGIN - 18)
        : left === null
          ? ORIGIN
          : Math.min(left, COLS - 6);
    lensRef.current = nextLens;
    setLens(nextLens);
    setLookback(0);
    setGen(0);
    followRef.current = nextSeed === "one" || nextSeed === "lu";
    setFollow(followRef.current);
    playingRef.current = play;
    setPlaying(play);
  }, []);

  const stepMany = useCallback((count: number) => {
    const rows = rowsRef.current;
    const currentRule = ruleRef.current & 255;
    for (let i = 0; i < count; i++) {
      rows.push(stepRow(rows[rows.length - 1], currentRule));
      if (rows.length > MAX_ROWS) {
        rows.shift();
        droppedRef.current += 1;
      }
    }
    const edge = leftmost(rows[rows.length - 1]);
    if (edge !== null && edge < 6) {
      const amount = 72;
      if (shiftRowsRight(rows, amount)) {
        lensRef.current = Math.min(COLS - 6, lensRef.current + amount);
      }
    }
    const abs = droppedRef.current + rows.length - 1;
    if (followRef.current && abs > 14) {
      const next = interiorLens(rows[rows.length - 1], abs);
      if (next !== null) lensRef.current = next;
    }
    setLens(lensRef.current);
    setLookback(0);
    setGen(abs);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!playingRef.current) {
        last = now;
        return;
      }
      const interval = speedRef.current === 1 ? 360 : speedRef.current === 4 ? 150 : 48;
      if (now - last < interval) return;
      last = now;
      const burst = speedRef.current === 12 ? 2 : 1;
      stepMany(burst);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stepMany]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === " ") {
        event.preventDefault();
        playingRef.current = !playingRef.current;
        setPlaying(playingRef.current);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setFollow(false);
        setLens((value) => {
          const next = Math.max(0, Math.min(COLS - 6, value + (event.key === "ArrowLeft" ? -1 : 1)));
          lensRef.current = next;
          return next;
        });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        playingRef.current = false;
        setPlaying(false);
        setLookback((value) => Math.min(value + 1, Math.max(0, rowsRef.current.length - 1)));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setLookback((value) => Math.max(0, value - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rows = rowsRef.current;
  const safeLook = Math.min(lookback, Math.max(0, rows.length - 1));
  const focusIndex = Math.max(0, rows.length - 1 - safeLook);
  const focusRow = rows[focusIndex] ?? rows[0];
  const reading = useMemo(() => {
    if (!focusRow) {
      const empty = [0, 0, 0, 0, 0, 0];
      return {
        lines: empty,
        nextLines: empty,
        changing: [false, false, false, false, false, false],
        flankL: 0,
        flankR: 0,
        hex: hexFromLines(empty),
        nextHex: hexFromLines(empty),
      };
    }
    const lines = linesAt(focusRow, lens);
    const next = stepRow(focusRow, rule);
    const nextLines = linesAt(next, lens);
    return {
      lines,
      nextLines,
      changing: lines.map((bit, i) => bit !== nextLines[i]),
      flankL: lens > 0 ? focusRow[lens - 1] : 0,
      flankR: lens + 6 < focusRow.length ? focusRow[lens + 6] : 0,
      hex: hexFromLines(lines),
      nextHex: hexFromLines(nextLines),
    };
  }, [focusRow, lens, rule, gen, safeLook]);

  const history = useMemo(() => {
    const items: { look: number; name: string; lines: number[]; abs: number }[] = [];
    const take = Math.min(12, rows.length);
    for (let look = 0; look < take; look++) {
      const index = rows.length - 1 - look;
      const lines = linesAt(rows[index], lens);
      items.push({
        look,
        name: hexFromLines(lines).name,
        lines,
        abs: droppedRef.current + index,
      });
    }
    return items;
  }, [rows, lens, gen]);

  const absGen = droppedRef.current + Math.max(0, rows.length - 1);
  const shownGen = droppedRef.current + focusIndex;
  const changes = reading.changing.filter(Boolean).length;
  const echoLines = middleHexLines(rule);
  const echoHex = hexFromLines(echoLines);
  const echoKing = kingFromRuleNumber(rule);
  const echoMod = echoKing ? HEX_BY_KING[echoKing] : null;
  const bits = byteBits(rule);

  const halt = () => {
    playingRef.current = false;
    followRef.current = false;
    setPlaying(false);
    setFollow(false);
  };

  const toggleRun = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  const pickLens = (col: number) => {
    halt();
    const next = Math.max(0, Math.min(COLS - 6, col - 2));
    lensRef.current = next;
    setLens(next);
  };

  const onRule = (next: number) => {
    const clamped = Math.max(0, Math.min(255, next));
    setRule(clamped);
    resetTo(seed, clamped, hand, seed !== "hand");
  };

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="h-1 bg-cinnabar" />
      <header className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-6 pb-4 lg:pt-8">
        <p className="font-mono text-xs tracking-wide text-cinnabar">元胞自动机 · 256 则之一</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-semibold tracking-wide text-balance lg:text-5xl">一一〇</h1>
            <p className="mt-2 max-w-xl text-pretty text-muted">
              一条八比特的法律，在六爻宽的窗口里，被读成世界。
            </p>
          </div>
          <p className="font-mono text-sm text-muted tabular-nums">
            第 {shownGen} 代{safeLook > 0 ? ` · 回看 ${safeLook}` : ""} / 已演 {absGen}
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-16">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Spacetime
                rowsRef={rowsRef}
                gen={gen}
                lens={lens}
                lookback={safeLook}
                onPick={pickLens}
              />
              <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-3 rounded-md border border-line bg-bg/90 px-3 py-2">
                <div className="w-10">
                  <HexMark lines={reading.lines} changing={reading.changing} />
                </div>
                <div>
                  <p className="text-xs text-muted">第 {shownGen} 代 · {playing ? "推演中" : "已停"}</p>
                  <p className="text-2xl leading-tight font-semibold">{reading.hex.name}</p>
                </div>
              </div>
              <button
                type="button"
                className="absolute bottom-3 left-1/2 z-10 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-md bg-ink px-5 text-base font-medium text-bg"
                onClick={toggleRun}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                {playing ? "暂停" : "继续"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-bg"
                onClick={toggleRun}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                {playing ? "暂停" : "推演"}
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm"
                onClick={() => {
                  playingRef.current = false;
                  setPlaying(false);
                  stepMany(1);
                }}
              >
                <ChevronRight className="size-4" />
                步进
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-3 text-sm"
                onClick={() => resetTo(seed, rule, hand, seed !== "hand")}
              >
                <RotateCcw className="size-4" />
                复位
              </button>
              <div className="flex h-11 overflow-hidden rounded-md border border-line">
                {SPEEDS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cx(
                      "px-3 text-sm",
                      speed === item.id ? "bg-ink text-bg" : "text-muted",
                    )}
                    onClick={() => setSpeed(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={cx(
                  "inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm",
                  follow ? "border-cinnabar text-ink" : "border-line text-muted",
                )}
                onClick={() => {
                  followRef.current = true;
                  setFollow(true);
                  const rows = rowsRef.current;
                  const abs = droppedRef.current + rows.length - 1;
                  const next = interiorLens(rows[rows.length - 1] ?? new Uint8Array(), abs);
                  if (next !== null) {
                    lensRef.current = next;
                    setLens(next);
                  }
                }}
              >
                <Crosshair className="size-4" />
                追随前沿
              </button>
            </div>
            <p className="text-sm text-pretty text-muted">
              纸色是已经在场的阳，朱砂是这一代刚出生的阳，空白是阴。点按图面会立刻停下，并把六爻窗口移到那里。
            </p>
            <label className="flex flex-col gap-1 text-sm text-muted">
              <span className="flex items-center justify-between">
                <span>读卦窗口</span>
                <span className="font-mono tabular-nums text-ink">第 {lens} 列起</span>
              </span>
              <input
                type="range"
                min={0}
                max={COLS - 6}
                value={lens}
                aria-label="移动六爻窗口"
                onChange={(event) => {
                  playingRef.current = false;
                  followRef.current = false;
                  setPlaying(false);
                  setFollow(false);
                  const next = Number(event.target.value);
                  lensRef.current = next;
                  setLens(next);
                }}
              />
            </label>
          </div>

          <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
            <p className="sr-only" aria-live="polite">
              第 {shownGen} 代，本卦{reading.hex.name}，{changes} 爻将变，之卦{reading.nextHex.name}。
            </p>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">本卦 · {imageName(reading.hex)}</p>
                <h2 className="mt-1 text-4xl font-semibold text-balance">{reading.hex.name}</h2>
                <p className="font-mono text-sm text-muted">{reading.hex.pinyin}</p>
              </div>
              <div className="w-16 shrink-0 pt-1">
                <HexMark lines={reading.lines} changing={reading.changing} />
              </div>
            </div>
            <p className="text-sm text-muted">
              第 {reading.hex.king} 卦 · 下{TRIGRAMS[reading.hex.lower].name} · 上
              {TRIGRAMS[reading.hex.upper].name}
            </p>
            <p className="text-pretty leading-relaxed">{reading.hex.gloss}</p>
            <div className="grid grid-cols-6 gap-1">
              {LINE_NAMES.map((name, i) => (
                <div key={name} className="text-center">
                  <p className={cx("text-xs", reading.changing[i] ? "text-cinnabar" : "text-muted")}>
                    {name}
                  </p>
                  <div className="mt-1 px-0.5">
                    <YinYangLine on={reading.lines[i] === 1} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">{reading.changing[i] ? "变" : "静"}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
              <span className="text-muted">窗左 {reading.flankL ? "阳" : "阴"}</span>
              <span className="text-muted">
                {changes === 0 ? "此步六爻皆静" : `${changes} 爻将变`}
              </span>
              <span className="text-muted">窗右 {reading.flankR ? "阳" : "阴"}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 shrink-0">
                <HexMark lines={reading.nextLines} />
              </div>
              <div>
                <p className="text-xs text-muted">之卦</p>
                <p className="text-xl font-semibold">
                  {reading.nextHex.name}
                  <span className="ml-2 font-mono text-sm font-normal text-muted">
                    {reading.nextHex.pinyin}
                  </span>
                </p>
                <p className="text-sm text-muted">第 {reading.nextHex.king} 卦 · {imageName(reading.nextHex)}</p>
              </div>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-muted">
              之卦不由本卦单独决定。两端的爻还要看窗外那一格——规则的视力永远比卦象宽出邻居。
            </p>
          </article>
        </div>

        <section className="rounded-card border border-line bg-surface p-4" aria-label="初态与规则">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs text-muted">初爻</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SEEDS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={item.hint}
                    className={cx(
                      "h-11 rounded-md border px-3 text-sm",
                      seed === item.id ? "border-ink bg-ink text-bg" : "border-line text-ink",
                    )}
                    onClick={() => {
                      setSeed(item.id);
                      resetTo(item.id, rule, hand, item.id !== "hand");
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            {seed === "hand" ? (
              <div>
                <p className="text-sm text-pretty text-muted">
                  点按翻转阴阳。从左到右是初爻方向，写在带子的起始处。全阴会停在坤里——110 不从空无里无故生有。
                </p>
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {hand.map((bit, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-pressed={bit === 1}
                      aria-label={`第 ${index + 1} 位 ${bit ? "阳" : "阴"}`}
                      className={cx(
                        "flex h-11 items-center justify-center rounded-md border px-2",
                        bit ? "border-ink" : "border-line",
                      )}
                      onClick={() => {
                        const next = hand.slice();
                        next[index] = bit ? 0 : 1;
                        setHand(next);
                        setSeed("hand");
                        resetTo("hand", rule, next, false);
                      }}
                    >
                      <span className="w-full max-w-10">
                        <YinYangLine on={bit === 1} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-muted">二百五十六则</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cx(
                      "h-11 rounded-md border px-3 text-sm",
                      rule === item.id ? "border-ink bg-ink text-bg" : "border-line text-ink",
                    )}
                    onClick={() => onRule(item.id)}
                  >
                    {item.name}
                    <span className="ml-1 font-mono tabular-nums">{item.id}</span>
                  </button>
                ))}
              </div>
              <label className="mt-2 flex flex-col gap-1 text-sm text-muted">
                <span className="flex items-center justify-between">
                  <span>规则编号</span>
                  <span className="font-mono text-base text-ink tabular-nums">{rule}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={rule}
                  aria-label="选择元胞自动机规则"
                  onChange={(event) => onRule(Number(event.target.value))}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-line p-4" aria-labelledby="law-title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="law-title" className="text-xl font-semibold">
              八卦 · 规则的八种视力
            </h2>
            <p className="font-mono text-sm text-muted tabular-nums">
              {bits.join("")} · 生阳 {birthCount(rule)}/8 · {isSymmetric(rule) ? "左右对称" : "左右不对称"}
            </p>
          </div>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted">{verdictFor(rule)}</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {[7, 3, 5, 1, 6, 2, 4, 0].map((key) => {
              const tri = TRIGRAMS[key];
              const out = trigramOutput(rule, key);
              return (
                <li key={key} className="rounded-md border border-line bg-surface p-2">
                  <div className="mx-auto w-10">
                    <HexMark lines={tri.lines} />
                  </div>
                  <p className="mt-2 text-center text-sm">
                    {tri.name}
                    <span className="ml-1 text-muted">{tri.nature}</span>
                  </p>
                  <p className={cx("mt-1 text-center text-xs", out ? "text-cinnabar" : "text-muted")}>
                    {rule === 110 ? JUDGEMENT_110[key] : out ? "生阳" : "归阴"}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">字节去掉两端，读成一卦</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="w-12">
                  <HexMark lines={echoLines} />
                </div>
                <p className="text-pretty text-sm leading-relaxed">
                  <span className="font-semibold">{echoHex.name}</span>
                  <span className="text-muted"> · 第 {echoHex.king} 卦</span>
                  。两端的判决是 {bits[0] ? "阳" : "阴"} 与 {bits[7] ? "阳" : "阴"}。
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">编号 mod 64 的余数</p>
              <p className="mt-2 text-pretty text-sm leading-relaxed">
                {echoMod ? (
                  <>
                    <span className="font-mono tabular-nums">{rule}</span>
                    {" → 第 "}
                    {echoMod.king} 卦 <span className="font-semibold">{echoMod.name}</span>
                    。
                    {rule === 110 ? " 也就是 64 + 46。全集走完一圈，还余一个「升」。" : " 这只是编号的回声。"}
                  </>
                ) : (
                  "规则 0 没有余数。空号对上的是死寂，不是某一卦的荣耀。"
                )}
              </p>
              {rule === 110 ? (
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted">
                  形状落在履，余数落在升：不对称地踩，一步一步升高。读法是我们定的，巧合也是 110 最擅长制造的东西。
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section aria-label="这条窗口的前世">
          <h2 className="text-lg font-semibold">这条窗口的前世</h2>
          <p className="mt-1 text-sm text-muted">从现在往回数。点一卦，时空图会停在那一代。</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {history.map((item) => (
              <button
                key={item.abs}
                type="button"
                className={cx(
                  "flex h-20 w-16 shrink-0 flex-col items-center rounded-md border px-1.5 pt-2",
                  item.look === safeLook ? "border-cinnabar" : "border-line",
                )}
                onClick={() => {
                  playingRef.current = false;
                  setPlaying(false);
                  setLookback(item.look);
                }}
              >
                <span className="w-full">
                  <HexMark lines={item.lines} />
                </span>
                <span className="mt-1 text-xs">{item.name}</span>
              </button>
            ))}
          </div>
        </section>

        <p className="text-pretty text-sm text-muted">
          此刻窗口里的名字是「{reading.hex.name}」。若你把规则换成别的字节，同一条初爻会长成完全不同的世。
        </p>
        <Essay />
      </main>
    </div>
  );
}
