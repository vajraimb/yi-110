import { createFileRoute, Link } from "@tanstack/react-router";
import { AskForm } from "@/components/oracle/ask-form";
import { HistoryList } from "@/components/oracle/history-list";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <div className="h-1 bg-cinnabar" />
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 pt-8 pb-16 sm:pt-12">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-xs tracking-wide text-cinnabar">元胞自动机 × 六十四卦</p>
          <h1 className="text-4xl font-semibold tracking-wide text-balance sm:text-5xl">问一卦</h1>
          <p className="max-w-xl text-pretty leading-relaxed text-muted">
            你的问题被哈希成 256 个细胞，排成一个环。规则
            110——已被证明能做任何计算的那一条八比特法律——一代一代推演。
            读头下的六格每一代都在改写名字；你停住的那一刻，它叫什么，就是你的卦。下一代，就是之卦。
          </p>
        </header>

        <AskForm />

        <HistoryList />

        <section className="grid gap-3 text-sm text-muted sm:grid-cols-3">
          <Step n="一" title="问" body="写下问题。它与此刻、与一点随机，一起被哈希成初态。" />
          <Step
            n="二"
            title="演"
            body="规则 110 在环上推演。有背景、有旅行者、有碰撞，没有捷径。"
          />
          <Step n="三" title="停" body="你停住的那一代是本卦，下一代是之卦。翻转的细胞是变爻。" />
        </section>

        <p className="text-sm text-pretty text-muted">
          想看看别的规则、别的初态会长出什么世界？去
          <Link
            to="/cosmos"
            className="mx-1 underline decoration-cinnabar underline-offset-4 hover:text-ink"
          >
            实验室
          </Link>
          。关于读法与出处，见
          <Link
            to="/about"
            className="mx-1 underline decoration-cinnabar underline-offset-4 hover:text-ink"
          >
            方法
          </Link>
          。
        </p>
      </main>
    </>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-card border border-line p-4">
      <p className="font-mono text-xs text-cinnabar">{n}</p>
      <p className="mt-1 text-base font-semibold text-ink">{title}</p>
      <p className="mt-1 text-pretty leading-relaxed">{body}</p>
    </div>
  );
}
