import { useEffect, useRef, useState, type RefObject } from "react";
import { HexMark, YinYangLine } from "@/components/cosmos/hex-mark";
import { LINE_NAMES, TRIGRAMS, hexFromLines } from "@/lib/iching";
import {
  ACCEPTANCE,
  FAMILY_SHA256,
  paintBackground,
  paintTape,
  readWindow,
  RING_TABLE_SHA256,
  ruleForZhi,
  safeSteps,
  stepTape,
  temperamentLabel,
  temperamentOf,
  windowOrigin,
  yangCount,
  type BackgroundId,
} from "@/lib/rule-map";
import { castYi, lineChanges, lineLabel, lineYang, type YiState } from "@/lib/yarrow";

const WIDTHS = [126, 252] as const;

function bitsOf(key: number): number[] {
  return [0, 1, 2, 3, 4, 5].map((i) => (key >> i) & 1);
}

function clockRelation(gen: number, clock: number): string {
  if (gen === clock) return "正落在蓍数参照上";
  if (gen < clock) return `早于参照 ${clock - gen} 代`;
  return `晚于参照 ${gen - clock} 代`;
}

function cx(...parts: Array<string | false>): string {
  return parts.filter(Boolean).join(" ");
}

export function CastView() {
  const [yi, setYi] = useState<YiState | null>(null);
  const [background, setBackground] = useState<BackgroundId>("cycle");
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(126);
  const [phase, setPhase] = useState<"idle" | "running" | "stopped">("idle");
  const [gen, setGen] = useState(0);
  const [valueKey, setValueKey] = useState<number | null>(null);
  const [controlKey, setControlKey] = useState<number | null>(null);
  const [epoch, setEpoch] = useState(0);

  const rowsRef = useRef<Uint8Array[]>([]);
  const controlRef = useRef<Uint8Array[]>([]);
  const ruleRef = useRef(196);
  const periodicRef = useRef(true);
  const capRef = useRef(120);
  const genRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const boot = (next: YiState, nextWidth: number, nextBackground: BackgroundId) => {
    const rule = ruleForZhi(next.zhiKey);
    ruleRef.current = rule;
    periodicRef.current = nextBackground === "cycle";
    capRef.current = safeSteps(nextWidth);
    genRef.current = 0;
    rowsRef.current = [paintTape(nextWidth, next.zhiKey, nextBackground)];
    controlRef.current = [paintBackground(nextWidth, nextBackground)];
    setEpoch((value) => value + 1);
    setGen(0);
    setValueKey(null);
    setControlKey(null);
    setPhase("running");
  };

  const recast = () => {
    const next = castYi();
    setYi(next);
    boot(next, width, background);
  };

  const retune = (nextWidth: (typeof WIDTHS)[number], nextBackground: BackgroundId) => {
    setWidth(nextWidth);
    setBackground(nextBackground);
    if (yi) boot(yi, nextWidth, nextBackground);
  };

  const stop = () => {
    if (phaseRef.current !== "running") return;
    const rows = rowsRef.current;
    const controls = controlRef.current;
    const last = rows[rows.length - 1];
    const bare = controls[controls.length - 1];
    if (!last || !bare) return;
    phaseRef.current = "stopped";
    setPhase("stopped");
    setValueKey(readWindow(last));
    setControlKey(readWindow(bare));
  };

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      if (phaseRef.current !== "running" || genRef.current >= capRef.current) return;
      const rows = rowsRef.current;
      const controls = controlRef.current;
      const last = rows[rows.length - 1];
      const bare = controls[controls.length - 1];
      if (!last || !bare) return;
      const periodic = periodicRef.current;
      rows.push(stepTape(last, ruleRef.current, periodic));
      controls.push(stepTape(bare, ruleRef.current, periodic));
      if (rows.length > 160) rows.shift();
      if (controls.length > 160) controls.shift();
      genRef.current += 1;
      setGen(genRef.current);
    }, 200);
    return () => window.clearInterval(timer);
  }, [phase, yi, width, background]);

  return (
    <div className={cx("min-h-dvh min-w-0 overflow-x-hidden bg-bg text-ink", phase === "running" && "pb-28")}>
      <div className="h-1 bg-cinnabar" />
      <header className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pt-6 pb-4">
        <p className="font-mono text-xs tracking-wide text-cinnabar">大衍成卦 · 观察另计</p>
        <h1 className="text-4xl font-semibold tracking-wide">起卦</h1>
        <p className="max-w-xl text-pretty text-muted">
          蓍草先定本卦和之卦。之卦再选一条规则。停住的是观察这件事的一种假设，不是结果。
        </p>
      </header>

      <main className="mx-auto flex min-w-0 max-w-6xl flex-col gap-4 px-4 pb-16">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-12 items-center rounded-md bg-ink px-5 text-base font-medium text-bg"
            onClick={recast}
          >
            {yi ? "再起一卦" : "起卦"}
          </button>
          <p className="max-w-md self-center text-sm text-pretty text-muted">
            用大衍的成数，不用铜钱。老阴十六分之一，少阳十六分之五，少阴十六分之七，老阳十六分之三。
          </p>
        </div>

        {yi ? (
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Judgement yi={yi} />
            <Observation
              yi={yi}
              background={background}
              width={width}
              phase={phase}
              gen={gen}
              valueKey={valueKey}
              controlKey={controlKey}
              rowsRef={rowsRef}
              controlRef={controlRef}
              epoch={epoch}
              onBackground={(next) => retune(width, next)}
              onWidth={(next) => retune(next, background)}
              onStop={stop}
            />
          </div>
        ) : (
          <p className="text-pretty text-muted">还没有一卦。起出来的判断停在之卦，元胞只在旁边走。</p>
        )}
      </main>

      {phase === "running" && yi ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <button
              type="button"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-ink text-base font-medium text-bg"
              onClick={stop}
            >
              停住
            </button>
            <p className="hidden text-sm text-muted sm:block">
              第 {gen} 代 · 参照 {yi.clock} · 停住的是观察这件事的一种假设
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Judgement({ yi }: { yi: YiState }) {
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div className="min-w-0">
        <p className="text-xs text-muted">占断 · 到之卦为止</p>
        <h2 className="mt-1 text-3xl font-semibold">{yi.ben.name}</h2>
        <p className="font-mono text-sm text-muted">{yi.ben.pinyin}</p>
        <p className="mt-1 text-sm text-muted">
          第 {yi.ben.king} 卦 · 下{TRIGRAMS[yi.ben.lower].name} · 上{TRIGRAMS[yi.ben.upper].name}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-6 gap-1">
        {LINE_NAMES.map((name, index) => (
          <div key={name} className="text-center">
            <p className={cx("text-xs", lineChanges(yi.lines[index]) ? "text-cinnabar" : "text-muted")}>{name}</p>
            <div className="mt-1 px-0.5">
              <YinYangLine on={lineYang(yi.lines[index])} />
            </div>
            <p className={cx("mt-1 text-xs", lineChanges(yi.lines[index]) ? "text-cinnabar" : "text-muted")}>
              {lineLabel(yi.lines[index])}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-line pt-3">
        <div className="w-12 shrink-0">
          <HexMark lines={bitsOf(yi.zhiKey)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">之卦 · 变爻之后</p>
          <p className="text-xl font-semibold">
            {yi.zhi.name}
            <span className="ml-2 font-mono text-sm font-normal text-muted">{yi.zhi.pinyin}</span>
          </p>
          <p className="text-sm text-muted">
            第 {yi.zhi.king} 卦 · 下{TRIGRAMS[yi.zhi.lower].name} · 上{TRIGRAMS[yi.zhi.upper].name}
          </p>
        </div>
      </div>
      <p className="text-sm text-pretty text-muted">
        蓍数参照在第 {yi.clock} 代，只作时钟，不替你停。这一栏不接收元胞的输出。
      </p>
    </article>
  );
}

function Observation({
  yi,
  background,
  width,
  phase,
  gen,
  valueKey,
  controlKey,
  rowsRef,
  controlRef,
  epoch,
  onBackground,
  onWidth,
  onStop,
}: {
  yi: YiState;
  background: BackgroundId;
  width: (typeof WIDTHS)[number];
  phase: "idle" | "running" | "stopped";
  gen: number;
  valueKey: number | null;
  controlKey: number | null;
  rowsRef: RefObject<Uint8Array[]>;
  controlRef: RefObject<Uint8Array[]>;
  epoch: number;
  onBackground: (background: BackgroundId) => void;
  onWidth: (width: (typeof WIDTHS)[number]) => void;
  onStop: () => void;
}) {
  const rule = ruleForZhi(yi.zhiKey);
  const temperament = temperamentOf(yi.zhiKey);
  const revealed = phase === "stopped" && valueKey !== null && controlKey !== null;
  const valueHex = revealed ? hexFromLines(bitsOf(valueKey)) : null;
  const controlHex = revealed ? hexFromLines(bitsOf(controlKey)) : null;
  const cap = safeSteps(width);
  const capped = gen >= cap;
  const proof = ACCEPTANCE.proof[rule];
  const entropy =
    temperament === "open"
      ? background === "cycle"
        ? ACCEPTANCE.cycle.openEntropy
        : ACCEPTANCE.zero.openEntropy
      : background === "cycle"
        ? ACCEPTANCE.cycle.settleEntropy
        : ACCEPTANCE.zero.settleEntropy;

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="min-w-0">
        <p className="text-xs text-muted">观察 · 不进入占断</p>
        <h2 className="mt-1 text-2xl font-semibold">{temperamentLabel(temperament)}</h2>
        <p className="text-sm text-pretty text-muted">
          之卦有 {yangCount(yi.zhiKey)} 个阳爻，
          {temperament === "open"
            ? "不少于四，所以用单侧相加：中心和刚好一侧邻居做模二和，或再取反。不是平移，也不是整卦取反。"
            : "少于四，所以用不动点规则。196 只会去阳，236 只会添阳。全是阴爻的时候，窗口停在原地。"}
          规则 {rule}。
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Toggle
            on={background === "cycle"}
            label="一段周期背景，图案取自 Rule 110"
            onClick={() => onBackground("cycle")}
          />
          <Toggle on={background === "zero"} label="全零" onClick={() => onBackground("zero")} />
        </div>
        <div className="flex gap-2">
          {WIDTHS.map((item) => (
            <Toggle key={item} on={width === item} label={`${item} 格`} onClick={() => onWidth(item)} />
          ))}
        </div>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-xs text-muted">种下这一卦</p>
        <Tape rowsRef={rowsRef} gen={gen} epoch={epoch} width={width} revealed={revealed} />
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-xs text-muted">不种卦的对照，同一规则、同一背景相位</p>
        <Tape rowsRef={controlRef} gen={gen} epoch={epoch} width={width} revealed={revealed} />
      </div>
      <p className="text-sm text-muted">
        第 {gen} 代
        {phase === "running" ? " · 两个窗口都盖住" : ""}
        {` · 参照 ${yi.clock} · 安全代数 ${cap}`}
        {capped ? " · 已到安全代数，再走会碰到绕回来的扰动" : ""}
      </p>
      {phase === "running" ? (
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-md bg-ink text-base font-medium text-bg"
          onClick={onStop}
        >
          停住
        </button>
      ) : null}
      {valueHex && controlHex ? (
        <div className="flex items-center gap-3 border-t border-line pt-3">
          <div className="w-12 shrink-0">
            <HexMark lines={bitsOf(valueKey ?? 0)} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-cinnabar">值卦</p>
            <p className="text-2xl font-semibold">{valueHex.name}</p>
            <p className="text-sm text-pretty">停住的是观察这件事的一种假设。</p>
            <p className="text-sm text-pretty text-muted">
              {clockRelation(gen, yi.clock)}。对照窗口是{controlHex.name}
              {valueKey === controlKey ? "，和没种卦时一样。" : "，种下的这一卦改了窗口。"}
              它不改上面的本卦和之卦。
            </p>
            {valueKey === yi.zhiKey ? (
              <p className="text-sm text-pretty">这一次窗口没有变，值卦与变爻之后相同。</p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-pretty text-muted">停住的是观察这件事的一种假设，不是这件事的结果。</p>
      )}
      <p className="text-xs text-pretty text-muted [overflow-wrap:anywhere]">
        {ACCEPTANCE.status}。转移表 SHA-256 {RING_TABLE_SHA256}。选族 SHA-256 {FAMILY_SHA256}
        。带长是 14 的倍数，周期背景沿窗口对齐，并按环绕边界走，所以没有接缝。安全代数是带长减六。4096 种输入里，这一族的值卦熵是 {entropy} bit。本条规则在种进背景之后，停下时仍与对照不同的占 {Math.round((proof?.diffIfPlanted ?? 0) * 100)}%，窗口不再等于之卦的占 {Math.round((proof?.moved ?? 0) * 100)}%，单个卦最高占 {Math.round((proof?.maxShare ?? 0) * 100)}%。
      </p>
    </article>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex max-w-full min-h-10 items-center rounded-md border px-3 py-2 text-left text-sm [overflow-wrap:anywhere]",
        on ? "border-ink bg-ink text-bg" : "border-line text-muted",
      )}
      aria-pressed={on}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Tape({
  rowsRef,
  gen,
  epoch,
  width,
  revealed,
}: {
  rowsRef: RefObject<Uint8Array[]>;
  gen: number;
  epoch: number;
  width: number;
  revealed: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    if (cssW < 2 || cssH < 2) return;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.maxWidth = "100%";
    const cell = canvas.width / width;
    const viewRows = Math.max(1, Math.floor(canvas.height / Math.max(1, cell)));
    const origin = windowOrigin(width);
    const rows = rowsRef.current ?? [];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#14110e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const start = Math.max(0, rows.length - viewRows);
    for (let r = start; r < rows.length; r++) {
      const row = rows[r];
      const prev = r > 0 ? rows[r - 1] : null;
      if (!row) continue;
      const y = (r - start) * cell;
      for (let xcol = 0; xcol < width; xcol++) {
        const veiled = !revealed && xcol >= origin && xcol < origin + 6;
        if (veiled) {
          ctx.fillStyle = "#1e1a16";
          ctx.fillRect(xcol * cell, y, cell + 0.5, cell + 0.5);
          continue;
        }
        if (!row[xcol]) continue;
        const born = !prev || !prev[xcol];
        ctx.fillStyle = born ? "#e23d32" : "#f3ecdf";
        ctx.fillRect(xcol * cell, y, cell + 0.5, cell + 0.5);
      }
    }
    ctx.strokeStyle = "#e23d32";
    ctx.lineWidth = Math.max(1, Math.round(dpr));
    ctx.strokeRect(origin * cell + 0.5, 0.5, 6 * cell - 1, viewRows * cell - 1);
  }, [epoch, gen, revealed, rowsRef, width]);

  return (
    <div ref={wrapRef} className="h-40 min-w-0 max-w-full overflow-hidden rounded-md border border-line">
      <canvas ref={canvasRef} className="block h-full max-h-full w-full max-w-full" />
    </div>
  );
}
