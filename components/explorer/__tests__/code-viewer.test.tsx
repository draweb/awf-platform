import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CodeViewer } from "../code-viewer";

describe("CodeViewer", () => {
  it("JSON válido incluye clases de syntax y números de línea", () => {
    const json = `{\n  "a": 1\n}`;
    const html = renderToStaticMarkup(createElement(CodeViewer, { content: json, language: "json" }));
    expect(html).toContain("syntax-key");
    expect(html).toContain("syntax-number");
    expect(html).toContain("1\n2\n3");
    expect(html).toContain("Copiar");
  });

  it("markdown en modo lectura usa vista previa y encabezados renderizados", () => {
    const html = renderToStaticMarkup(
      createElement(CodeViewer, { content: "# Hola\n\nPárrafo.", language: "markdown" }),
    );
    expect(html).toContain("explorer-md-preview");
    expect(html).toContain("<h1>");
    expect(html).toContain("Hola");
    expect(html).toContain("Párrafo");
    expect(html).not.toContain("syntax-key");
    expect(html).toContain("Lectura");
    expect(html).toContain("Fuente");
  });

  it("markdown con fence renderiza pre/code con saltos de línea", () => {
    const md = "```\na\nb\n```";
    const html = renderToStaticMarkup(createElement(CodeViewer, { content: md, language: "markdown" }));
    expect(html).toContain("<pre>");
    expect(html).toContain("<code>");
    expect(html).toMatch(/a\s*\n\s*b|a[\s\S]*b/);
  });

  it("frontmatter inicial muestra panel colapsable y cuerpo en preview", () => {
    const md = "---\ntitle: X\n---\n\n# Cuerpo";
    const html = renderToStaticMarkup(createElement(CodeViewer, { content: md, language: "markdown" }));
    expect(html).toContain("Frontmatter (YAML)");
    expect(html).toContain("syntax-key");
    expect(html).toContain("Cuerpo");
  });

  it("javascript (p. ej. .mjs) usa resaltado y un solo overflow-auto para evitar doble scrollbar", () => {
    const html = renderToStaticMarkup(
      createElement(CodeViewer, { content: 'import x from "y";\nconst a = 1;', language: "javascript" }),
    );
    expect(html).toContain("syntax-keyword");
    expect(html).toContain("import");
    expect((html.match(/overflow-auto/g) ?? []).length).toBe(1);
    expect(html).not.toContain("overflow-x-auto");
  });
});
