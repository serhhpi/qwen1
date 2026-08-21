export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="font-mono text-[13px] font-semibold text-ink">
            qwen-excel-bridge<span className="text-amber">.py</span>
          </p>
          <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-dim">
            Python · FastAPI · Qwen API (DashScope) · pandas + openpyxl. Алгоритм обработки
            живёт в <span className="font-mono text-[11.5px] text-teal">prompt.yaml</span> —
            меняйте промт, не трогая код.
          </p>
        </div>
        <div className="flex items-center gap-5 font-mono text-[11.5px] text-dim">
          <a href="#code" className="transition-colors hover:text-amber">
            исходники
          </a>
          <a href="#run" className="transition-colors hover:text-amber">
            запуск
          </a>
          <a href="#top" className="transition-colors hover:text-amber">
            наверх ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
