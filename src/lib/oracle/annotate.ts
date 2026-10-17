import { createServerFn } from "@tanstack/react-start";

/** What the 占断 card sends. Clipped on the server so a visitor cannot inflate the prompt. */
export type NoteRequest = {
  question: string;
  method: "ca" | "yarrow";
  gen: number | null;
  ben: string;
  zhi: string;
  changing: string;
  rule: string;
  passages: { title: string; text: string; primary: boolean }[];
  shadows: string;
  pillars: string;
  gloss: string;
};

export type NoteResult = { ok: true; text: string } | { ok: false; error: string };

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function parseRequest(input: unknown): NoteRequest {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const method = raw.method === "yarrow" ? "yarrow" : raw.method === "ca" ? "ca" : null;
  if (!method) throw new Error("缺了起卦之法");
  const passages = Array.isArray(raw.passages) ? raw.passages.slice(0, 8) : [];
  const gen = typeof raw.gen === "number" && Number.isFinite(raw.gen) ? Math.max(0, Math.min(4000, Math.floor(raw.gen))) : null;
  return {
    question: clip(raw.question, 280) || "没有写下具体的问题",
    method,
    gen,
    ben: clip(raw.ben, 8),
    zhi: clip(raw.zhi, 8),
    changing: clip(raw.changing, 80),
    rule: clip(raw.rule, 80),
    passages: passages.map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        title: clip(row.title, 40),
        text: clip(row.text, 220),
        primary: row.primary === true,
      };
    }),
    shadows: clip(raw.shadows, 80),
    pillars: clip(raw.pillars, 80),
    gloss: clip(raw.gloss, 240),
  };
}

function promptOf(note: NoteRequest): string {
  const lines = note.passages
    .map((p) => `${p.primary ? "主" : "辅"} · ${p.title}：${p.text}`)
    .join("\n");
  const how =
    note.method === "ca"
      ? `元胞规则 110，停在第 ${note.gen ?? 0} 代`
      : "大衍蓍草，六爻一次成";
  return [
    "你在给刚问完卦的人写注解。用白话，两段，每段两三句。",
    "不要装神，不要说这件事一定会成或一定不成，不要用标题、星号和列表。",
    "只根据下面给出的经文和卦象说话。经文里没有的情节不要编。",
    "第一段把所问的事和主经文说成人话。第二段说本卦怎样走到之卦，变爻意味着什么。",
    "",
    `所问：${note.question}`,
    `起卦：${how}`,
    note.pillars ? `四柱：${note.pillars}` : "四柱：未记",
    `本卦：${note.ben}`,
    `之卦：${note.zhi}`,
    `变爻：${note.changing || "无"}`,
    `占法：${note.rule}`,
    "所读经文：",
    lines || "（无）",
    `影子卦：${note.shadows}`,
    note.gloss ? `旁注，不是经文：${note.gloss}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const annotateCast = createServerFn({ method: "POST" })
  .validator(parseRequest)
  .handler(async ({ data }): Promise<NoteResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "这一环境没有接上注解。" };
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          model: "grok-4.20-0309-non-reasoning",
          max_tokens: 420,
          temperature: 0.6,
          messages: [{ role: "user", content: promptOf(data) }],
        }),
      });
      if (!res.ok) return { ok: false, error: `注解没有写成（${res.status}）。` };
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content?.replace(/\*\*/g, "").trim() ?? "";
      if (!text) return { ok: false, error: "注解是空的。" };
      return { ok: true, text: text.slice(0, 1200) };
    } catch {
      return { ok: false, error: "写得太久，没有送回来。可以再按一次。" };
    }
  });
