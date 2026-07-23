import Link from "next/link";
import { TFIcon } from "@/components/icons";

export type SuiteFolder = {
  id: string;
  name: string;
  href: string;
  /** Case di seluruh subtree, konsisten dengan badge di sidebar. */
  caseCount: number;
  childCount: number;
};

/**
 * Grid folder ala Drive di atas daftar case: isi "folder" yang sedang dibuka —
 * sub-suite dari suite aktif, atau suite root saat belum ada suite dipilih.
 * Kalau tidak ada sub-suite DAN tidak ada folder yang sedang dibuka (root),
 * grid ini tidak dirender sama sekali sehingga suite daun tetap langsung
 * memperlihatkan tabel case-nya. Kalau sebuah folder sedang dibuka tapi
 * kosong, section tetap tampil dengan empty state — bukan hilang total.
 */
export function SuiteFolderGrid({
  folders,
  open = false,
}: {
  folders: SuiteFolder[];
  /** Apakah sedang berada di dalam sebuah folder (bukan root suite list). */
  open?: boolean;
}) {
  if (folders.length === 0 && !open) return null;

  return (
    <section data-testid="suite-folder-grid" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Folders
      </h3>
      {folders.length === 0 ? (
        <p
          data-testid="suite-folder-grid-empty"
          className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-400"
        >
          No subfolders here.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
          {folders.map((f) => (
            <li key={f.id}>
              <Link
                href={f.href}
                data-testid={`suite-folder-card-${f.id}`}
                title={f.name}
                className="flex h-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <TFIcon
                  name="folder"
                  className="h-8 w-8 shrink-0 text-slate-400"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {f.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {f.caseCount} {f.caseCount === 1 ? "case" : "cases"}
                    {f.childCount > 0 &&
                      ` · ${f.childCount} ${f.childCount === 1 ? "subfolder" : "subfolders"}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
