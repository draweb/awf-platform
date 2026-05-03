type ArtifactStatus = "active" | "deprecated" | "archived";
type VersionStatus = "draft" | "review" | "published" | "deprecated" | "yanked";

type StatusBadgeProps =
  | { kind: "artifact"; status: ArtifactStatus }
  | { kind: "version"; status: VersionStatus };

const artifactStyles: Record<ArtifactStatus, string> = {
  active: "text-emerald-500",
  deprecated: "text-yellow-500",
  archived: "text-outline",
};

const versionStyles: Record<VersionStatus, string> = {
  draft: "text-outline",
  review: "text-secondary",
  published: "text-emerald-500",
  deprecated: "text-yellow-500",
  yanked: "text-red-500",
};

export function StatusBadge(props: StatusBadgeProps) {
  const label = props.status.toUpperCase();
  const colorClass =
    props.kind === "artifact" ? artifactStyles[props.status] : versionStyles[props.status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tighter ${colorClass}`}
    >
      <span className="w-2 h-2 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
