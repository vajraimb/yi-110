import { HEX_BY_KEY, TRIGRAMS } from "@/lib/iching";
import { FUXI_GRID, XIANTIAN } from "@/lib/oracle/fuxi";
import { linesOfKey } from "@/lib/oracle/universe";
import { HexMark } from "@/components/cosmos/hex-mark";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * 先天六十四卦方图：the full state space of the read head. Rows are the upper
 * trigram, columns the lower, both in 乾兑离震巽坎艮坤 order.
 */
export function FuxiGrid({
  benKey,
  zhiKey,
  nuclearKey,
}: {
  benKey: number;
  zhiKey: number;
  nuclearKey?: number;
}) {
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[1.25rem_repeat(8,minmax(0,1fr))] gap-1">
        <span />
        {XIANTIAN.map((t) => (
          <span key={`c${t}`} className="text-center text-[11px] text-muted">
            {TRIGRAMS[t].name}
          </span>
        ))}
        {XIANTIAN.map((upper, row) => (
          <Row
            key={`r${upper}`}
            upper={upper}
            row={row}
            benKey={benKey}
            zhiKey={zhiKey}
            nuclearKey={nuclearKey}
          />
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        <span>
          <i className="mr-1 inline-block size-2 bg-cinnabar align-middle" aria-hidden />
          本卦
        </span>
        <span>
          <i className="mr-1 inline-block size-2 border border-ink align-middle" aria-hidden />
          之卦
        </span>
        {nuclearKey !== undefined ? (
          <span>
            <i
              className="mr-1 inline-block size-2 border border-dashed border-muted align-middle"
              aria-hidden
            />
            互卦
          </span>
        ) : null}
        <span>行是上卦，列是下卦，先天序</span>
      </p>
    </div>
  );
}

function Row({
  upper,
  row,
  benKey,
  zhiKey,
  nuclearKey,
}: {
  upper: number;
  row: number;
  benKey: number;
  zhiKey: number;
  nuclearKey?: number;
}) {
  return (
    <>
      <span className="flex items-center justify-center text-[11px] text-muted">
        {TRIGRAMS[upper].name}
      </span>
      {FUXI_GRID.slice(row * 8, row * 8 + 8).map((cell) => {
        const hex = HEX_BY_KEY[cell.key];
        const isBen = cell.key === benKey;
        const isZhi = cell.key === zhiKey;
        const isNuclear = nuclearKey === cell.key;
        return (
          <div
            key={cell.key}
            title={`${hex.king} ${hex.name}`}
            className={cx(
              // Explicit heights: aspect-ratio items inside a flex column collapse the parent on iOS Safari.
              "flex h-9 flex-col items-center justify-center gap-0.5 rounded-sm border p-0.5 sm:h-14 sm:p-1",
              isBen
                ? "border-cinnabar bg-cinnabar/20"
                : isZhi
                  ? "border-ink bg-surface"
                  : isNuclear
                    ? "border-dashed border-muted"
                    : "border-line/60",
            )}
          >
            <span className="w-full max-w-5">
              <HexMark
                size="sm"
                lines={linesOfKey(cell.key)}
                className={isBen || isZhi ? "" : "opacity-50"}
              />
            </span>
            <span
              className={cx(
                "hidden text-[10px] leading-none sm:block",
                isBen || isZhi ? "text-ink" : "text-muted",
              )}
            >
              {hex.name}
            </span>
          </div>
        );
      })}
    </>
  );
}
