import { ImageResponse } from "next/og";
import { getPublicCertificate } from "@/lib/academy/certificates";

// A-07: the share card. This is the only reason the certificate is a page
// rather than a row on /academy/me — a link someone pastes into LinkedIn or a
// team channel has to render as the credential, not as a bare URL.
//
// Satori renders this: flexbox only, no grid, no absolute positioning, no
// client components — same constraints as src/app/opengraph-image.tsx, which is
// the file to copy from when changing it.
export const runtime = "nodejs";
export const alt = "TestForge QA Academy certificate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INDIGO = "#4f46e5";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

// The AnvilMark from src/components/icons.tsx as a data URI — Satori renders an
// <img> far more reliably than nested SVG elements.
const ANVIL = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="72" height="72">
    <g fill="#ffffff">
      <rect x="3.8" y="8" width="15" height="3.5" rx="1.1"/>
      <path d="M3.8 8.5 1.5 9.75 3.8 11Z"/>
      <path d="M9.4 11.5H14.6L17 17.4H7Z"/>
      <rect x="6.2" y="16.6" width="11.6" height="1.8" rx="0.7"/>
    </g>
    <g stroke="#c7d2fe" stroke-width="1.5" stroke-linecap="round" fill="none">
      <path d="M17 6.3 19 4.4"/>
      <path d="M19.7 8.2 21.7 7.6"/>
      <path d="M15 4.8 15.5 2.7"/>
    </g>
  </svg>`,
).toString("base64")}`;

export default async function Image({ params }: { params: { serial: string } }) {
  const cert = await getPublicCertificate(params.serial);

  // A hidden or unknown serial gets a card with no name and no achievement on
  // it. The page itself 404s, so this is only ever reached by a scraper that
  // fetched the image directly — and the one thing it must not do is leak the
  // holder of a certificate whose page has been taken down.
  const heading = cert?.heading ?? "QA Academy";
  const holder = cert?.holderName ?? "TestForge QA Academy";
  const subject = cert?.subject ?? "Free QA training, from fundamentals to automation";
  const score = cert?.scorePct ?? null;
  const serial = cert?.serial ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: "#ffffff",
          backgroundImage:
            "linear-gradient(135deg, #eef2ff 0%, #ffffff 45%, #ffffff 100%)",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: INDIGO,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ANVIL} width={42} height={42} alt="" />
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 18,
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            <span>Test</span>
            <span style={{ color: INDIGO }}>Forge</span>
            <span style={{ color: MUTED, marginLeft: 12, fontWeight: 600 }}>
              QA Academy
            </span>
          </div>
        </div>

        {/* The claim */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: INDIGO,
            }}
          >
            {heading}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            {holder}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 32,
              color: "#334155",
            }}
          >
            {subject}
          </div>
          {score !== null && (
            <div
              style={{
                display: "flex",
                marginTop: 22,
                alignSelf: "flex-start",
                padding: "8px 22px",
                borderRadius: 999,
                backgroundColor: "#e0e7ff",
                fontSize: 28,
                fontWeight: 700,
                color: "#3730a3",
              }}
            >
              Best passing score {score}%
            </div>
          )}
        </div>

        {/* Footer — the serial is what makes the card checkable, so it belongs
            on the image and not only on the page.

            "Practice record" rides with it on every card, not only the
            no-serial fallback (audit OBS-3). §7.4's honesty requirement is
            satisfied by the page, but the card is what a LinkedIn or Slack
            reader sees, and most of them never click through: a card that
            names a holder and a score with no qualifier is doing the claiming
            on its own. The full disclaimer stays on the page — two words here
            are enough to stop the image overstating, and short enough not to
            wrap at 1200px next to a 26-character serial. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${BORDER}`,
            paddingTop: 22,
            fontSize: 24,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", fontWeight: 600, color: INDIGO }}>
            testforge.emha.space
          </div>
          <div style={{ display: "flex" }}>
            {serial
              ? `Practice record · Serial ${serial}`
              : "Practice record — not a professional certification"}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
