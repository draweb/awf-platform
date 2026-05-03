"use client";

/**
 * Minimal Markdown → HTML without external deps.
 * Handles: # headings, - lists, ``` code fences, **bold**, `inline code`, paragraphs.
 */
function renderMarkdown(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  let inCode = false;

  for (const raw of lines) {
    const line = raw;

    if (/^```/.test(line)) {
      if (inCode) {
        out.push("</code></pre>");
        inCode = false;
      } else {
        out.push('<pre class="bg-footer border border-border rounded p-3 my-2 font-mono text-[12px] text-on-surface overflow-x-auto"><code>');
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      out.push(escapeHtml(line));
      out.push("\n");
      continue;
    }

    if (/^#{1}\s/.test(line)) {
      out.push(`<h1 class="text-lg font-bold text-primary mb-2 mt-4">${inline(line.replace(/^#\s+/, ""))}</h1>`);
    } else if (/^#{2}\s/.test(line)) {
      out.push(`<h2 class="text-base font-semibold text-tertiary mb-1 mt-3">${inline(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#{3,6}\s/.test(line)) {
      out.push(`<h3 class="text-sm font-medium text-on-surface-variant mb-1 mt-2">${inline(line.replace(/^#{3,6}\s+/, ""))}</h3>`);
    } else if (/^-\s/.test(line)) {
      out.push(`<li class="ml-4 list-disc text-[13px] text-on-surface leading-relaxed">${inline(line.replace(/^-\s+/, ""))}</li>`);
    } else if (line.trim() === "") {
      out.push('<div class="h-3"></div>');
    } else {
      out.push(`<p class="text-[13px] text-on-surface leading-relaxed">${inline(line)}</p>`);
    }
  }

  if (inCode) out.push("</code></pre>");
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let r = escapeHtml(s);
  r = r.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  r = r.replace(/`(.+?)`/g, '<code class="bg-footer px-1 rounded text-[12px] font-mono text-secondary">$1</code>');
  return r;
}

type Props = { value: string };

export function MarkdownPreview({ value }: Props) {
  const html = renderMarkdown(value);
  return (
    <div className="flex-1 p-6 overflow-y-auto ws-scrollbar">
      <div
        className="max-w-4xl mx-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
