import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { caCast, parseCastId, yarrowCast } from "@/lib/oracle/cast";
import { clampGen } from "@/lib/oracle/universe";
import { LiveCast } from "@/components/oracle/live-cast";
import { ReadingView } from "@/components/oracle/reading-view";

type CastSearch = { g?: number; q?: string };

export const Route = createFileRoute("/cast/$id")({
  validateSearch: (search: Record<string, unknown>): CastSearch => {
    const g =
      typeof search.g === "number"
        ? clampGen(search.g)
        : typeof search.g === "string"
          ? clampGen(Number(search.g))
          : undefined;
    const q =
      typeof search.q === "string" && search.q.trim() ? search.q.trim().slice(0, 280) : undefined;
    return { g, q };
  },
  component: CastPage,
});

function CastPage() {
  const { id } = Route.useParams();
  const { g, q } = Route.useSearch();
  const parsed = useMemo(() => parseCastId(id), [id]);

  const cast = useMemo(() => {
    if (!parsed) return null;
    if (parsed.method === "yarrow") return yarrowCast(parsed.values);
    if (g === undefined) return null;
    return caCast(parsed.seed, g);
  }, [parsed, g]);

  return (
    <>
      <div className="h-1 bg-cinnabar" />
      <main className="mx-auto flex max-w-6xl flex-col px-4 pt-6 pb-16">
        {!parsed ? (
          <NotACast />
        ) : cast ? (
          <ReadingView key={`${cast.id}-${g ?? ""}`} cast={cast} question={q} />
        ) : parsed.method === "ca" ? (
          <LiveCast key={parsed.seed.hex} seed={parsed.seed} question={q} />
        ) : null}
      </main>
    </>
  );
}

function NotACast() {
  return (
    <div className="flex flex-col gap-3 py-12">
      <p className="font-mono text-xs text-cinnabar">没有这一卦</p>
      <h1 className="text-2xl font-semibold">链接里的种子读不出来</h1>
      <p className="max-w-md text-pretty text-muted">
        元胞卦的链接带着 64 位十六进制的种子，大衍卦的链接以 y 开头、后接六个成数。这一条都不是。
      </p>
      <Link
        to="/"
        className="inline-flex h-11 w-fit items-center rounded-md bg-ink px-4 text-sm font-medium text-bg"
      >
        回去问一卦
      </Link>
    </div>
  );
}
