import { PHASE_LABEL, type EtherStats } from "@/lib/oracle/ether";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * How settled the ring is: the share that has become Rule 110's periodic
 * background, how many structures remain, and whether the head sits on one.
 */
export function PhaseMeter({ stats, compact }: { stats: EtherStats; compact?: boolean }) {
  const pct = Math.round(stats.share * 100);
  const label = PHASE_LABEL[stats.phase];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted">宇宙的阶段</p>
        <p className="font-mono text-[11px] text-muted tabular-nums">
          以太 {pct}% · {stats.structures} 处结构
        </p>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden>
        <div
          className="absolute inset-y-0 left-0 bg-ink/70 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-y-0 left-[30%] w-px bg-bg" />
        <span className="absolute inset-y-0 left-[85%] w-px bg-bg" />
      </div>
      <p className="text-sm">
        <span
          className={cx("font-semibold", stats.phase === "forming" ? "text-cinnabar" : "text-ink")}
        >
          {label.name}
        </span>
        <span className="ml-2 text-muted">
          {stats.headOnEther ? "读头在背景里" : "读头压着一个结构"}
        </span>
      </p>
      {compact ? null : (
        <p className="text-sm text-pretty leading-relaxed text-muted">{label.hint}</p>
      )}
    </div>
  );
}
