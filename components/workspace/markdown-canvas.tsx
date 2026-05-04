"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
};

function lineHint(line: string): string {
  if (/^#{1}\s/.test(line)) return "text-primary";
  if (/^#{2,6}\s/.test(line)) return "text-tertiary";
  if (/^-\s/.test(line)) return "text-secondary";
  if (/^```/.test(line)) return "text-outline";
  if (/^>\s/.test(line)) return "text-tertiary";
  if (line.startsWith("|")) return "text-secondary";
  return "text-outline/40";
}

export function MarkdownCanvas({ value, onChange, textareaRef: externalRef }: Props) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const lineGutterRef = useRef<HTMLDivElement>(null);
  const taRef = externalRef ?? internalRef;
  const [focused, setFocused] = useState(false);

  const lines = value.split("\n");
  const lineCount = lines.length;
  const gutterLines = Math.max(lineCount, 30);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
    [onChange],
  );

  const syncScroll = useCallback(() => {
    const ta = taRef.current;
    const gutter = lineGutterRef.current;
    if (ta && gutter) gutter.scrollTop = ta.scrollTop;
  }, [taRef]);

  return (
    <div
      className={`flex-1 flex overflow-hidden markdown-editor-bg relative transition-colors ${
        focused ? "ring-1 ring-inset ring-primary-container/30" : ""
      }`}
    >
      {/* Line numbers gutter — scrolls with textarea */}
      <div
        ref={lineGutterRef}
        className="w-12 pt-4 pb-4 text-right pr-2.5 font-mono text-[11px] select-none border-r border-border/30 bg-background/60 shrink-0 overflow-hidden"
      >
        {Array.from({ length: gutterLines }, (_, i) => (
          <div
            key={i}
            className={`h-[1.625rem] leading-relaxed ${
              i < lineCount ? lineHint(lines[i] ?? "") : "text-outline/15"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Textarea — the only editable surface */}
      <div className="flex-1 relative min-w-0">
        <textarea
          ref={taRef}
          value={value}
          onChange={handleChange}
          onScroll={syncScroll}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          spellCheck={false}
          placeholder="Escribí tu Markdown aquí…"
          className="absolute inset-0 w-full h-full pt-4 pb-4 px-5 font-mono text-[13px] leading-relaxed text-on-surface bg-transparent caret-primary resize-none outline-none ws-scrollbar placeholder:text-outline/25"
        />
      </div>
    </div>
  );
}
