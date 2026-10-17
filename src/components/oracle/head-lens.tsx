import { LINE_NAMES } from "@/lib/iching";
import { RING } from "@/lib/oracle/universe";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * The read head magnified: the six window cells plus one neighbour on each
 * side, for the 本卦 row and the 之卦 row beneath it. The neighbours matter —
 * the end lines of the window change because of cells outside it.
 */
export function HeadLens({
  benRow,
  zhiRow,
  head,
  changing,
}: {
  benRow: Uint8Array;
  zhiRow: Uint8Array | null;
  head: number;
  changing?: readonly boolean[];
}) {
  const cols = Array.from({ length: 8 }, (_, i) => (head - 1 + i + RING) % RING);
  return (
    <div className="grid grid-cols-8 gap-1 font-mono text-[10px] text-muted">
      {cols.map((c, i) => (
        <div key={`h${c}`} className="text-center">
          {i === 0 || i === 7 ? "邻" : LINE_NAMES[i - 1]}
        </div>
      ))}
      {cols.map((c, i) => (
        <Cell key={`b${c}`} on={benRow[c] === 1} outside={i === 0 || i === 7} />
      ))}
      {zhiRow
        ? cols.map((c, i) => (
            <Cell
              key={`z${c}`}
              on={zhiRow[c] === 1}
              outside={i === 0 || i === 7}
              hot={i > 0 && i < 7 ? Boolean(changing?.[i - 1]) : false}
            />
          ))
        : null}
    </div>
  );
}

function Cell({ on, outside, hot }: { on: boolean; outside: boolean; hot?: boolean }) {
  return (
    <span
      className={cx(
        "block aspect-square rounded-sm border",
        on
          ? hot
            ? "border-cinnabar bg-cinnabar"
            : "border-ink bg-ink"
          : hot
            ? "border-cinnabar"
            : "border-line",
        outside && "opacity-40",
      )}
      aria-hidden
    />
  );
}
