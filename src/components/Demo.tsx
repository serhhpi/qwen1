import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { prefersReducedMotion, Reveal } from "../lib/ui";
import { IconDownload, IconPlay, IconReset, IconSheet, IconSpark } from "./icons";

const INPUT_COLS = ["Товар", "Количество", "Цена"];
const INPUT_ROWS: (string | number)[][] = [
  ["Ноутбук Acer Aspire 5", 3, 54990],
  ["Смартфон Galaxy A55", "", 32990],
  ["Куртка зимняя", 7, 8990],
  ["Кофе зерновой, 1 кг", 12, 1290],
  ["Наушники TWS Pro", 5, 4990],
  ['Монитор 27" IPS', 2, 21990],
  ["Хлеб бородинский", 40, 89],
  ["Клавиатура мех.", 6, 7490],
];

const OUT_COLS = ["Товар", "Количество", "Цена", "Категория", "Сумма"];
const OUT_ROWS: (string | number)[][] = [
  ["Ноутбук Acer Aspire 5", 3, 54990, "электроника", 164970],
  ["Куртка зимняя", 7, 8990, "одежда", 62930],
  ["Клавиатура мех.", 6, 7490, "электроника", 44940],
  ['Монитор 27" IPS', 2, 21990, "электроника", 43980],
  ["Наушники TWS Pro", 5, 4990, "электроника", 24950],
  ["Кофе зерновой, 1 кг", 12, 1290, "продукты", 15480],
  ["Хлеб бородинский", 40, 89, "продукты", 3560],
  ["Смартфон Galaxy A55", 0, 32990, "электроника", 0],
];
const SUMMARY =
  "Пропущенные количества заменены на 0 (1 строка), добавлены колонки «Категория» и «Сумма», строки отсортированы по убыванию суммы.";

const LOG_LINES: { t: string; c: string }[] = [
  { t: "POST /api/process · продажи.xlsx · 8 строк", c: "text-muted" },
  { t: "→ prompt.yaml: qwen-plus · temperature 0.2 · json_mode", c: "text-dim" },
  { t: "→ Qwen API: запрос отправлен…", c: "text-dim" },
  { t: "← JSON за 2.8 с: 8 строк × 5 колонок", c: "text-teal" },
  { t: "✓ собран «продажи_processed.xlsx» (листы: Результат, Отчёт)", c: "text-ok" },
];

const CAT_CLS: Record<string, string> = {
  электроника: "border-teal/40 bg-teal/10 text-teal",
  одежда: "border-amber/40 bg-amber/10 text-amber",
  продукты: "border-ok/40 bg-ok/10 text-ok",
  прочее: "border-line bg-panel text-muted",
};

type Phase = "idle" | "loaded" | "run" | "done";

export default function Demo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [logs, setLogs] = useState<number>(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const start = () => {
    setPhase("run");
    setLogs(0);
    if (prefersReducedMotion()) {
      setLogs(LOG_LINES.length);
      setPhase("done");
      return;
    }
    LOG_LINES.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLogs(i + 1);
          if (i === LOG_LINES.length - 1) {
            timers.current.push(window.setTimeout(() => setPhase("done"), 480));
          }
        }, 600 * (i + 1))
      );
    });
  };

  const reset = () => {
    clearTimers();
    setPhase("idle");
    setLogs(0);
  };

  const downloadResult = () => {
    const ws = XLSX.utils.aoa_to_sheet([OUT_COLS, ...OUT_ROWS]);
    ws["!cols"] = OUT_COLS.map((_, i) => ({ wch: i === 0 ? 26 : 13 }));
    const report = XLSX.utils.aoa_to_sheet([["Отчёт"], [SUMMARY]]);
    report["!cols"] = [{ wch: 90 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Результат");
    XLSX.utils.book_append_sheet(wb, report, "Отчёт");
    XLSX.writeFile(wb, "продажи_processed.xlsx");
  };

  return (
    <section id="demo" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-teal">
              // живое демо
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Так выглядит <span className="text-amber">обработка таблицы</span>
            </h2>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 font-mono text-[11.5px] text-muted">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal" />
            симуляция прямо в браузере — сервер не нужен
          </span>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="overflow-hidden rounded-xl border border-line bg-bg1/90 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)]">
          {/* хром окна */}
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
            <span className="ml-3 flex-1 rounded-md border border-line bg-bg0/70 px-3 py-1 text-center font-mono text-[11px] text-dim">
              127.0.0.1:8000 — Qwen Excel Bridge
            </span>
            <span className="hidden font-mono text-[10.5px] text-dim sm:block">
              templates/index.html
            </span>
          </div>

          <div className="p-5 sm:p-7">
            {/* ---- шаг загрузки ---- */}
            {phase === "idle" && (
              <button
                onClick={() => setPhase("loaded")}
                className="group flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line bg-panel/40 px-6 py-14 transition-all duration-300 hover:border-amber hover:bg-amber/[0.05]"
              >
                <span className="grid h-14 w-14 place-items-center rounded-xl border border-line bg-bg1 text-teal transition-transform duration-300 group-hover:-translate-y-1 group-hover:border-teal/50">
                  <IconSheet size={26} />
                </span>
                <span className="text-[15px] font-semibold text-ink">
                  Загрузить пример: <span className="text-amber">продажи.xlsx</span> · 8 строк
                </span>
                <span className="font-mono text-[12px] text-dim">
                  клик = «выбрать файл» (демо-данные уже внутри)
                </span>
              </button>
            )}

            {phase !== "idle" && (
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                {/* входная таблица */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-mono text-[12.5px] font-semibold text-ink">
                      продажи.xlsx <span className="text-dim">· лист «Продажи»</span>
                    </h3>
                    <span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[10.5px] text-muted">
                      вход
                    </span>
                  </div>
                  <div className="code-scroll overflow-x-auto rounded-lg border border-line">
                    <table className="w-full min-w-[420px] border-collapse font-mono text-[12px]">
                      <thead>
                        <tr className="bg-panel">
                          {INPUT_COLS.map((c) => (
                            <th
                              key={c}
                              className="border-b border-line px-3 py-2 text-left font-semibold text-amber"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {INPUT_ROWS.map((r, i) => (
                          <tr key={i} className="odd:bg-bg0/40">
                            {r.map((v, j) => (
                              <td
                                key={j}
                                className={
                                  "border-b border-line/50 px-3 py-1.5 " +
                                  (j === 0 ? "text-ink" : "text-muted")
                                }
                              >
                                {v === "" ? (
                                  <span
                                    title="Пропущенное значение — модель заменит на 0"
                                    className="inline-block rounded border border-dashed border-coral/70 px-2 text-[10.5px] text-coral"
                                  >
                                    пусто
                                  </span>
                                ) : typeof v === "number" ? (
                                  v.toLocaleString("ru-RU")
                                ) : (
                                  v
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2.5 text-[12px] text-dim">
                    <span className="text-coral">◇</span> пропуск в «Количестве» — по алгоритму из
                    prompt.yaml модель заменит его на 0.
                  </p>
                </div>

                {/* правая колонка: лог / результат */}
                <div className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-mono text-[12.5px] font-semibold text-ink">
                      {phase === "done" ? (
                        <>
                          продажи_processed.xlsx <span className="text-dim">· 2 листа</span>
                        </>
                      ) : (
                        <>
                          обработка <span className="text-dim">· Qwen API</span>
                        </>
                      )}
                    </h3>
                    <span
                      className={
                        "rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] " +
                        (phase === "done"
                          ? "border-ok/40 bg-ok/10 text-ok"
                          : "border-amber/40 bg-amber/10 text-amber")
                      }
                    >
                      {phase === "done" ? "готово" : "выполняется"}
                    </span>
                  </div>

                  {/* лог */}
                  <div className="rounded-lg border border-line bg-bg0/70 px-4 py-3 font-mono text-[11.5px] leading-[1.8]">
                    {LOG_LINES.slice(0, logs).map((l, i) => (
                      <div key={i} className={l.c}>
                        {l.t}
                      </div>
                    ))}
                    {phase === "run" && <div className="caret text-ink" />}
                    {phase === "loaded" && (
                      <div className="text-dim">ожидание запуска…</div>
                    )}
                  </div>

                  {phase === "run" && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel">
                      <div className="barfill h-full rounded-full bg-gradient-to-r from-amber to-teal" />
                    </div>
                  )}

                  {phase === "done" && (
                    <>
                      <div className="code-scroll mt-3 max-h-[260px] overflow-auto rounded-lg border border-teal/25">
                        <table className="w-full min-w-[460px] border-collapse font-mono text-[12px]">
                          <thead className="sticky top-0">
                            <tr className="bg-panel">
                              {OUT_COLS.map((c) => (
                                <th
                                  key={c}
                                  className="border-b border-line px-3 py-2 text-left font-semibold text-teal"
                                >
                                  {c}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {OUT_ROWS.map((r, i) => (
                              <tr key={i} className="odd:bg-bg0/40">
                                {r.map((v, j) => (
                                  <td
                                    key={j}
                                    className={
                                      "border-b border-line/50 px-3 py-1.5 " +
                                      (j === 0
                                        ? "text-ink"
                                        : j === 3
                                          ? ""
                                          : "text-muted")
                                    }
                                  >
                                    {j === 3 ? (
                                      <span
                                        className={
                                          "inline-block rounded-full border px-2 py-0.5 text-[10.5px] " +
                                          (CAT_CLS[String(v)] ?? CAT_CLS["прочее"])
                                        }
                                      >
                                        {v}
                                      </span>
                                    ) : typeof v === "number" ? (
                                      v.toLocaleString("ru-RU")
                                    ) : (
                                      v
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-3 rounded-lg border border-line bg-panel/50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted">
                        <span className="mr-1.5 font-semibold text-ok">Отчёт:</span>
                        {SUMMARY}
                      </p>
                    </>
                  )}

                  {/* действия */}
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {phase === "loaded" && (
                      <button
                        onClick={start}
                        className="flex items-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-[13.5px] font-bold text-bg0 transition-all hover:-translate-y-0.5 hover:bg-[#ffc678] hover:shadow-[0_10px_28px_-8px_rgba(255,180,84,0.5)]"
                      >
                        <IconPlay size={15} />
                        Обработать через Qwen
                      </button>
                    )}
                    {phase === "run" && (
                      <button
                        disabled
                        className="flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-[13.5px] font-semibold text-dim"
                      >
                        <IconSpark size={15} className="text-amber" />
                        Qwen думает…
                      </button>
                    )}
                    {phase === "done" && (
                      <>
                        <button
                          onClick={downloadResult}
                          className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-[13.5px] font-bold text-bg0 transition-all hover:-translate-y-0.5 hover:bg-[#6fe6d3] hover:shadow-[0_10px_28px_-8px_rgba(67,214,192,0.5)]"
                        >
                          <IconDownload size={15} />
                          Скачать .xlsx (настоящий файл)
                        </button>
                        <button
                          onClick={reset}
                          className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13.5px] font-semibold text-muted transition-all hover:border-line2 hover:text-ink"
                        >
                          <IconReset size={15} />
                          Сбросить
                        </button>
                      </>
                    )}
                    {phase !== "done" && (
                      <button
                        onClick={reset}
                        className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13.5px] font-semibold text-muted transition-all hover:border-line2 hover:text-ink"
                      >
                        <IconReset size={15} />
                        Сбросить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
