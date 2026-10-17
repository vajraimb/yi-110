import { ruleTable, type LineCause } from "@/lib/oracle/causes";
import { lineTitle } from "@/lib/oracle/texts";
import { HexMark } from "@/components/cosmos/hex-mark";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const SOURCE_HINT: Record<LineCause["source"], string> = {
  外左: "窗外一格与初、二",
  下卦: "初二三",
  互下: "二三四",
  互上: "三四五",
  上卦: "四五六",
  外右: "五、上与窗外一格",
};

/**
 * Each line of the 之卦 with the trigram that decided it. Rendered top-down
 * like a hexagram, 上 first.
 */
export function LineCauses({
  causes,
  benLines,
}: {
  causes: readonly LineCause[];
  benLines: readonly number[];
}) {
  const inner = causes.slice(1, 5);
  const summary = inner
    .map((c) => `${c.source}${c.trigram.name}生${c.produces ? "阳" : "阴"}`)
    .join("，");
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col divide-y divide-line">
        {[...causes].reverse().map((c) => (
          <li
            key={c.index}
            className="grid grid-cols-[3.25rem_2rem_1fr_auto] items-center gap-3 py-2 text-sm"
          >
            <span className={cx("text-xs", c.changes ? "text-cinnabar" : "text-muted")}>
              {lineTitle(c.index, benLines[c.index] === 1)}
            </span>
            <span className={cx("block", c.outside && "opacity-60")}>
              <HexMark lines={c.trigram.lines} size="sm" />
            </span>
            <span className="min-w-0">
              <span className={c.outside ? "text-muted" : "text-ink"}>{c.source}</span>
              <span className="text-muted">
                为{c.trigram.name} · {c.trigram.name}生{c.produces ? "阳" : "阴"}
              </span>
              <span className="ml-1 hidden text-xs text-muted sm:inline">
                （{SOURCE_HINT[c.source]}）
              </span>
            </span>
            <span
              className={cx(
                "font-mono text-xs tabular-nums",
                c.changes ? "text-cinnabar" : "text-muted",
              )}
            >
              本{c.was ? "阳" : "阴"} · {c.changes ? "变" : "静"}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-pretty leading-relaxed text-muted">
        之卦的二至五爻完全由本卦自身决定：{summary}
        。初爻和上爻各要看窗外一格——初上无位，受外界之变。
      </p>
    </div>
  );
}

/** Rule 110 written as what each trigram produces under its centre. */
export function RuleTable({ compact }: { compact?: boolean }) {
  return (
    <ul className={cx("grid grid-cols-8 gap-1", compact ? "max-w-xs" : "max-w-md")}>
      {ruleTable().map(({ trigram, out }) => (
        <li key={trigram.key} className="flex flex-col items-center gap-1 text-center">
          <span className="block w-full px-1">
            <HexMark lines={trigram.lines} size="sm" />
          </span>
          <span className="text-xs">{trigram.name}</span>
          <span className={cx("font-mono text-[11px]", out ? "text-ink" : "text-muted")}>
            {out ? "阳" : "阴"}
          </span>
        </li>
      ))}
    </ul>
  );
}
