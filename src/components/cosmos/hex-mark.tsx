function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function HexMark({
  lines,
  changing,
  className,
  size = "md",
}: {
  lines: readonly number[];
  changing?: readonly boolean[];
  className?: string;
  size?: "md" | "sm";
}) {
  const bar = size === "sm" ? "h-0.5" : "h-1.5";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";
  const split = size === "sm" ? "gap-1" : "gap-1.5";
  return (
    <div className={cx("flex w-full flex-col-reverse", gap, className)} aria-hidden>
      {lines.map((bit, i) => {
        const tone = changing?.[i] ? "bg-cinnabar" : "bg-ink";
        if (bit) {
          return <span key={i} className={cx("w-full", bar, tone)} />;
        }
        return (
          <span key={i} className={cx("flex w-full", bar, split)}>
            <span className={cx("h-full flex-1", tone)} />
            <span className={cx("h-full flex-1", tone)} />
          </span>
        );
      })}
    </div>
  );
}

export function YinYangLine({ on }: { on: boolean }) {
  if (on) return <span className="block h-1.5 w-full bg-ink" />;
  return (
    <span className="flex h-1.5 w-full gap-1">
      <span className="h-full flex-1 bg-ink" />
      <span className="h-full flex-1 bg-ink" />
    </span>
  );
}
