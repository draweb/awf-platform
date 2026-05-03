import { describe, expect, it } from "vitest";
import { splitMarkdownFrontmatter } from "./split-markdown-frontmatter";

describe("splitMarkdownFrontmatter", () => {
  it("sin frontmatter", () => {
    const r = splitMarkdownFrontmatter("# Hola\n\nx");
    expect(r.frontmatter).toBeNull();
    expect(r.body).toBe("# Hola\n\nx");
  });

  it("extrae bloque y cuerpo", () => {
    const src = "---\nname: x\ndescription: y\n---\n\n# T\n";
    const r = splitMarkdownFrontmatter(src);
    expect(r.frontmatter).toContain("name: x");
    expect(r.body.trim()).toBe("# T");
  });

  it("no confunde con --- en medio sin apertura", () => {
    const r = splitMarkdownFrontmatter("a\n---\nb");
    expect(r.frontmatter).toBeNull();
  });
});
