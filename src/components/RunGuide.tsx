import CodeSnippet from "./CodeSnippet";
import { IconKey, IconTerminal } from "./icons";
import { Reveal } from "../lib/ui";

const STEPS = [
  {
    n: "1",
    title: "Окружение и зависимости",
    text: "Python 3.10+, всё ставится одной командой из requirements.txt.",
    code: "python -m venv .venv\nsource .venv/bin/activate    # Windows: .venv\\Scripts\\activate\npip install -r requirements.txt",
  },
  {
    n: "2",
    title: "Ключ DashScope",
    text: "Скопируйте шаблон .env и впишите ключ — код возьмёт его из переменной окружения.",
    code: 'cp .env.example .env\n# впишите:  DASHSCOPE_API_KEY=sk-...\n# Windows без .env:  setx DASHSCOPE_API_KEY "sk-..."',
  },
  {
    n: "3",
    title: "Запуск сервера",
    text: "Одна команда — и сервис слушает порт 8000 с автоперезагрузкой при правках.",
    code: "uvicorn main:app --reload",
  },
  {
    n: "4",
    title: "Работа",
    text: "Откройте адрес сервера в браузере: загрузите .xlsx, дождитесь ответа Qwen и скачайте _processed.xlsx.",
    code: "# открыть в браузере:\nhttp://127.0.0.1:8000",
  },
];

const ENDPOINTS = [
  { m: "GET", path: "/", d: "веб-интерфейс (templates/index.html)" },
  { m: "POST", path: "/api/process", d: "приём .xlsx → Qwen → JSON-превью + токен" },
  { m: "GET", path: "/api/download/{token}", d: "готовый .xlsx по одноразовому токену" },
];

export default function RunGuide() {
  return (
    <section id="run" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ---- sticky-колонка ---- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            <p className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-teal">
              // запуск за минуту
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              От архива до <span className="text-amber">работающего сервиса</span>
            </h2>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-muted">
              Четыре шага — и у вас локальный веб-сервис, который гоняет Excel-таблицы через
              Qwen. Никаких баз данных и очередей: файл пришёл, модель ответила, файл ушёл.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="mt-8 rounded-xl border border-amber/25 bg-amber/[0.06] p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-amber/40 bg-amber/10 text-amber">
                  <IconKey size={17} />
                </span>
                <h3 className="font-display text-[15px] font-semibold text-ink">
                  Где взять ключ
                </h3>
              </div>
              <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-muted">
                <li>
                  <span className="font-semibold text-ink">Китай (Aliyun):</span>{" "}
                  dashscope.console.aliyun.com — раздел API-Keys.
                </li>
                <li>
                  <span className="font-semibold text-ink">Международный:</span> Alibaba Cloud
                  Model Studio (Bailian) — там же выбирается модель qwen-plus / qwen-max.
                </li>
                <li>
                  <span className="font-semibold text-ink">Важно:</span> для китайского аккаунта
                  поменяйте <span className="font-mono text-[12px] text-amber">base_url</span> в
                  prompt.yaml на dashscope.aliyuncs.com.
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal delay={250}>
            <div className="mt-5 overflow-hidden rounded-xl border border-line bg-panel/50">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <IconTerminal size={14} className="text-teal" />
                <span className="font-mono text-[12px] font-semibold text-ink">
                  Эндпоинты сервиса
                </span>
              </div>
              <div className="divide-y divide-line/60">
                {ENDPOINTS.map((e) => (
                  <div key={e.path} className="flex items-baseline gap-3 px-4 py-3">
                    <span
                      className={
                        "w-12 shrink-0 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-bold " +
                        (e.m === "GET"
                          ? "border-teal/40 text-teal"
                          : "border-amber/40 text-amber")
                      }
                    >
                      {e.m}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[12.5px] text-ink">{e.path}</p>
                      <p className="text-[12px] text-dim">{e.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* ---- шаги ---- */}
        <div className="space-y-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <article className="group rounded-xl border border-line bg-panel/40 p-5 transition-colors duration-300 hover:border-line2 sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-amber/40 bg-amber/10 font-display text-[13px] font-bold text-amber transition-colors group-hover:bg-amber group-hover:text-bg0">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-display text-[15.5px] font-semibold text-ink">
                      {s.title}
                    </h3>
                    <p className="text-[12.5px] text-dim">{s.text}</p>
                  </div>
                </div>
                <CodeSnippet code={s.code} lang="bash" />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
