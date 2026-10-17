import { useEffect, useRef, type RefObject } from "react";
import { COLS } from "@/lib/ca";

type Props = {
  rowsRef: RefObject<Uint8Array[]>;
  gen: number;
  lens: number;
  lookback: number;
  onPick: (col: number) => void;
};

type View = {
  cam: number;
  viewCols: number;
  cell: number;
  width: number;
};

export function Spacetime({ rowsRef, gen, lens, lookback, onPick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View>({ cam: 0, viewCols: 1, cell: 1, width: 1 });

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
      const cell = Math.max(2, Math.floor(dpr * (cssW < 640 ? 3 : 4)));
      const viewCols = Math.max(1, Math.floor(canvas.width / cell));
      const viewRows = Math.max(1, Math.floor(canvas.height / cell));
      const rows = rowsRef.current ?? [];
      let cam = lens - Math.floor(viewCols * 0.28);
      if (cam < 0) cam = 0;
      if (cam > COLS - viewCols) cam = Math.max(0, COLS - viewCols);
      viewRef.current = { cam, viewCols, cell, width: canvas.width };

      const style = getComputedStyle(document.documentElement);
      const yin = style.getPropertyValue("--color-bg").trim() || "#14110e";
      const paper = style.getPropertyValue("--color-ink").trim() || "#f3ecdf";
      const hot = style.getPropertyValue("--color-cinnabar").trim() || "#e23d32";

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = yin;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const start = Math.max(0, rows.length - viewRows);
      for (let r = start; r < rows.length; r++) {
        const y = (r - start) * cell;
        const row = rows[r];
        const prev = r > 0 ? rows[r - 1] : null;
        for (let c = 0; c < viewCols; c++) {
          const xcol = cam + c;
          if (xcol < 0 || xcol >= row.length || !row[xcol]) continue;
          const born = !prev || !prev[xcol];
          ctx.fillStyle = born ? hot : paper;
          ctx.fillRect(c * cell, y, cell, cell);
        }
      }

      const bandX = (lens - cam) * cell;
      const bandW = 6 * cell;
      if (bandX < canvas.width && bandX + bandW > 0) {
        ctx.fillStyle = "rgba(243, 236, 223, 0.07)";
        ctx.fillRect(bandX, 0, bandW, viewRows * cell);
        const focus = Math.max(0, rows.length - 1 - lookback);
        if (focus >= start && focus < rows.length) {
          const y = (focus - start) * cell;
          ctx.strokeStyle = hot;
          ctx.lineWidth = Math.max(1, Math.round(dpr));
          ctx.strokeRect(bandX + 0.5, y + 0.5, bandW - 1, cell - 1);
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [gen, lens, lookback, rowsRef]);

  return (
    <div ref={wrapRef} className="stage relative overflow-hidden rounded-card border border-line bg-bg">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        role="img"
        aria-label="规则 110 的时空图。横轴是爻，纵轴向下是时间。朱砂是这一代新出生的阳。"
        onPointerDown={(event) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const view = viewRef.current;
          const x = ((event.clientX - rect.left) / rect.width) * view.width;
          const col = view.cam + Math.floor(x / view.cell);
          onPick(col);
        }}
      />
    </div>
  );
}
