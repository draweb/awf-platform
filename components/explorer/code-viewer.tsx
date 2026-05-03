"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitMarkdownFrontmatter } from "@/lib/explorer/split-markdown-frontmatter";

export type CodeLanguage =
  | "json"
  | "markdown"
  | "yaml"
  | "typescript"
  | "javascript"
  | "shell"
  | "css"
  | "toml"
  | "sql"
  | "html"
  | "xml"
  | "python"
  | "plain";

type MarkdownViewMode = "reading" | "source";

type CodeViewerProps = {
  content: string;
  language: CodeLanguage;
  className?: string;
  /** Nombre del archivo en la barra superior (tooltip + truncado). */
  fileLabel?: string | null;
};

const TS_KEYWORDS = new Set([
  "import", "export", "from", "const", "let", "var", "function", "async", "await",
  "return", "if", "else", "for", "while", "class", "interface", "type", "enum",
  "extends", "implements", "new", "this", "super", "throw", "try", "catch", "finally",
  "switch", "case", "break", "continue", "default", "typeof", "instanceof", "void",
  "delete", "in", "of", "as", "is", "readonly", "abstract", "static", "private",
  "protected", "public", "declare", "module", "namespace", "require",
]);

const PY_KEYWORDS = new Set([
  "import", "from", "def", "class", "return", "if", "elif", "else", "for", "while",
  "try", "except", "finally", "with", "as", "raise", "pass", "break", "continue",
  "and", "or", "not", "in", "is", "lambda", "yield", "async", "await", "True",
  "False", "None", "self",
]);

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP",
  "TABLE", "INDEX", "INTO", "VALUES", "SET", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
  "ON", "AND", "OR", "NOT", "NULL", "IS", "IN", "AS", "ORDER", "BY", "GROUP", "HAVING",
  "LIMIT", "OFFSET", "UNION", "ALL", "EXISTS", "BETWEEN", "LIKE", "DISTINCT", "PRIMARY",
  "KEY", "FOREIGN", "REFERENCES", "CASCADE", "DEFAULT", "CONSTRAINT", "ADD", "COLUMN",
  "TYPE", "ENUM", "VALUE", "BEGIN", "COMMIT", "ROLLBACK",
]);

const SHELL_KEYWORDS = new Set([
  "if", "then", "else", "elif", "fi", "for", "do", "done", "while", "until", "case",
  "esac", "function", "return", "exit", "export", "source", "local", "readonly",
  "set", "unset", "echo", "cd", "mkdir", "rm", "cp", "mv", "cat", "grep", "sed",
  "awk", "chmod", "chown", "curl", "wget",
]);

function highlightCodeLine(line: string, keywords: Set<string>): ReactNode {
  const parts: ReactNode[] = [];
  const trimmed = line.trimStart();
  const indent = line.slice(0, line.length - trimmed.length);
  if (indent) parts.push(<span key="ind">{indent}</span>);

  if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("--")) {
    parts.push(<span key="cmt" className="syntax-comment">{trimmed}</span>);
    return parts;
  }

  const tokens = trimmed.split(/(\s+|[{}()[\];,.:=<>!&|+\-*/^~?@]|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/);
  tokens.forEach((tok, i) => {
    if (!tok) return;
    if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith("`")) {
      parts.push(<span key={i} className="syntax-string">{tok}</span>);
    } else if (/^-?\d+\.?\d*(?:[eE][+-]?\d+)?$/.test(tok)) {
      parts.push(<span key={i} className="syntax-number">{tok}</span>);
    } else if (keywords.has(tok) || keywords.has(tok.toUpperCase())) {
      parts.push(<span key={i} className="syntax-keyword">{tok}</span>);
    } else if (tok === "true" || tok === "false" || tok === "null" || tok === "undefined") {
      parts.push(<span key={i} className="syntax-boolean">{tok}</span>);
    } else {
      parts.push(<span key={i}>{tok}</span>);
    }
  });
  return parts;
}

function highlightJsonLine(line: string): ReactNode[] {
  const trimmed = line.trimStart();
  const indent = line.slice(0, line.length - trimmed.length);

  const parts: ReactNode[] = [];
  if (indent) parts.push(<span key="ind">{indent}</span>);

  const keyMatch = /^("(?:[^"\\]|\\.)*")\s*:/.exec(trimmed);
  if (keyMatch) {
    parts.push(<span key="k" className="syntax-key">{keyMatch[1]}</span>);
    let rest = trimmed.slice(keyMatch[0].length);
    parts.push(<span key="c">{rest.match(/^\s*/)?.[0] ?? ""}</span>);
    rest = rest.replace(/^\s*/, "");
    if (rest.startsWith('"')) {
      const end = rest.indexOf('"', 1);
      const str = end >= 0 ? rest.slice(0, end + 1) : rest;
      parts.push(<span key="s" className="syntax-string">{str}</span>);
      parts.push(<span key="r">{rest.slice(str.length)}</span>);
    } else if (/^(true|false)\b/.test(rest)) {
      const m = /^(true|false)\b/.exec(rest)!;
      parts.push(<span key="b" className="syntax-boolean">{m[1]}</span>);
      parts.push(<span key="r2">{rest.slice(m[0].length)}</span>);
    } else if (/^-?\d+\.?\d*(?:[eE][+-]?\d+)?\b/.test(rest)) {
      const m = /^-?\d+\.?\d*(?:[eE][+-]?\d+)?\b/.exec(rest)!;
      parts.push(<span key="n" className="syntax-number">{m[0]}</span>);
      parts.push(<span key="r3">{rest.slice(m[0].length)}</span>);
    } else if (rest.startsWith("null")) {
      parts.push(<span key="nu" className="syntax-null">null</span>);
      parts.push(<span key="r4">{rest.slice(4)}</span>);
    } else {
      parts.push(<span key="plain">{rest}</span>);
    }
    return parts;
  }

  if (/^[{}\[\],]+$/.test(trimmed)) {
    parts.push(<span className="text-outline">{trimmed}</span>);
    return parts;
  }
  if (trimmed.startsWith('"')) {
    parts.push(<span className="syntax-string" key="str">{trimmed}</span>);
    return parts;
  }
  parts.push(<span key="f">{line}</span>);
  return parts;
}

function highlightYamlLine(line: string): ReactNode {
  const trimmed = line.trimStart();
  const indent = line.slice(0, line.length - trimmed.length);
  const parts: ReactNode[] = [];
  if (indent) parts.push(<span key="ind">{indent}</span>);

  if (trimmed.startsWith("#")) {
    parts.push(<span key="cmt" className="syntax-comment">{trimmed}</span>);
    return parts;
  }

  const keyMatch = /^([a-zA-Z0-9_.-]+)\s*:/.exec(trimmed);
  if (keyMatch) {
    parts.push(<span key="k" className="syntax-key">{keyMatch[1]}</span>);
    const rest = trimmed.slice(keyMatch[1].length);
    const colonAndVal = rest;
    if (colonAndVal.includes('"')) {
      const qi = colonAndVal.indexOf('"');
      parts.push(<span key="pre">{colonAndVal.slice(0, qi)}</span>);
      parts.push(<span key="s" className="syntax-string">{colonAndVal.slice(qi)}</span>);
    } else {
      parts.push(<span key="v">{colonAndVal}</span>);
    }
    return parts;
  }

  if (trimmed.startsWith("- ")) {
    parts.push(<span key="dash" className="text-outline">- </span>);
    parts.push(<span key="val">{trimmed.slice(2)}</span>);
    return parts;
  }

  parts.push(<span key="f">{trimmed}</span>);
  return parts;
}

function keywordsForLang(lang: CodeLanguage): Set<string> | null {
  switch (lang) {
    case "typescript": return TS_KEYWORDS;
    case "javascript": return TS_KEYWORDS;
    case "python": return PY_KEYWORDS;
    case "sql": return SQL_KEYWORDS;
    case "shell": return SHELL_KEYWORDS;
    default: return null;
  }
}

function MarkdownFrontmatterPanel({ yaml }: { yaml: string }) {
  const fmLines = yaml.split(/\r?\n/);
  return (
    <details className="mb-4 rounded-xs border border-border bg-surface-container-low/40" defaultOpen>
      <summary className="cursor-pointer select-none px-3 py-2 font-[family-name:var(--font-label)] text-[10px] uppercase tracking-wider text-outline hover:text-on-surface-variant">
        Frontmatter (YAML)
      </summary>
      <div className="border-t border-border px-2 py-2 font-mono text-[11px] leading-relaxed">
        {fmLines.map((line, i) => (
          <div key={i} className="whitespace-pre">
            {highlightYamlLine(line)}
          </div>
        ))}
      </div>
    </details>
  );
}

function MarkdownReadingPreview({ content }: { content: string }) {
  const { frontmatter, body } = useMemo(() => splitMarkdownFrontmatter(content), [content]);
  const md = body.trim() ? body : " ";
  return (
    <div className="max-w-[52rem] pb-8 font-sans">
      {frontmatter ? <MarkdownFrontmatterPanel yaml={frontmatter} /> : null}
      <article className="explorer-md-preview">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
      </article>
    </div>
  );
}

function EditorToolbar({
  fileLabel,
  showMarkdownToggle,
  markdownMode,
  onMarkdownMode,
  onCopy,
}: {
  fileLabel: string | null;
  showMarkdownToggle: boolean;
  markdownMode: MarkdownViewMode;
  onMarkdownMode: (m: MarkdownViewMode) => void;
  onCopy: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-background/55 px-3 py-1.5">
      <span
        className="block min-w-0 truncate text-[11px] font-mono text-on-surface-variant"
        title={fileLabel ?? undefined}
      >
        {fileLabel ?? "\u00a0"}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {showMarkdownToggle ? (
          <div className="flex rounded-xs border border-border p-0.5 text-[10px] font-medium text-on-surface-variant" role="group" aria-label="Modo Markdown">
            <button
              type="button"
              className={`rounded-xs px-2 py-0.5 transition-colors ${markdownMode === "reading" ? "bg-surface-container-low text-on-surface" : "hover:text-on-surface"}`}
              onClick={() => onMarkdownMode("reading")}
            >
              Lectura
            </button>
            <button
              type="button"
              className={`rounded-xs px-2 py-0.5 transition-colors ${markdownMode === "source" ? "bg-surface-container-low text-on-surface" : "hover:text-on-surface"}`}
              onClick={() => onMarkdownMode("source")}
            >
              Fuente
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onCopy}
          className="rounded-xs border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-outline hover:bg-surface-container-low hover:text-on-surface"
        >
          Copiar
        </button>
      </div>
    </div>
  );
}

export function CodeViewer({ content, language, className = "", fileLabel = null }: CodeViewerProps) {
  const lines = useMemo(() => content.split(/\r?\n/), [content]);
  const [markdownMode, setMarkdownMode] = useState<MarkdownViewMode>("reading");

  useEffect(() => {
    setMarkdownMode("reading");
  }, [content, language]);

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      /* ignore */
    }
  }, [content]);

  /** Siempre antes de cualquier return: mismo orden de hooks en cada render. */
  const body = useMemo(() => {
    if (language === "json") {
      let invalid = false;
      try {
        JSON.parse(content);
      } catch {
        invalid = true;
      }
      if (invalid) {
        return (
          <>
            <span className="mb-2 block text-xs text-yellow-500/90">JSON inválido — vista raw</span>
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre text-on-surface-variant">
                {line}
              </div>
            ))}
          </>
        );
      }
      return lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          {highlightJsonLine(line)}
        </div>
      ));
    }

    if (language === "yaml") {
      return lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          {highlightYamlLine(line)}
        </div>
      ));
    }

    if (language === "markdown") {
      return lines.map((line, i) => (
        <div key={i} className="whitespace-pre text-on-surface-variant">
          {line}
        </div>
      ));
    }

    const keywords = keywordsForLang(language);
    if (keywords) {
      return lines.map((line, i) => (
        <div key={i} className="whitespace-pre">
          {highlightCodeLine(line, keywords)}
        </div>
      ));
    }

    return lines.map((line, i) => (
      <div key={i} className="whitespace-pre-wrap break-words text-on-surface-variant">
        {line}
      </div>
    ));
  }, [content, language, lines]);

  const readingMarkdown = language === "markdown" && markdownMode === "reading";

  /** Raíz: solo flex + clip; un único hijo con overflow-auto evita doble scrollbar (panel + viewport). */
  const rootChrome = `flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${className}`;

  if (readingMarkdown) {
    return (
      <div className={rootChrome}>
        <EditorToolbar
          fileLabel={fileLabel ?? null}
          showMarkdownToggle
          markdownMode={markdownMode}
          onMarkdownMode={setMarkdownMode}
          onCopy={copyAll}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-4 py-3 ws-scrollbar">
          <MarkdownReadingPreview content={content} />
        </div>
      </div>
    );
  }

  const lineNumbers = lines.map((_, i) => String(i + 1)).join("\n");

  return (
    <div className={rootChrome}>
      <EditorToolbar
        fileLabel={fileLabel ?? null}
        showMarkdownToggle={language === "markdown"}
        markdownMode={markdownMode}
        onMarkdownMode={setMarkdownMode}
        onCopy={copyAll}
      />
      {/* Un solo scroll vertical/horizontal; sin overflow-x en hijo para no anidar barras. */}
      <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-auto p-4 font-mono text-[12px] leading-6 text-on-surface-variant ws-scrollbar">
        <div className="shrink-0 select-none whitespace-pre border-r border-border pr-2 text-right text-[11px] tabular-nums text-outline/80">
          {lineNumbers}
        </div>
        <div className="min-w-0 flex-1">{body}</div>
      </div>
    </div>
  );
}
