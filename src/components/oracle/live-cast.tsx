import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HEX_BY_KEY } from "@/lib/iching";
import { PHASE_LABEL, etherStats, type EtherStats } from "@/lib/oracle/ether";
import {
  initialRing,
  keyOfLines,
  MAX_GEN,
  readHead,
  RING,
  stepRing,
  type Seed,
} from "@/lib/oracle/universe";
import { HexMark } from "@/components/cosmos/hex-mark";
import { HeadLens } from "./head-lens";
import { PhaseMeter } from "./phase-meter";
import { RingTape } from "./ring-tape";

const KEEP = 320;
const INTERVAL_MS = 110;

/**
 * The cast in progress, in two moves. 时: the ring runs under Rule 110 until
 * the asker stops it. 位: on the frozen tape the asker taps where the 初爻
 * should sit, or keeps the head the digest chose. Both go into the URL,
 * which is the whole cast.
 */
export function LiveCast({ seed, question, at }: { seed: Seed; question?: string; at?: number }) {
  const navigate = useNavigate();
  const rowsRef = useRef<Uint8Array[]>([initialRing(seed)]);
  const firstRef = useRef(0);
  const genRef = useRef(0);
  const stoppedRef = useRef(false);
  const [tick, setTick] = useState(0);
  const [gen, setGen] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [stats, setStats] = useState<EtherStats>(() => etherStats(rowsRef.current[0], seed.head));

  const head = pick ?? seed.head;

  const stop = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    // One more row so the 之卦 can be previewed while placing.
    const rows = rowsRef.current;
    rows.push(stepRing(rows[rows.length - 1]));
    if (rows.length > KEEP) {
      rows.shift();
      firstRef.current += 1;
    }
    setPlacing(true);
    setTick((t) => t + 1);
  }, []);

  const confirm = useCallback(() => {
    void navigate({
      to: "/cast/$id",
      params: { id: seed.hex },
      search: {
        g: genRef.current,
        q: question || undefined,
        t: at,
        h: pick !== null && pick !== seed.head ? pick : undefined,
      },
      replace: true,
    });
  }, [navigate, seed.hex, seed.head, question, at, pick]);

  // A tap inside the current window keeps it: a finger cannot aim at one
  // 4px cell, and shifting six cells by even one makes a different hexagram.
  const place = useCallback(
    (col: number) => {
      const current = pick ?? seed.head;
      const offset = (((col - current) % RING) + RING) % RING;
      if (offset < 6) return;
      setPick(col);
    },
    [pick, seed.head],
  );

  const nudge = useCallback(
    (delta: number) => setPick((p) => ((((p ?? seed.head) + delta) % RING) + RING) % RING),
    [seed.head],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (stoppedRef.current) return;
      if (genRef.current >= MAX_GEN) {
        stop();
        return;
      }
      const rows = rowsRef.current;
      rows.push(stepRing(rows[rows.length - 1]));
      if (rows.length > KEEP) {
        rows.shift();
        firstRef.current += 1;
      }
      genRef.current += 1;
      setGen(genRef.current);
      setStats(etherStats(rows[rows.length - 1], seed.head));
      setTick((t) => t + 1);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [seed.head, stop]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (placing) confirm();
        else stop();
      } else if (placing && event.key === "ArrowLeft") {
        event.preventDefault();
        nudge(-1);
      } else if (placing && event.key === "ArrowRight") {
        event.preventDefault();
        nudge(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placing, stop, confirm, nudge]);

  const rows = rowsRef.current;
  const benRow = placing ? rows[gen - firstRef.current] : rows[rows.length - 1];
  const zhiRow = placing ? (rows[gen + 1 - firstRef.current] ?? null) : null;
  const benLines = readHead(benRow, head);
  const live = HEX_BY_KEY[keyOfLines(benLines)];
  const zhiLines = zhiRow ? readHead(zhiRow, head) : null;
  const changing = zhiLines ? benLines.map((b, i) => b !== zhiLines[i]) : undefined;
  const zhi = zhiLines ? HEX_BY_KEY[keyOfLines(zhiLines)] : null;
  const moved = changing ? changing.filter(Boolean).length : 0;

  return (
    <div className="flex flex-col gap-4 pb-28 sm:pb-0">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-xs tracking-wide text-cinnabar">
          {placing ? `停于第 ${gen} 代 · 定位` : "推演中 · 规则 110 · 256 格环"}
        </p>
        {question ? (
          <h1 className="text-2xl font-semibold text-balance sm:text-3xl">「{question}」</h1>
        ) : (
          <h1 className="text-2xl font-semibold sm:text-3xl">无题之问</h1>
        )}
        <p className="text-sm text-pretty text-muted">
          {placing
            ? "时已定，再定位。点带子上别处，点中的格子就是初爻；点在读头上不动；要挪一两格用箭头。不点，就用散列定下的读头。"
            : "问题已成为初态。读头下的六格每一代都在改写名字。觉得是时候了，就停住。"}
        </p>
      </header>

      <div className="relative overflow-hidden rounded-card border border-line bg-bg">
        <RingTape
          rowsRef={rowsRef}
          firstRef={firstRef}
          tick={tick}
          head={head}
          camHead={seed.head}
          focusGen={placing ? gen : null}
          onPick={placing ? place : undefined}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-line bg-bg/90 px-3 py-2">
          <div className="w-10">
            <HexMark lines={benLines} changing={changing} />
          </div>
          <div>
            <p className="font-mono text-xs text-muted tabular-nums">
              {placing ? `初爻在第 ${head} 格` : `第 ${gen} 代`}
            </p>
            <p className="text-2xl leading-tight font-semibold">
              {live.name}
              {zhi && moved > 0 ? <span className="text-muted">之{zhi.name}</span> : null}
            </p>
          </div>
        </div>
      </div>

      {placing ? (
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="flex flex-col gap-3">
            <div className="max-w-xs">
              <p className="mb-1 text-xs text-muted">
                读头放大 · 第 {head} 格起，含两侧邻居
                {pick !== null && pick !== seed.head ? "" : " · 散列所定"}
              </p>
              <HeadLens benRow={benRow} zhiRow={zhiRow} head={head} changing={changing} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => nudge(-1)}
                aria-label="读头左移一格"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-muted hover:text-ink"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => nudge(1)}
                aria-label="读头右移一格"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-muted hover:text-ink"
              >
                <ChevronRight className="size-4" />
              </button>
              {pick !== null && pick !== seed.head ? (
                <button
                  type="button"
                  onClick={() => setPick(null)}
                  className="inline-flex h-10 items-center rounded-md border border-line px-3 text-sm text-muted hover:text-ink"
                >
                  回到散列的读头
                </button>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={confirm}
            className="hidden h-14 items-center justify-center rounded-md bg-cinnabar px-10 text-lg font-medium text-ink hover:bg-cinnabar/90 sm:inline-flex"
          >
            就此成卦
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex flex-col gap-3">
            <PhaseMeter stats={stats} />
            <div className="max-w-xs">
              <p className="mb-1 text-xs text-muted">读头 · 第 {seed.head} 格起</p>
              <HeadLens benRow={benRow} zhiRow={null} head={seed.head} />
            </div>
          </div>
          <button
            type="button"
            onClick={stop}
            className="hidden h-14 items-center justify-center rounded-md bg-cinnabar px-10 text-lg font-medium text-ink hover:bg-cinnabar/90 sm:inline-flex"
          >
            停住
          </button>
        </div>
      )}
      <p className="hidden text-xs text-muted sm:block">
        {placing ? "空格成卦，左右方向键移动读头。" : "也可以按空格。"}
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:hidden">
        <p className="mb-2 text-center font-mono text-[11px] text-muted tabular-nums">
          {placing
            ? `第 ${gen} 代 · 初爻在第 ${head} 格 · 点带子别处可换`
            : `${PHASE_LABEL[stats.phase].name} · 以太 ${Math.round(stats.share * 100)}% · ${stats.structures} 处结构`}
        </p>
        {placing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="读头左移一格"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-line text-ink"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={confirm}
              className="inline-flex h-14 flex-1 items-center justify-center rounded-md bg-cinnabar text-lg font-medium text-ink"
            >
              就此成卦 · {live.name}
              {zhi && moved > 0 ? `之${zhi.name}` : ""}
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="读头右移一格"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-line text-ink"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-14 w-full items-center justify-center rounded-md bg-cinnabar text-lg font-medium text-ink"
          >
            停住 · 第 {gen} 代
          </button>
        )}
      </div>
    </div>
  );
}
