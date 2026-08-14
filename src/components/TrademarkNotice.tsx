import { ISTQB_DISCLAIMER } from "@/content/academy";

/**
 * The non-affiliation notice required by docs/QA-ACADEMY.md §7.1 on every page
 * that names the certification scheme.
 *
 * A-06 put it on the roadmap, the exam pages and the certificate, which was
 * every page that named the scheme *at the time*: T5's own track and lesson
 * pages 404 while the track is a draft, so the gap only becomes a live one the
 * day its content publishes. This component and `Track.trademarkNotice` close
 * it in advance, so writing T5's lessons cannot quietly ship a page without it.
 *
 * A server component on purpose: `@/content/academy` is `server-only` (the
 * answer-key boundary, §2.2), so the constant cannot be imported into a client
 * component at all.
 */
export function TrademarkNotice({ className = "mt-10" }: { className?: string }) {
  return (
    <p
      data-testid="istqb-disclaimer"
      className={`${className} text-xs leading-relaxed text-content-muted`}
    >
      {ISTQB_DISCLAIMER}
    </p>
  );
}
