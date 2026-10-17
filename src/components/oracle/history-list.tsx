import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { HEX_BY_KING } from "@/lib/iching";
import { useHistory } from "@/lib/oracle/history";
import { useMounted } from "@/lib/use-mounted";
import { HexMark } from "@/components/cosmos/hex-mark";

export function HistoryList() {
  const mounted = useMounted();
  const entries = useHistory((s) => s.entries);
  const forget = useHistory((s) => s.forget);
  const clear = useHistory((s) => s.clear);

  if (!mounted || entries.length === 0) return null;

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id="history-title" className="text-lg font-semibold">
          卦历
        </h2>
        <button type="button" onClick={clear} className="text-xs text-muted hover:text-ink">
          清空
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
        {entries.map((e) => {
          const ben = HEX_BY_KING[e.benKing];
          const zhi = HEX_BY_KING[e.zhiKing];
          return (
            <li key={`${e.id}-${e.gen ?? ""}`} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-8 shrink-0">
                <HexMark lines={ben.lines} size="sm" />
              </div>
              <Link
                to="/cast/$id"
                params={{ id: e.id }}
                search={{ g: e.gen, q: e.question || undefined, t: Math.floor(e.at / 1000) }}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm">
                  <span className="font-semibold">{ben.name}</span>
                  {e.changes > 0 ? <span className="text-muted">之{zhi.name}</span> : null}
                  <span className="ml-2 text-muted">{e.question || "无题"}</span>
                </p>
                <p className="font-mono text-[11px] text-muted tabular-nums">
                  {format(e.at, "yyyy-MM-dd HH:mm")} ·{" "}
                  {e.method === "ca" ? `元胞 · 第 ${e.gen} 代` : "大衍"}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => forget(e.id, e.gen)}
                aria-label="删除这一卦"
                className="shrink-0 px-2 text-muted hover:text-ink"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
