import { useMemo } from "react";
import type { FileLang } from "../data/projectFiles";
import { tokenizeToLines } from "../lib/highlight";
import { copyText, useCopied } from "../lib/ui";
import { IconCheck, IconCopy } from "./icons";

export default function CodeSnippet({
  code,
  lang = "bash",
  className = "",
}: {
  code: string;
  lang?: FileLang;
  className?: string;
}) {
  const lines = useMemo(() => tokenizeToLines(code.replace(/\n$/, ""), lang), [code, lang]);
  const [copied, mark] = useCopied();

  return (
    <div className={"group relative overflow-hidden rounded-lg border border-line bg-bg1 " + className}>
      <button
        onClick={() => copyText(code).then((ok) => ok && mark())}
        className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-md border border-line bg-panel px-2 py-1 font-mono text-[10.5px] text-muted opacity-0 transition-all hover:border-line2 hover:text-ink focus:opacity-100 group-hover:opacity-100"
        aria-label="Скопировать код"
      >
        {copied ? <IconCheck size={12} className="text-ok" /> : <IconCopy size={12} />}
        {copied ? "готово" : "copy"}
      </button>
      <pre className="code-scroll overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] text-[#c9d8ea]">
        {lines.map((ln, i) => (
          <div key={i} className="whitespace-pre">
            {ln.length === 0
              ? " "
              : ln.map((t, j) =>
                  t.cls ? (
                    <span key={j} className={t.cls}>
                      {t.text}
                    </span>
                  ) : (
                    t.text
                  )
                )}
          </div>
        ))}
      </pre>
    </div>
  );
}
