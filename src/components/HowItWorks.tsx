import { Reveal } from "../lib/ui";

const STEPS = [
  {
    n: "01",
    title: "Загрузка файла",
    text: "Пользователь перетаскивает .xlsx в веб-интерфейс. FastAPI принимает multipart-форму, проверяет расширение (.xlsx / .xls) и размер (до 10 МБ).",
    chip: "file: UploadFile = File(...)",
  },
  {
    n: "02",
    title: "Excel → текст",
    text: "excel_handler.py читает первый непустой лист через pandas и превращает его в CSV-текст — до 300 строк, чтобы не упереться в контекст модели.",
    chip: "pd.read_excel(..., sheet_name=None)",
  },
  {
    n: "03",
    title: "Промт из YAML → Qwen",
    text: "qwen_client.py подставляет таблицу в шаблон из prompt.yaml и вызывает chat.completions Qwen через OpenAI-совместимый endpoint DashScope с требованием JSON.",
    chip: 'response_format={"type": "json_object"}',
  },
  {
    n: "04",
    title: "JSON → Excel-ответ",
    text: "Ответ модели (columns / rows / summary) собирается обратно в .xlsx: лист «Результат» с обработанной таблицей и лист «Отчёт» с пояснением. Файл отдаётся по ссылке.",
    chip: 'pd.ExcelWriter(buf, engine="openpyxl")',
  },
];

export default function HowItWorks() {
  return (
    <section id="flow" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <Reveal>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-teal">
              // как это работает
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Четыре шага <span className="text-amber">от файла до файла</span>
            </h2>
          </div>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-dim">
            Каждый шаг — отдельный модуль. Хотите другой сценарий обработки — меняете только
            prompt.yaml.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 110}>
            <article className="group relative h-full overflow-hidden rounded-xl border border-line bg-panel/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber/40 hover:bg-panel sm:p-7">
              <span className="pointer-events-none absolute -right-3 -top-7 font-display text-[92px] font-black leading-none text-line/60 transition-colors duration-300 group-hover:text-amber/15">
                {s.n}
              </span>
              <div className="relative">
                <p className="mb-2 font-mono text-[11.5px] font-semibold text-amber">
                  шаг {s.n}
                </p>
                <h3 className="mb-2.5 font-display text-[17px] font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-muted">{s.text}</p>
                <code className="mt-4 inline-block rounded-md border border-line bg-bg1 px-2.5 py-1 font-mono text-[11.5px] text-teal">
                  {s.chip}
                </code>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
