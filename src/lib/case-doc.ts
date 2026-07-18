// F-35: shared data loader for the print/PDF case catalog document. Reuses the
// same building blocks the interactive pages use — the cases query, the F-04
// step-expansion loader (lib/steps), F-03 custom fields, F-18 requirements —
// so the printed document can never drift from what the app shows. Kept out of
// the page files so a route module only exports its React component.

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  caseDisplayId,
  parseTags,
  type TestStep,
} from "@/lib/constants";
import {
  expandSteps,
  isGherkinCaseSteps,
  loadStepGroups,
  type ExpandedStep,
} from "@/lib/steps";
import { sanitizeCaseFilters } from "@/lib/saved-views";

// Image attachments below this size render inline; larger ones (and non-images)
// are listed by filename + size only. A paper doc with 40 full-res screenshots
// is a printer DoS.
const INLINE_IMAGE_MAX_BYTES = 1024 * 1024; // 1 MB
// A case taller than roughly one page is marked tf-long so it may split rather
// than force a blank page ahead of an unsplittable 2-page block.
const LONG_CASE_STEP_THRESHOLD = 12;

export type PrintCustomField = { label: string; value: string; active: boolean };
export type PrintAttachment = {
  id: string;
  filename: string;
  sizeBytes: number;
  isImage: boolean;
};
export type PrintCase = {
  id: string;
  displayId: string;
  title: string;
  priority: string;
  type: string;
  status: string;
  tags: string[];
  assigneeName: string | null;
  estimateSeconds: number | null;
  requirements: { refId: string; title: string }[];
  preconditions: string;
  isGherkin: boolean;
  gherkin: string | null;
  steps: ExpandedStep[];
  expectedResult: string;
  customFields: PrintCustomField[];
  attachments: PrintAttachment[];
  long: boolean;
};
export type PrintSuiteGroup = { id: string; path: string; cases: PrintCase[] };
export type CaseCatalog = {
  suites: PrintSuiteGroup[];
  totalCases: number;
  suiteCount: number;
  scope: { label: string; chips: string[] } | null;
  singleCase: boolean;
};

type ProjectRef = { id: string; slug: string; name: string };

/** Build "Parent / Child" paths and a suite-tree DFS order (roots then
 * children, each by `order`) from a project's flat suite list. */
function buildSuiteIndex(
  suites: { id: string; name: string; parentId: string | null; order: number }[]
) {
  const byId = new Map(suites.map((s) => [s.id, s]));
  const pathOf = (id: string): string => {
    const parts: string[] = [];
    let cur: string | null = id;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const s = byId.get(cur);
      if (!s) break;
      parts.unshift(s.name);
      cur = s.parentId;
    }
    return parts.join(" / ");
  };
  const childrenOf = (parentId: string | null) =>
    suites
      .filter((s) => s.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  const order: string[] = [];
  const walk = (parentId: string | null) => {
    for (const s of childrenOf(parentId)) {
      order.push(s.id);
      walk(s.id);
    }
  };
  walk(null);
  const rank = new Map(order.map((id, i) => [id, i]));
  const descendants = (rootId: string): Set<string> => {
    const out = new Set<string>([rootId]);
    const stack = [rootId];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const c of childrenOf(cur)) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
    return out;
  };
  return { pathOf, rankOf: (id: string) => rank.get(id) ?? Infinity, descendants };
}

/** Load a project's suites and return path + tree-order helpers. Shared by the
 * run report so its per-suite grouping matches the catalog's. */
export async function loadSuiteIndex(projectId: string) {
  const suiteRows = await db.testSuite.findMany({
    where: { projectId },
    select: { id: true, name: true, parentId: true, order: true },
  });
  return buildSuiteIndex(suiteRows);
}

function formatCustomValue(
  type: string,
  raw: unknown,
  memberNames: Map<string, string>
): string | null {
  if (raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0))
    return null;
  if (type === "CHECKBOX") return raw ? "Yes" : "No";
  if (type === "USER") return memberNames.get(String(raw)) ?? String(raw);
  if (Array.isArray(raw)) return raw.map((x) => String(x)).join(", ");
  return String(raw);
}

/**
 * Load the catalog document data for a project, honoring the F-35 query params:
 * `caseId` (a one-case document, any status), `suiteId` (that subtree only),
 * `viewId` (apply an F-10 saved view's filter). With none, the default is every
 * ACTIVE case in the project, suite-tree order.
 */
export async function loadCaseCatalog(
  project: ProjectRef,
  opts: { suiteId?: string; viewId?: string; caseId?: string }
): Promise<CaseCatalog> {
  const suiteRows = await db.testSuite.findMany({
    where: { projectId: project.id },
    select: { id: true, name: true, parentId: true, order: true },
  });
  const idx = buildSuiteIndex(suiteRows);

  // Scope resolution + case selection.
  const where: Prisma.TestCaseWhereInput = { projectId: project.id, deletedAt: null };
  let scope: CaseCatalog["scope"] = null;
  const singleCase = !!opts.caseId;

  if (opts.caseId) {
    // A single-case document renders that exact case regardless of status.
    where.id = opts.caseId;
  } else {
    where.status = "ACTIVE";
    if (opts.viewId) {
      const view = await db.savedView.findFirst({
        where: { id: opts.viewId, projectId: project.id, entity: "CASES" },
      });
      if (view) {
        const filters = sanitizeCaseFilters(JSON.parse(view.filtersJson));
        const chips: string[] = [];
        if (filters.suite) {
          const inScope = idx.descendants(filters.suite);
          where.suiteId = { in: Array.from(inScope) };
          chips.push(`Suite: ${idx.pathOf(filters.suite)}`);
        }
        if (filters.priority) {
          where.priority = filters.priority;
          chips.push(`Priority: ${filters.priority}`);
        }
        if (filters.type) {
          where.type = filters.type;
          chips.push(`Type: ${filters.type}`);
        }
        if (filters.q) {
          where.title = { contains: filters.q };
          chips.push(`Search: “${filters.q}”`);
        }
        if (filters.tag) {
          where.tags = { contains: filters.tag };
          chips.push(`Tag: ${filters.tag}`);
        }
        scope = { label: `Saved view: ${view.name}`, chips };
      }
    } else if (opts.suiteId) {
      const inScope = idx.descendants(opts.suiteId);
      where.suiteId = { in: Array.from(inScope) };
      scope = { label: `Suite: ${idx.pathOf(opts.suiteId)}`, chips: [] };
    }
  }

  const cases = await db.testCase.findMany({
    where,
    orderBy: [{ order: "asc" }, { seq: "asc" }],
    include: {
      assignee: { select: { name: true } },
      requirements: {
        include: { requirement: { select: { refId: true, title: true } } },
      },
    },
  });

  const caseIds = cases.map((c) => c.id);
  const [stepGroups, fieldDefs, attachmentRows, members] = await Promise.all([
    loadStepGroups(project.id),
    db.customFieldDef.findMany({
      where: { projectId: project.id, entity: "CASE" },
      orderBy: { order: "asc" },
    }),
    caseIds.length
      ? db.attachment.findMany({
          where: { entityType: "CASE", entityId: { in: caseIds } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    db.projectMember.findMany({
      where: { projectId: project.id },
      select: { user: { select: { id: true, name: true } } },
    }),
  ]);
  const memberNames = new Map(members.map((m) => [m.user.id, m.user.name]));
  const attachmentsByCase = new Map<string, typeof attachmentRows>();
  for (const a of attachmentRows) {
    const list = attachmentsByCase.get(a.entityId) ?? [];
    list.push(a);
    attachmentsByCase.set(a.entityId, list);
  }

  const printCases = new Map<string | null, PrintCase[]>();
  for (const c of cases) {
    const rawSteps: TestStep[] = JSON.parse(c.stepsJson || "[]");
    const isGherkin = isGherkinCaseSteps(rawSteps);
    const steps = expandSteps(rawSteps, stepGroups);
    const custom: Record<string, unknown> = JSON.parse(c.customJson || "{}");
    const customFields: PrintCustomField[] = fieldDefs
      .map((d) => {
        const value = formatCustomValue(d.type, custom[d.key], memberNames);
        return value == null ? null : { label: d.label, value, active: d.active };
      })
      .filter((x): x is PrintCustomField => x !== null);
    const pc: PrintCase = {
      id: c.id,
      displayId: caseDisplayId(project.slug, c.seq),
      title: c.title,
      priority: c.priority,
      type: c.type,
      status: c.status,
      tags: parseTags(c.tags),
      assigneeName: c.assignee?.name ?? null,
      estimateSeconds: c.estimateSeconds,
      requirements: c.requirements.map((r) => ({
        refId: r.requirement.refId,
        title: r.requirement.title,
      })),
      preconditions: c.preconditions ?? "",
      isGherkin,
      gherkin: isGherkin ? (rawSteps[0] as { gherkin: string }).gherkin : null,
      steps,
      expectedResult: c.expectedResult ?? "",
      customFields,
      attachments: (attachmentsByCase.get(c.id) ?? []).map((a) => ({
        id: a.id,
        filename: a.filename,
        sizeBytes: a.sizeBytes,
        isImage:
          a.mimeType.startsWith("image/") && a.sizeBytes <= INLINE_IMAGE_MAX_BYTES,
      })),
      long: steps.length > LONG_CASE_STEP_THRESHOLD,
    };
    const key = c.suiteId ?? null;
    const list = printCases.get(key) ?? [];
    list.push(pc);
    printCases.set(key, list);
  }

  // Group into suites in tree order; null-suite cases trail as "Ungrouped".
  const groups: PrintSuiteGroup[] = [];
  const suiteKeys = Array.from(printCases.keys()).filter(
    (k): k is string => k !== null
  );
  suiteKeys.sort((a, b) => idx.rankOf(a) - idx.rankOf(b));
  for (const id of suiteKeys) {
    groups.push({ id, path: idx.pathOf(id) || "Suite", cases: printCases.get(id)! });
  }
  if (printCases.has(null)) {
    groups.push({ id: "none", path: "Ungrouped", cases: printCases.get(null)! });
  }

  return {
    suites: groups,
    totalCases: cases.length,
    suiteCount: groups.filter((g) => g.id !== "none").length,
    scope,
    singleCase,
  };
}
