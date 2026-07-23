import { ImageResponse } from "next/og";

// Kartu link preview (LinkedIn/WhatsApp/Slack/X) untuk halaman depan.
// Dirender Satori: flexbox saja, tanpa grid/absolute, tanpa komponen klien.
export const runtime = "nodejs";
export const alt =
  "TestForge — open source test case management. Free forever.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Warna landing page (aksen indigo, latar terang) — lihat src/app/page.tsx.
const INDIGO = "#4f46e5";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

// AnvilMark (src/components/icons.tsx) sebagai data URI: Satori merender <img>
// jauh lebih andal daripada elemen SVG bersarang.
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

const ROWS: { id: string; title: string; status: string; bg: string; fg: string }[] = [
  {
    id: "TC-WEB-001",
    title: "Valid login with registered email",
    status: "PASSED",
    bg: "#dcfce7",
    fg: "#15803d",
  },
  {
    id: "TC-WEB-003",
    title: "Lockout after 5 failed logins",
    status: "FAILED",
    bg: "#fee2e2",
    fg: "#b91c1c",
  },
  {
    id: "TC-WEB-004",
    title: "Checkout with valid credit card",
    status: "RETEST",
    bg: "#f3e8ff",
    fg: "#7e22ce",
  },
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
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
              width: 76,
              height: 76,
              borderRadius: 21,
              backgroundColor: INDIGO,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ANVIL} width={50} height={50} alt="" />
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 20,
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            <span>Test</span>
            <span style={{ color: INDIGO }}>Forge</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            Open source test case management.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INDIGO,
            }}
          >
            Free forever.
          </div>
        </div>

        {/* Baris test case — mengikuti ProductMockup di src/app/page.tsx */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 18,
            border: `2px solid ${BORDER}`,
            backgroundColor: "#ffffff",
            padding: 16,
          }}
        >
          {ROWS.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: i === 0 ? 0 : 10,
                padding: "10px 18px",
                borderRadius: 12,
                border: `2px solid #f1f5f9`,
              }}
            >
              <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
                {r.id}
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  marginLeft: 22,
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "5px 16px",
                  borderRadius: 999,
                  fontSize: 21,
                  fontWeight: 700,
                  backgroundColor: r.bg,
                  color: r.fg,
                }}
              >
                {r.status}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", fontWeight: 600, color: INDIGO }}>
            testforge.emha.space
          </div>
          <div style={{ display: "flex" }}>
            The free alternative to TestRail, Qase &amp; Zephyr
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
