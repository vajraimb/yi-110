import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { yarrowId } from "@/lib/oracle/cast";
import { seedFromQuestion } from "@/lib/oracle/universe";
import { castYi } from "@/lib/yarrow";
import type { CastMethod } from "@/lib/oracle/cast";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const METHODS: readonly { id: CastMethod; name: string; hint: string }[] = [
  {
    id: "ca",
    name: "元胞",
    hint: "问题与此刻被哈希成 256 个细胞，规则 110 推演。你停住时读头所在的六格，就是卦。",
  },
  {
    id: "yarrow",
    name: "大衍",
    hint: "依《系辞》大衍之数的成数：老阴一、少阳五、少阴七、老阳三，十六分之。",
  },
];

export function AskForm() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [method, setMethod] = useState<CastMethod>("ca");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = question.trim();
    const at = new Date();
    const t = Math.floor(at.getTime() / 1000);
    if (method === "ca") {
      const seed = seedFromQuestion(q, at);
      void navigate({
        to: "/cast/$id",
        params: { id: seed.hex },
        search: { q: q || undefined, g: undefined, t },
      });
    } else {
      const yi = castYi(() => {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] / 4294967296;
      });
      void navigate({
        to: "/cast/$id",
        params: { id: yarrowId(yi.lines) },
        search: { q: q || undefined, g: undefined, t },
      });
    }
  };

  const current = METHODS.find((m) => m.id === method) ?? METHODS[0];

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 sm:p-6"
    >
      <label className="flex flex-col gap-2">
        <span className="text-xs tracking-wide text-cinnabar">所问何事</span>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          maxLength={280}
          placeholder="把问题写清楚。它会连同此刻一起，成为这个宇宙的初态。"
          className="w-full resize-none rounded-md border border-line bg-bg px-3 py-2.5 text-base leading-relaxed text-ink placeholder:text-muted/70 focus:border-cinnabar focus:outline-none"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") submit(event);
          }}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">起卦之法</span>
        <div className="flex gap-2" role="radiogroup" aria-label="起卦之法">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              onClick={() => setMethod(m.id)}
              className={cx(
                "inline-flex h-10 items-center rounded-md border px-4 text-sm",
                method === m.id
                  ? "border-ink bg-ink text-bg"
                  : "border-line text-muted hover:text-ink",
              )}
            >
              {m.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-pretty leading-relaxed text-muted">{current.hint}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex h-12 items-center rounded-md bg-cinnabar px-6 text-base font-medium text-ink transition-colors hover:bg-cinnabar/90"
        >
          {method === "ca" ? "起卦 · 开始推演" : "起卦"}
        </button>
        <span className="text-xs text-muted">
          {method === "ca" ? "推演开始后，由你决定何时停住。" : "六爻一次成，立即得卦。"}
        </span>
      </div>
    </form>
  );
}
