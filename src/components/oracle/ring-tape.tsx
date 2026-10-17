import { useEffect, useRef, type RefObject } from "react";
import { RING } from "@/lib/oracle/universe";

type Props = {
  /** rows[0] is generation `first`. Mutated in place while running. */
  rowsRef: RefObject<Uint8Array[]>;
  firstRef: RefObject<number>;
  /** Bumped every time the rows change so the canvas repaints. */
  tick: number;
  head: number;
  /** Generation of the 本卦 row; null while still running. */
  focusGen: number | null;
  className?: string;
};

function readCssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Spacetime diagram of the 256-cell ring, newest generation at the bottom. */
export function RingTape({ rowsRef, firstRef, tick, head, focusGen, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (cssW < 2 || cssH < 2) return;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      const cell = canvas.width / RING;
      const viewRows = Math.max(1, Math.floor(canvas.height / cell));
      const rows = rowsRef.current ?? [];
      const first = firstRef.current ?? 0;

      const yin = readCssColor("--color-bg", "#14110e");
      const paper = readCssColor("--color-ink", "#f3ecdf");
      const hot = readCssColor("--color-cinnabar", "#e23d32");

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = yin;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stopped: end the view one row below the 本卦 so the 之卦 row is visible.
      const lastIndex =
        focusGen === null ? rows.length - 1 : Math.min(rows.length - 1, focusGen + 1 - first);
      // Time flows down: fill from the top, then scroll once the view is full.
      const start = Math.max(0, lastIndex + 1 - viewRows);

      for (let r = start; r <= lastIndex; r++) {
        const row = rows[r];
        const prev = r > 0 ? rows[r - 1] : null;
        if (!row) continue;
        const y = (r - start) * cell;
        for (let c = 0; c < RING; c++) {
          if (!row[c]) continue;
          const born = !prev || !prev[c];
          ctx.fillStyle = born ? hot : paper;
          ctx.fillRect(c * cell, y, cell + 0.4, cell + 0.4);
        }
      }

      // The read head: six columns, possibly wrapping the ring.
      const bands: Array<[number, number]> = [];
      if (head + 6 <= RING) bands.push([head, 6]);
      else bands.push([head, RING - head], [0, head + 6 - RING]);
      ctx.fillStyle = "rgba(226, 61, 50, 0.14)";
      for (const [x, w] of bands) ctx.fillRect(x * cell, 0, w * cell, canvas.height);

      if (focusGen !== null) {
        const fr = focusGen - first;
        const lw = Math.max(1, Math.round(dpr));
        ctx.lineWidth = lw;
        for (const [x, w] of bands) {
          if (fr >= start && fr <= lastIndex) {
            ctx.strokeStyle = hot;
            ctx.setLineDash([]);
            ctx.strokeRect(x * cell + 0.5, (fr - start) * cell + 0.5, w * cell - 1, cell - 1);
          }
          if (fr + 1 >= start && fr + 1 <= lastIndex) {
            ctx.strokeStyle = paper;
            ctx.setLineDash([lw * 2, lw * 2]);
            ctx.strokeRect(x * cell + 0.5, (fr + 1 - start) * cell + 0.5, w * cell - 1, cell - 1);
            ctx.setLineDash([]);
          }
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [tick, head, focusGen, rowsRef, firstRef]);

  return (
    <div ref={wrapRef} className={className ?? "h-64 sm:h-80 lg:h-96"}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        role="img"
        aria-label="规则 110 在 256 格环上的时空图。横轴是细胞，纵轴向下是时间；朱砂带是读头所在的六格。"
      />
    </div>
  );
}
