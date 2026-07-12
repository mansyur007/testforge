import ReactMarkdown, { type UrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// F-02: sanitized GitHub-flavored Markdown renderer. No raw HTML pass-through —
// rehype-sanitize strips everything outside the allowlist, so stored XSS can't
// execute. Styles live under .tf-markdown in globals.css.

// Extend the default schema just enough for GFM task lists (checkbox inputs)
// and fenced-code language classes.
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "input"],
  attributes: {
    ...defaultSchema.attributes,
    input: ["type", "checked", "disabled"],
    code: [...(defaultSchema.attributes?.code ?? [])],
  },
};

// Images may only come from our own attachment store or https; anything else
// (javascript:, data:, http:) is blanked. Links allow http(s)/mailto/anchor.
const urlTransform: UrlTransform = (url, key) => {
  if (key === "src") {
    return url.startsWith("/api/attachments/") || url.startsWith("https://")
      ? url
      : "";
  }
  return /^(https?:|mailto:|#|\/)/i.test(url) ? url : "";
};

export function Markdown({
  children,
  className = "",
  inline = false,
}: {
  children: string;
  className?: string;
  // F-16: render as an inline flow (paragraphs unwrapped) so mention chips can
  // sit inline between text fragments without forcing block breaks.
  inline?: boolean;
}) {
  if (!children || !children.trim()) return null;
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={`tf-markdown text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        urlTransform={urlTransform}
        components={{
          a: (props) => {
            const { node: _node, ...rest } = props;
            void _node;
            return <a {...rest} target="_blank" rel="noreferrer" />;
          },
          ...(inline
            ? {
                p: (props) => {
                  const { node: _node, ...rest } = props;
                  void _node;
                  return <span {...rest} />;
                },
              }
            : {}),
        }}
      >
        {children}
      </ReactMarkdown>
    </Wrapper>
  );
}
