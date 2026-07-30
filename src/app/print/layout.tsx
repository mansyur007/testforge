import "./print.css";
import { NOINDEX } from "@/lib/seo";

// F-40: print documents contain project data — never indexable. Pages under
// /print set only their own title, so this merges down untouched.
export const metadata = { robots: NOINDEX };

// F-35: minimal document layout for the /print route group. No app shell, no
// dark sidebar — a plain white paginated document that maps 1:1 to the paper
// output. The next/font CSS variables set on <body> by the root layout carry
// through, so var(--font-display/-sans/-mono) resolve here too. Auth is
// enforced per-page (requireSession + memberScope), never here.
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="tf-print-doc">{children}</div>;
}
