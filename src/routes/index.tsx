import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CastView } from "@/components/cast/cast-view";
import { CosmosApp } from "@/components/cosmos/cosmos-app";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [mode, setMode] = useState<"world" | "cast">("world");
  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-ink">
      <nav className="sticky top-0 z-40 border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl gap-2 px-4 py-3">
          <ModeButton on={mode === "world"} label="宇宙" onClick={() => setMode("world")} />
          <ModeButton on={mode === "cast"} label="起卦" onClick={() => setMode("cast")} />
        </div>
      </nav>
      {mode === "world" ? <CosmosApp /> : <CastView />}
    </div>
  );
}

function ModeButton({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={
        on
          ? "inline-flex h-10 items-center rounded-md bg-ink px-4 text-sm font-medium text-bg"
          : "inline-flex h-10 items-center rounded-md border border-line px-4 text-sm text-muted"
      }
      aria-pressed={on}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
