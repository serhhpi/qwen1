import JSZip from "jszip";
import { useState } from "react";
import { PROJECT_FILES, ZIP_ROOT } from "../data/projectFiles";
import { downloadBlob } from "../lib/ui";
import { IconZip } from "./icons";

const LINKS = [
  { href: "#flow", label: "Пайплайн" },
  { href: "#code", label: "Код" },
  { href: "#run", label: "Запуск" },
  { href: "#demo", label: "Демо" },
];

export default function Nav() {
  const [zipping, setZipping] = useState(false);

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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-bg0/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h9" stroke="#ffb454" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="18.5" cy="17" r="2.6" fill="#43d6c0" />
            </svg>
          </span>
          <span className="font-mono text-[13px] font-medium tracking-tight text-ink">
            qwen-excel-bridge<span className="text-amber">.py</span>
          </span>
        </a>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] font-medium text-muted transition-colors hover:text-amber"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          onClick={downloadZip}
          className="ml-auto flex items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-3.5 py-1.5 text-[13px] font-semibold text-amber transition-all hover:border-amber hover:bg-amber hover:text-bg0 md:ml-6"
        >
          <IconZip size={15} />
          <span className="hidden sm:inline">{zipping ? "Собираем…" : "Скачать .zip"}</span>
          <span className="sm:hidden">.zip</span>
        </button>
      </div>
    </header>
  );
}
