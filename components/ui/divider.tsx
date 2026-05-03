type DividerProps = {
  text?: string;
};

export function Divider({ text }: DividerProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      {text && (
        <span className="font-[family-name:var(--font-label)] text-xs text-outline-variant uppercase">
          {text}
        </span>
      )}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
