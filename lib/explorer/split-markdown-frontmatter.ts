/**
 * Extrae el primer bloque YAML de frontmatter (`---` … `---`) del inicio del archivo.
 * Si no hay par válido, devuelve `frontmatter: null` y `body` igual al contenido original.
 */
export function splitMarkdownFrontmatter(content: string): { frontmatter: string | null; body: string } {
  const normalized = content.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r?\n/);
  if (lines.length < 2 || lines[0]?.trim() !== "---") {
    return { frontmatter: null, body: content };
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      const fm = lines.slice(0, i + 1).join("\n");
      const body = lines.slice(i + 1).join("\n").replace(/^\n+/, "");
      return { frontmatter: fm, body };
    }
  }
  return { frontmatter: null, body: content };
}
