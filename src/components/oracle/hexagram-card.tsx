import { TRIGRAMS, imageName, type Hexagram } from "@/lib/iching";
import { textOf } from "@/lib/oracle/texts";
import { HexMark } from "@/components/cosmos/hex-mark";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function HexagramCard({
  hex,
  lines,
  changing,
  label,
  size = "lg",
  className,
}: {
  hex: Hexagram;
  lines: readonly number[];
  changing?: readonly boolean[];
  label: string;
  size?: "lg" | "md";
  className?: string;
}) {
  const text = textOf(hex.king);
  const big = size === "lg";
  return (
    <div className={cx("flex items-start gap-4", className)}>
      <div className={cx("shrink-0", big ? "w-16" : "w-12")}>
        <HexMark lines={lines} changing={changing} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={cx("font-semibold leading-tight", big ? "text-4xl" : "text-2xl")}>
          {hex.name}
          <span
            className={cx("ml-2 font-mono font-normal text-muted", big ? "text-sm" : "text-xs")}
          >
            {hex.pinyin}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted">
          第 {hex.king} 卦 · {imageName(hex)} · {text.keyword}
        </p>
        {big ? (
          <p className="mt-1 text-xs text-muted">
            下{TRIGRAMS[hex.lower].name}
            {TRIGRAMS[hex.lower].nature} · 上{TRIGRAMS[hex.upper].name}
            {TRIGRAMS[hex.upper].nature}
          </p>
        ) : null}
      </div>
    </div>
  );
}
