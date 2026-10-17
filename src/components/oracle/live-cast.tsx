import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HEX_BY_KEY } from "@/lib/iching";
import {
  initialRing,
  keyOfLines,
  MAX_GEN,
  readHead,
  stepRing,
  type Seed,
} from "@/lib/oracle/universe";
import { HexMark } from "@/components/cosmos/hex-mark";
import { HeadLens } from "./head-lens";
import { RingTape } from "./ring-tape";

const KEEP = 320;
const INTERVAL_MS = 110;

/**
 * The cast in progress. The ring runs under Rule 110 until the asker stops
 * it; stopping writes the generation into the URL, which is the whole cast.
 */
export function LiveCast({ seed, question }: { seed: Seed; question?: string }) {
  const navigate = useNavigate();
  const rowsRef = useRef<Uint8Array[]>([initialRing(seed)]);
  const firstRef = useRef(0);
  const genRef = useRef(0);
  const stoppedRef = useRef(false);
  const [tick, setTick] = useState(0);
  const [gen, setGen] = useState(0);
  const [liveKey, setLiveKey] = useState(() => keyOfLines(readHead(rowsRef.current[0], seed.head)));

  const stop = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    void navigate({
      to: "/cast/$id",
      params: { id: seed.hex },
      search: { g: genRef.current, q: question || undefined },
      replace: true,
    });
  }, [navigate, seed.hex, question]);

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
      setLiveKey(keyOfLines(readHead(rows[rows.length - 1], seed.head)));
      setTick((t) => t + 1);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [seed.head, stop]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        event.preventDefault();
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  const live = HEX_BY_KEY[liveKey];
  const lines = [0, 1, 2, 3, 4, 5].map((i) => (liveKey >> i) & 1);
  const lastRow = rowsRef.current[rowsRef.current.length - 1];

  return (
    <div className="flex flex-col gap-4 pb-24 sm:pb-0">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-xs tracking-wide text-cinnabar">
          推演中 · 规则 110 · 256 格环
        </p>
        {question ? (
          <h1 className="text-2xl font-semibold text-balance sm:text-3xl">「{question}」</h1>
        ) : (
          <h1 className="text-2xl font-semibold sm:text-3xl">无题之问</h1>
        )}
        <p className="text-sm text-pretty text-muted">
          问题已成为初态。读头下的六格每一代都在改写名字。觉得是时候了，就停住。
        </p>
      </header>

      <div className="relative overflow-hidden rounded-card border border-line bg-bg">
        <RingTape
          rowsRef={rowsRef}
          firstRef={firstRef}
          tick={tick}
          head={seed.head}
          focusGen={null}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-line bg-bg/90 px-3 py-2">
          <div className="w-10">
            <HexMark lines={lines} />
          </div>
          <div>
            <p className="font-mono text-xs text-muted tabular-nums">第 {gen} 代</p>
            <p className="text-2xl leading-tight font-semibold">{live.name}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="max-w-xs">
          <p className="mb-1 text-xs text-muted">读头 · 第 {seed.head} 格起</p>
          <HeadLens benRow={lastRow} zhiRow={null} head={seed.head} />
        </div>
        <button
          type="button"
          onClick={stop}
          className="hidden h-14 items-center justify-center rounded-md bg-cinnabar px-10 text-lg font-medium text-ink hover:bg-cinnabar/90 sm:inline-flex"
        >
          停住
        </button>
      </div>
      <p className="hidden text-xs text-muted sm:block">也可以按空格。</p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={stop}
          className="inline-flex h-14 w-full items-center justify-center rounded-md bg-cinnabar text-lg font-medium text-ink"
        >
          停住 · 第 {gen} 代
        </button>
      </div>
    </div>
  );
}
