import { XMLParser } from "fast-xml-parser";
import { CASE_TYPES } from "@/lib/constants";
import { toArray, ImportParseError, type ImportedCase, type ParsedImport } from "./types";

// F-22: TestRail suite XML export.
//
// Assumed shape (TestRail's XML export isn't machine-readable-documented, so
// this is reverse-engineered from public exports; the parser is permissive
// about the two priority/type encodings TestRail is known to emit):
//
// <suite>
//   <name>Suite name</name>
//   <sections>
//     <section>
//       <name>Section</name>
//       <sections>...</sections>              (nested sub-sections)
//       <cases>
//         <case>
//           <title>Case title</title>
//           <priority>4</priority>             (numeric id OR text label)
//           <type>Functional</type>            (text label OR numeric id)
//           <custom>
//             <preconds>...</preconds>
//             <steps_separated>                 (aka custom_steps_separated)
//               <step><content>Action</content><expected>Expected</expected></step>
//             </steps_separated>
//             <steps>Freeform text fallback</steps>
//           </custom>
//         </case>
//       </cases>
//     </section>
//   </sections>
// </suite>

// TestRail's default priority scale: 1=Low, 2=Medium, 3=High, 4=Critical.
const PRIORITY_BY_ID: Record<string, string> = {
  "1": "LOW",
  "2": "MEDIUM",
  "3": "HIGH",
  "4": "CRITICAL",
};
const PRIORITY_BY_NAME: Record<string, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};

const TYPE_BY_NAME: Record<string, string> = {
  functional: "FUNCTIONAL",
  regression: "REGRESSION",
  performance: "PERFORMANCE",
  security: "SECURITY",
  "smoke & sanity": "SMOKE",
  smoke: "SMOKE",
  acceptance: "FUNCTIONAL",
  automated: "FUNCTIONAL",
  compatibility: "FUNCTIONAL",
  destructive: "FUNCTIONAL",
  usability: "FUNCTIONAL",
  other: "FUNCTIONAL",
};

function mapPriority(raw: unknown, warnings: string[]): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "MEDIUM";
  const byId = PRIORITY_BY_ID[s];
  if (byId) return byId;
  const byName = PRIORITY_BY_NAME[s];
  if (byName) return byName;
  warnings.push(`unknown priority "${raw}" — defaulted to MEDIUM`);
  return "MEDIUM";
}

function mapType(raw: unknown, warnings: string[]): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "FUNCTIONAL";
  const byName = TYPE_BY_NAME[s];
  if (byName) return byName;
  if ((CASE_TYPES as readonly string[]).includes(s.toUpperCase())) return s.toUpperCase();
  warnings.push(`unknown type "${raw}" — defaulted to FUNCTIONAL`);
  return "FUNCTIONAL";
}

type TRStep = { content?: unknown; expected?: unknown };
type TRCase = {
  title?: unknown;
  priority?: unknown;
  type?: unknown;
  custom?: {
    preconds?: unknown;
    steps?: unknown;
    steps_separated?: { step?: TRStep | TRStep[] };
    custom_steps_separated?: { step?: TRStep | TRStep[] };
  };
};
type TRSection = {
  name?: unknown;
  sections?: { section?: TRSection | TRSection[] };
  cases?: { case?: TRCase | TRCase[] };
};
type TRDoc = { suite?: { name?: unknown; sections?: { section?: TRSection | TRSection[] } } };

function walkSection(section: TRSection, parentPath: string[], out: ImportedCase[]) {
  const name = String(section.name ?? "").trim() || "(unnamed section)";
  const path = [...parentPath, name];

  for (const c of toArray(section.cases?.case)) {
    const title = String(c.title ?? "").trim();
    if (!title) continue; // no title -> unrepresentable case, silently skipped (counted via toolWarnings by the caller)

    const warnings: string[] = [];
    const priority = mapPriority(c.priority, warnings);
    const type = mapType(c.type, warnings);

    const stepGroup = c.custom?.steps_separated ?? c.custom?.custom_steps_separated;
    const steps = toArray(stepGroup?.step).map((s) => ({
      action: String(s.content ?? "").trim(),
      expected: String(s.expected ?? "").trim(),
    }));
    if (steps.length === 0 && c.custom?.steps) {
      steps.push({ action: String(c.custom.steps).trim(), expected: "" });
    }

    out.push({
      suitePath: path,
      title,
      preconditions: c.custom?.preconds ? String(c.custom.preconds).trim() : undefined,
      steps,
      priority,
      type,
      tags: "",
      custom: {},
      warnings,
    });
  }

  for (const sub of toArray(section.sections?.section)) walkSection(sub, path, out);
}

export function parseTestRailXml(xml: string): ParsedImport {
  let doc: TRDoc;
  try {
    doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" }).parse(
      xml
    ) as TRDoc;
  } catch {
    throw new ImportParseError("Invalid XML");
  }
  if (!doc.suite) throw new ImportParseError("No <suite> root element found");

  const suiteName = String(doc.suite.name ?? "").trim();
  const cases: ImportedCase[] = [];
  for (const section of toArray(doc.suite.sections?.section))
    walkSection(section, suiteName ? [suiteName] : [], cases);

  if (!cases.length)
    throw new ImportParseError("No test cases found (each <section> needs a <cases><case> with a <title>)");

  return { cases, toolWarnings: [] };
}
