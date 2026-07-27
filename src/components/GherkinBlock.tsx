import { tokenizeGherkinLine, type GherkinLineType } from "@/lib/gherkin";

// F-27: read-only syntax-highlighted Gherkin scenario body. Server component
// (no interactivity needed) — used on the case detail page and anywhere else
// a stored `{gherkin}` step needs to render nicely instead of a plain blob.

const LINE_CLASS: Record<GherkinLineType, string> = {
  feature: "text-accent-soft-fg font-semibold",
  scenario: "text-content-strong font-semibold",
  step: "text-content",
  tag: "text-success",
  comment: "text-content-subtle italic",
  table: "text-warning-soft-fg",
  text: "text-content",
};

export function GherkinBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <pre
      data-testid="gherkin-block"
      className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-canvas p-4 font-mono text-xs leading-relaxed"
    >
      {lines.map((line, i) => {
        const token = tokenizeGherkinLine(line);
        const isHeader = token.type === "feature" || token.type === "scenario";
        return (
          <div key={i} className={LINE_CLASS[token.type]}>
            {token.keyword ? (
              <>
                <span className="text-accent-soft-fg">{token.keyword}</span>
                {isHeader ? (token.rest ? `: ${token.rest}` : ":") : ` ${token.rest}`}
              </>
            ) : (
              line || " "
            )}
          </div>
        );
      })}
    </pre>
  );
}
