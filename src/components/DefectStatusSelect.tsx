"use client";

import { useTransition } from "react";
import { changeDefectStatus } from "@/app/actions/defects";
import { DEFECT_STATUSES, DEFECT_STATUS_BADGES, type DefectStatus } from "@/lib/defects";

// F-26: inline status changer on a defect card/detail page — moves the
// defect between board columns without a page navigation (same pattern as
// CasesTable's inline priority dropdown).
export function DefectStatusSelect({
  defectId,
  status,
  className = "",
}: {
  defectId: string;
  status: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      aria-label="Defect status"
      data-testid={`defect-status-select-${defectId}`}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("defectId", defectId);
        fd.set("status", e.target.value);
        startTransition(async () => {
          await changeDefectStatus(fd);
        });
      }}
      className={`cursor-pointer rounded-lg border-0 px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 ${DEFECT_STATUS_BADGES[status as DefectStatus] ?? DEFECT_STATUS_BADGES.OPEN} ${className}`}
    >
      {DEFECT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
