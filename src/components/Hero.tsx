import { useEffect, useState } from "react";
import { prefersReducedMotion, Reveal, ScrambleText } from "../lib/ui";
import { IconDownload, IconServer, IconSheet, IconSpark, IconTerminal } from "./icons";

const TERM_LINES: { text: string; cls: string }[] = [
  { text: "$ uvicorn main:app --reload", cls: "text-ink" },
  { text: "INFO  Uvicorn running on http://127.0.0.1:8000", cls: "text-dim" },
  { text: "POST /api/process · продажи_q1.xlsx · 18.4 КБ", cls: "text-muted" },
  { text: "→ prompt.yaml: модель qwen-plus · temperature 0.2", cls: "text-dim" },
  { text: "→ лист «Январь»: 214 строк → Qwen API…", cls: "text-dim" },
  { text: "← ответ за 3.2 с · 214 × 6 · JSON валиден", cls: "text-teal" },
  { text: "GET /api/download/8f3a41c2 → 200 OK · 41.7 КБ", cls: "text-ok" },
];

function TerminalCard() {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? TERM_LINES.length : 0));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= TERM_LINES.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 620);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-bg1/90 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-ok/80" />
        <span className="ml-3 flex items-center gap-1.5 font-mono text-[11px] text-dim">
          <IconTerminal size={13} />
          qwen-excel-bridge — zsh
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-teal">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal" />
          live
        </span>
      </div>
      <div className="min-h-[248px] space-y-1.5 px-4 py-4 font-mono text-[12.5px] leading-relaxed">
        {TERM_LINES.slice(0, count).map((l, i) => (
          <div key={i} className={l.cls}>
            {l.text}
          </div>
        ))}
        {count < TERM_LINES.length ? (
          <div className="caret text-ink" />
        ) : (
          <div className="text-ink">
            $ <span className="caret" />
          </div>
        )}
      </div>
    </div>
  );
}

const PIPELINE = [
  { icon: IconSheet, title: ".xlsx", sub: "файл пользователя", cls: "text-teal", dot: "bg-teal" },
  { icon: IconServer, title: "FastAPI", sub: "POST /api/process", cls: "text-ink", dot: "bg-ink" },
  { icon: IconSpark, title: "prompt.yaml → Qwen", sub: "алгоритм из YAML", cls: "text-amber", dot: "bg-amber" },
  { icon: IconDownload, title: "_processed.xlsx", sub: "готовый ответ", cls: "text-ok", dot: "bg-ok" },
];

function PipelineStrip() {
  return (
    <Reveal delay={150}>
      <div className="mt-14 rounded-xl border border-line bg-panel/60 px-5 py-5 backdrop-blur-sm sm:px-7">
        <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
          {PIPELINE.map((n, i) => (
            <div key={n.title} className="contents">
              <div className="group flex items-center gap-3.5">
                <span
                  className={
                    "grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-bg1 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-line2 " +
                    n.cls
                  }
                >
                  <n.icon size={20} />
                </span>
                <span>
                  <span className={"block font-mono text-[13px] font-semibold " + n.cls}>
                    {n.title}
                  </span>
                  <span className="block text-[12px] text-dim">{n.sub}</span>
                </span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="relative ml-5 hidden h-px flex-1 bg-line lg:block">
                  <span
                    className="absolute -top-[3px] right-0 h-[7px] w-[7px] rotate-45 border-r border-t border-line2"
                    aria-hidden="true"
                  />
                  <span className="flowdot" style={{ animationDelay: i * 0.55 + "s" }} />
                </div>
              )}
              {i < PIPELINE.length - 1 && (
                <div className="ml-[21px] h-6 border-l border-dashed border-line2 lg:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative mx-auto max-w-6xl px-4 pb-8 pt-28 sm:px-6 sm:pt-32">
      <div className="grid items-start gap-12 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <Reveal>
            <div className="mb-6 flex flex-wrap gap-2">
              {["Python 3.10+", "FastAPI", "Qwen API · DashScope", "Excel in / out"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-panel/70 px-3 py-1 font-mono text-[11px] text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          <h1 className="font-display text-[13vw] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-[64px]">
            <ScrambleText text="EXCEL →" className="block text-ink" delay={100} />
            <ScrambleText text="QWEN →" className="block text-amber" delay={450} />
            <ScrambleText text="EXCEL" className="block text-teal" delay={800} />
          </h1>

          <Reveal delay={200}>
            <p className="mt-7 max-w-xl text-[15.5px] leading-relaxed text-muted">
              Готовый Python-сервис: пользователь загружает <b className="text-ink">.xlsx</b> в
              простом веб-интерфейсе, таблица уходит модели{" "}
              <b className="text-ink">Qwen</b> по предустановленному промту из{" "}
              <span className="font-mono text-[13px] text-amber">prompt.yaml</span> — и обратно
              возвращается обработанный <b className="text-ink">Excel-файл</b>. Весь алгоритм
              обработки живёт в YAML, код трогать не нужно.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#code"
                className="rounded-lg bg-amber px-5 py-2.5 text-[14px] font-bold text-bg0 transition-all hover:-translate-y-0.5 hover:bg-[#ffc678] hover:shadow-[0_10px_30px_-8px_rgba(255,180,84,0.5)]"
              >
                Смотреть код
              </a>
              <a
                href="#demo"
                className="rounded-lg border border-line2 px-5 py-2.5 text-[14px] font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-teal hover:text-teal"
              >
                Живое демо ↓
              </a>
              <span className="font-mono text-[12px] text-dim">
                8 файлов · ~330 строк · 1 команда на запуск
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={250} className="lg:pt-4">
          <TerminalCard />
          <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-panel/50 px-4 py-2.5 font-mono text-[11.5px] text-dim">
            <span>
              $ pip install -r requirements.txt <span className="text-ok">✓</span>
            </span>
            <span>
              DASHSCOPE_API_KEY <span className="text-amber">= sk-••••</span>
            </span>
          </div>
        </Reveal>
      </div>

      <PipelineStrip />
    </section>
  );
}
