import { useMemo } from "react";
import { HOUR_RANGES, fourPillars, type Pillar } from "@/lib/oracle/ganzhi";
import { useMounted } from "@/lib/use-mounted";

/**
 * The cast's moment in 四柱干支, computed in the viewer's local time after
 * hydration (the server has no idea what time zone the asker was in).
 */
export function MomentCard({ at }: { at?: number }) {
  const mounted = useMounted();
  const pillars = useMemo(
    () => (mounted && at ? fourPillars(new Date(at * 1000)) : null),
    [mounted, at],
  );

  if (!at) {
    return (
      <div>
        <p className="text-xs text-muted">起卦之时</p>
        <p className="mt-1 text-sm text-pretty text-muted">
          这一卦的链接里没有记录时间，干支从略。
        </p>
      </div>
    );
  }
  if (!pillars) {
    return (
      <div>
        <p className="text-xs text-muted">起卦之时</p>
        <p className="mt-1 font-mono text-sm text-muted">……</p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-muted">起卦之时 · 四柱</p>
        <p className="font-mono text-[11px] text-muted tabular-nums">{pillars.local}</p>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        <PillarCell label="年" pillar={pillars.year} />
        <PillarCell label="月" pillar={pillars.month} />
        <PillarCell label="日" pillar={pillars.day} />
        <PillarCell label="时" pillar={pillars.hour} />
      </div>
      <p className="mt-2 text-xs text-pretty text-muted">
        {pillars.term}后，{pillars.month.text}月。{pillars.hour.text}时，
        {HOUR_RANGES[pillars.hour.branch]}
        点。年以立春为界，节气按日近似；二十三点起算次日子时。
      </p>
    </div>
  );
}

function PillarCell({ label, pillar }: { label: string; pillar: Pillar }) {
  return (
    <div className="rounded-md border border-line px-2 py-2 text-center">
      <p className="text-[11px] text-muted">{label}柱</p>
      <p className="mt-0.5 text-xl font-semibold tracking-widest">{pillar.text}</p>
    </div>
  );
}
