import type { FileLang } from "../data/projectFiles";

export interface Tok {
  cls: string | null;
  text: string;
}

interface Spec {
  cls: string;
  re: string;
}

/* Внутри каждой спеки — только НЕзахватывающие группы (?:...),
   чтобы индекс группы однозначно указывал на правило. */

const PYTHON: Spec[] = [
  { cls: "tk-com", re: "#[^\\n]*" },
  {
    cls: "tk-str",
    re: "(?:\"\"\"[\\s\\S]*?\"\"\"|'''[\\s\\S]*?'''|\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*')",
  },
  { cls: "tk-dec", re: "@\\w+" },
  {
    cls: "tk-kw",
    re: "\\b(?:def|class|return|if|elif|else|for|while|in|import|from|as|with|try|except|finally|raise|not|and|or|is|None|True|False|lambda|pass|break|continue|global|nonlocal|async|await|yield)\\b",
  },
  { cls: "tk-num", re: "\\b\\d[\\d_]*(?:\\.\\d+)?\\b" },
  { cls: "tk-self", re: "\\b(?:self|cls)\\b" },
];

const YAML: Spec[] = [
  { cls: "tk-com", re: "#[^\\n]*" },
  { cls: "tk-str", re: "\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'" },
  { cls: "tk-key", re: "^[ \\t]*(?:-[ \\t]+)?[A-Za-z_][\\w./-]*(?=[ \\t]*:)" },
  { cls: "tk-kw", re: "\\b(?:true|false|null|yes|no)\\b" },
  { cls: "tk-num", re: "\\b\\d+(?:\\.\\d+)?\\b" },
  { cls: "tk-op", re: "[|>][+-]?(?=[ \\t]*(?:#|$))" },
];

const BASH: Spec[] = [
  { cls: "tk-com", re: "#[^\\n]*" },
  { cls: "tk-str", re: "\"(?:\\\\.|[^\"\\\\])*\"|'[^']*'" },
  { cls: "tk-var", re: "\\$\\{?\\w+\\}?" },
  { cls: "tk-flag", re: "(?<=\\s)-{1,2}[\\w-]+" },
  {
    cls: "tk-kw",
    re: "\\b(?:pip|python|python3|uvicorn|source|export|cp|setx|cd|mkdir|echo|venv)\\b",
  },
];

const HTML: Spec[] = [
  { cls: "tk-com", re: "<!--[\\s\\S]*?-->" },
  { cls: "tk-dec", re: "<!DOCTYPE[^>]*>" },
  { cls: "tk-str", re: "\"[^\"]*\"|'[^']*'" },
  { cls: "tk-kw", re: "</?[A-Za-z][\\w-]*|/?>" },
  { cls: "tk-fn", re: "[A-Za-z-]+(?==)" },
];

const LANGS: Record<FileLang, { specs: Spec[]; flags: string }> = {
  python: { specs: PYTHON, flags: "g" },
  yaml: { specs: YAML, flags: "gm" },
  bash: { specs: BASH, flags: "g" },
  html: { specs: HTML, flags: "g" },
  text: { specs: [], flags: "g" },
};

/** Разбивает код на токены и раскладывает их по строкам. */
export function tokenizeToLines(code: string, lang: FileLang): Tok[][] {
  const { specs, flags } = LANGS[lang];
  const toks: Tok[] = [];

  if (specs.length > 0) {
    const re = new RegExp(specs.map((s) => "(" + s.re + ")").join("|"), flags);
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      if (m.index > last) toks.push({ cls: null, text: code.slice(last, m.index) });
      let gi = 0;
      for (let i = 1; i < m.length; i++) {
        if (m[i] !== undefined) {
          gi = i - 1;
          break;
        }
      }
      toks.push({ cls: specs[gi].cls, text: m[0] });
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < code.length) toks.push({ cls: null, text: code.slice(last) });
  } else {
    toks.push({ cls: null, text: code });
  }

  const lines: Tok[][] = [[]];
  for (const t of toks) {
    const parts = t.text.split("\n");
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ cls: t.cls, text: p });
    });
  }
  return lines;
}
