function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function HexMark({
  lines,
  changing,
  className,
}: {
  lines: readonly number[];
  changing?: readonly boolean[];
  className?: string;
}) {
  return (
    <div className={cx("flex w-full flex-col-reverse gap-1", className)} aria-hidden>
      {lines.map((bit, i) => {
        const tone = changing?.[i] ? "bg-cinnabar" : "bg-ink";
        if (bit) {
          return <span key={i} className={cx("h-1.5 w-full", tone)} />;
        }
        return (
          <span key={i} className="flex h-1.5 w-full gap-1.5">
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
