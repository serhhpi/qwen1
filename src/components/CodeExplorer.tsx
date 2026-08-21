import JSZip from "jszip";
import { useMemo, useState } from "react";
import { PROJECT_FILES, ZIP_ROOT, type FileLang } from "../data/projectFiles";
import { tokenizeToLines } from "../lib/highlight";
import { copyText, downloadBlob, downloadTextFile, Reveal, useCopied } from "../lib/ui";
import { IconCheck, IconCopy, IconDownload, IconFile, IconFolder, IconZip } from "./icons";

const LANG_BADGE: Record<FileLang, { label: string; cls: string }> = {
  python: { label: "PY", cls: "text-amber border-amber/40 bg-amber/10" },
  yaml: { label: "YAML", cls: "text-teal border-teal/40 bg-teal/10" },
  html: { label: "HTML", cls: "text-coral border-coral/40 bg-coral/10" },
  bash: { label: "ENV", cls: "text-ok border-ok/40 bg-ok/10" },
  text: { label: "TXT", cls: "text-muted border-line bg-panel" },
};

const DOT: Record<FileLang, string> = {
  python: "bg-amber",
  yaml: "bg-teal",
  html: "bg-coral",
  bash: "bg-ok",
  text: "bg-dim",
};

function lineCount(f: { content: string }) {
  return f.content.replace(/\n$/, "").split("\n").length;
}

export default function CodeExplorer() {
  const [activePath, setActivePath] = useState(PROJECT_FILES[0].path);
  const file = PROJECT_FILES.find((f) => f.path === activePath) ?? PROJECT_FILES[0];
  const [copied, mark] = useCopied();
  const [zipping, setZipping] = useState(false);

  const lines = useMemo(
    () => tokenizeToLines(file.content.replace(/\n$/, ""), file.lang),
    [file]
  );

  const rootFiles = PROJECT_FILES.filter((f) => !f.path.includes("/"));
  const templateFiles = PROJECT_FILES.filter((f) => f.path.includes("/"));

  const downloadZip = async () => {
    if (zipping) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      PROJECT_FILES.forEach((f) => zip.file(ZIP_ROOT + "/" + f.path, f.content));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(ZIP_ROOT + ".zip", blob);
    } finally {
      setTimeout(() => setZipping(false), 700);
    }
  };

  const renderItem = (f: (typeof PROJECT_FILES)[number], indent: boolean) => {
    const isActive = f.path === activePath;
    return (
      <button
        key={f.path}
        onClick={() => setActivePath(f.path)}
        className={
          "group flex w-full items-center gap-2.5 border-l-2 px-3 py-2 text-left font-mono text-[12.5px] transition-all duration-200 " +
          (indent ? "pl-8 " : "") +
          (isActive
            ? "border-amber bg-amber/10 text-ink"
            : "border-transparent text-muted hover:translate-x-0.5 hover:border-line2 hover:bg-panel hover:text-ink")
        }
      >
        <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + DOT[f.lang]} />
        <span className="truncate">{f.path.split("/").pop()}</span>
        <span className="ml-auto shrink-0 text-[10.5px] text-dim">
          {lineCount(f)} стр
        </span>
      </button>
    );
  };

  return (
    <section id="code" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-teal">
              // исходники проекта
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Восемь файлов — <span className="text-amber">и сервис готов</span>
            </h2>
          </div>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-dim">
            Скопируйте файл кнопкой, скачайте по отдельности или заберите весь проект одним
            архивом.
          </p>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="overflow-hidden rounded-xl border border-line bg-bg1/80 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)]">
          <div className="grid lg:grid-cols-[280px_1fr]">
            {/* ---- дерево файлов ---- */}
            <aside className="border-b border-line bg-panel/40 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <IconFolder size={14} className="text-amber" />
                <span className="font-mono text-[12px] font-semibold text-ink">{ZIP_ROOT}/</span>
              </div>
              <div className="py-2">
                {rootFiles.map((f) => renderItem(f, false))}
                <div className="mt-1 flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-dim">
                  <IconFolder size={13} />
                  templates/
                </div>
                {templateFiles.map((f) => renderItem(f, true))}
              </div>
              <div className="border-t border-line p-3">
                <button
                  onClick={downloadZip}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal/40 bg-teal/10 px-3 py-2 text-[12.5px] font-semibold text-teal transition-all hover:border-teal hover:bg-teal hover:text-bg0"
                >
                  <IconZip size={15} />
                  {zipping ? "Собираем архив…" : "Скачать всё (.zip)"}
                </button>
              </div>
            </aside>

            {/* ---- просмотрщик кода ---- */}
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
                <span className="hidden gap-1.5 sm:flex">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
                </span>
                <span className="flex items-center gap-2 font-mono text-[12.5px] text-ink">
                  <IconFile size={14} className="text-dim" />
                  {file.path}
                </span>
                <span
                  className={
                    "rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider " +
                    LANG_BADGE[file.lang].cls
                  }
                >
                  {LANG_BADGE[file.lang].label}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => copyText(file.content).then((ok) => ok && mark())}
                    className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1.5 font-mono text-[11px] text-muted transition-all hover:border-line2 hover:text-ink"
                  >
                    {copied ? (
                      <IconCheck size={13} className="text-ok" />
                    ) : (
                      <IconCopy size={13} />
                    )}
                    <span className="hidden sm:inline">{copied ? "Скопировано" : "Копировать"}</span>
                  </button>
                  <button
                    onClick={() => downloadTextFile(file.path.split("/").pop() ?? file.path, file.content)}
                    className="flex items-center gap-1.5 rounded-md border border-amber/40 bg-amber/10 px-2.5 py-1.5 font-mono text-[11px] text-amber transition-all hover:border-amber hover:bg-amber hover:text-bg0"
                    aria-label="Скачать файл"
                  >
                    <IconDownload size={13} />
                    <span className="hidden sm:inline">Файл</span>
                  </button>
                </span>
              </div>

              <div className="px-4 pb-1 pt-3 font-mono text-[11.5px] text-dim">{file.note}</div>

              <div className="code-scroll max-h-[520px] flex-1 overflow-auto bg-bg0/60">
                <pre className="min-w-max px-0 py-3 font-mono text-[12.5px] leading-[1.6] text-[#c9d8ea]">
                  {lines.map((ln, i) => (
                    <div key={i} className="flex whitespace-pre hover:bg-panel/40">
                      <span className="w-12 shrink-0 select-none pr-4 text-right text-[11px] leading-[1.75] text-dim/70">
                        {i + 1}
                      </span>
                      <span className="pr-6">
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
                      </span>
                    </div>
                  ))}
                </pre>
              </div>

              <div className="flex items-center gap-4 border-t border-line px-4 py-2 font-mono text-[11px] text-dim">
                <span>{lines.length} строк</span>
                <span>{file.content.length.toLocaleString("ru-RU")} символов</span>
                <span className="ml-auto hidden text-teal sm:inline">
                  UTF-8 · Python 3.10+
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
