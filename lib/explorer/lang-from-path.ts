import type { CodeLanguage } from "@/components/explorer/code-viewer";

/** Extensión de ruta de archivo → lenguaje del visor del explorador. */
export function langFromPath(p: string): CodeLanguage {
  const ext = p.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "json" || ext === "jsonc") return "json";
  if (ext === "md" || ext === "mdx" || ext === "mdc") return "markdown";
  if (ext === "yaml" || ext === "yml") return "yaml";
  if (["ts", "tsx", "mts", "cts"].includes(ext)) return "typescript";
  if (["js", "jsx", "mjs", "cjs"].includes(ext)) return "javascript";
  if (ext === "sh" || ext === "bash" || ext === "zsh") return "shell";
  if (ext === "css" || ext === "scss") return "css";
  if (ext === "toml") return "toml";
  if (ext === "sql") return "sql";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "xml" || ext === "svg") return "xml";
  if (ext === "py") return "python";
  if (ext === "dockerfile" || p.toLowerCase().includes("dockerfile")) return "shell";
  return "plain";
}
