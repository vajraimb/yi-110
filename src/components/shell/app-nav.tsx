import { Link } from "@tanstack/react-router";

const ITEMS = [
  { to: "/", label: "问卦" },
  { to: "/cosmos", label: "实验室" },
  { to: "/about", label: "方法" },
] as const;

export function AppNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-baseline gap-2 text-ink">
          <span className="text-lg font-semibold tracking-widest">一一〇</span>
          <span className="hidden font-mono text-[11px] tracking-wide text-muted sm:inline">
            RULE 110 · 六十四卦
          </span>
        </Link>
        <div className="flex gap-1">
          {ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted transition-colors hover:text-ink"
              activeProps={{
                className:
                  "inline-flex h-9 items-center rounded-md px-3 text-sm bg-surface text-ink",
              }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
