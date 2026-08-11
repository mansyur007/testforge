// A-03b: QA Academy is shipping track by track, so every surface that offers it
// says so. One component rather than five inline spans — the label has to read
// identically everywhere, otherwise "BETA" in the sidebar and "Beta" in the
// footer look like two different things.
export function BetaChip({
  tone = "default",
  className = "",
}: {
  /** `dark` is for the app sidebar, whose background is `bg-sidebar`. */
  tone?: "default" | "dark";
  className?: string;
}) {
  const colors =
    tone === "dark"
      ? "border-sidebar-border bg-sidebar-hover text-white"
      : "border-hairline bg-surface-muted text-content-muted";
  return (
    <span
      data-testid="beta-chip"
      className={`inline-flex shrink-0 items-center rounded border px-1 py-px text-[10px] font-semibold uppercase leading-none tracking-wide ${colors} ${className}`}
    >
      Beta
    </span>
  );
}
