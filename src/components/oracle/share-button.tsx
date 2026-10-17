import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function" && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      // The user dismissed the share sheet or clipboard is unavailable; nothing to recover.
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted hover:text-ink"
    >
      {done ? <Check className="size-4 text-cinnabar" /> : <Link2 className="size-4" />}
      {done ? "已复制链接" : "分享这一卦"}
    </button>
  );
}
