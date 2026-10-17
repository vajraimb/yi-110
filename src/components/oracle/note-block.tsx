import { useEffect, useState } from "react";
import { annotateCast, type NoteRequest } from "@/lib/oracle/annotate";
import { fourPillars } from "@/lib/oracle/ganzhi";
import type { Cast } from "@/lib/oracle/cast";
import { lineTitle } from "@/lib/oracle/texts";
import { useMounted } from "@/lib/use-mounted";

function cacheKey(cast: Cast, question: string): string {
  const gen = cast.method === "ca" ? String(cast.gen) : "y";
  return `yi110-note:${cast.id}:${gen}:${question}`;
}

function requestOf(cast: Cast, question: string, at?: number): NoteRequest {
  const changing = cast.changing
    .map((on, i) => (on ? lineTitle(i, cast.benLines[i] === 1) : ""))
    .filter(Boolean)
    .join("、");
  let pillars = "";
  if (at) {
    const p = fourPillars(new Date(at * 1000));
    pillars = `${p.year.text}年 ${p.month.text}月 ${p.day.text}日 ${p.hour.text}时`;
  }
  return {
    question,
    method: cast.method,
    gen: cast.method === "ca" ? cast.gen : null,
    ben: cast.ben.name,
    zhi: cast.zhi.name,
    changing,
    rule: cast.reading.rule,
    passages: cast.reading.passages.map((p) => ({
      title: p.title,
      text: p.text,
      primary: p.primary,
    })),
    shadows: `互${cast.relations.nuclear.name}、错${cast.relations.opposite.name}、综${cast.relations.reverse.name}`,
    pillars,
    gloss: `${cast.ben.name}：${cast.ben.gloss} ${cast.zhi.name}：${cast.zhi.gloss}`,
  };
}

export function NoteBlock({
  cast,
  question,
  at,
}: {
  cast: Cast;
  question?: string;
  at?: number;
}) {
  const mounted = useMounted();
  const asked = question?.trim() ?? "";
  const key = cacheKey(cast, asked);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem(key);
    setText(saved);
    setError("");
  }, [mounted, key]);

  async function write() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await annotateCast({ data: requestOf(cast, asked || "没有写下具体的问题", at) });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      localStorage.setItem(key, result.text);
      setText(result.text);
    } catch {
      setError("注解没有送回来。");
    } finally {
      setBusy(false);
    }
  }

  const paragraphs = text?.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) ?? [];

  return (
    <div className="mt-6 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-xs text-muted">注解</p>
        {text ? <p className="text-xs text-muted">这一段是注解，不是占断。</p> : null}
      </div>
      {paragraphs.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-pretty text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-pretty text-muted">
          把你的问题、这一卦的经文和变爻交给模型，写成一段能读的白话。只有按下才会问一次；同一卦再打开，用的是记下的那一段。
        </p>
      )}
      {error ? <p className="mt-3 text-sm text-cinnabar">{error}</p> : null}
      <button
        type="button"
        className="mt-4 inline-flex h-11 items-center rounded-md border border-line px-4 text-sm text-ink hover:border-ink disabled:opacity-50"
        disabled={busy}
        onClick={() => void write()}
      >
        {busy ? "正在写" : text ? "再写一次" : "生成注解"}
      </button>
    </div>
  );
}
