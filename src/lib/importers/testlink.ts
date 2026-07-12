import { XMLParser } from "fast-xml-parser";
import { toArray, ImportParseError, type ImportedCase, type ParsedImport } from "./types";

// F-22: TestLink test-suite XML export.
//
// <testsuite name="Auth">
//   <testsuite name="Login">
//     <testcase name="Valid login">
//       <summary>Description text</summary>
//       <preconditions>...</preconditions>
//       <importance>3</importance>          (1=Low, 2=Medium, 3=High — TestLink's fixed scale)
//       <steps>
//         <step>
//           <step_number>1</step_number>
//           <actions>Do X</actions>
//           <expectedresults>Y happens</expectedresults>
//         </step>
//       </steps>
//     </testcase>
//   </testsuite>
// </testsuite>

const IMPORTANCE_MAP: Record<string, string> = {
  "1": "LOW",
  "2": "MEDIUM",
  "3": "HIGH",
};

function mapImportance(raw: unknown, warnings: string[]): string {
  const s = String(raw ?? "").trim();
  if (!s) return "MEDIUM";
  const mapped = IMPORTANCE_MAP[s];
  if (mapped) return mapped;
  warnings.push(`unknown importance "${raw}" — defaulted to MEDIUM`);
  return "MEDIUM";
}

type TLStep = { actions?: unknown; expectedresults?: unknown };
type TLCase = {
  name?: string;
  summary?: unknown;
  preconditions?: unknown;
  importance?: unknown;
  steps?: { step?: TLStep | TLStep[] };
};
type TLSuite = {
  name?: string;
  testsuite?: TLSuite | TLSuite[];
  testcase?: TLCase | TLCase[];
};
type TLDoc = { testsuite?: TLSuite };

function walkSuite(suite: TLSuite, parentPath: string[], out: ImportedCase[]) {
  const name = String(suite.name ?? "").trim() || "(unnamed suite)";
  const path = [...parentPath, name];

  for (const c of toArray(suite.testcase)) {
    const title = String(c.name ?? "").trim();
    if (!title) continue;

    const warnings: string[] = [];
    out.push({
      suitePath: path,
      title,
      description: c.summary ? String(c.summary).trim() : undefined,
      preconditions: c.preconditions ? String(c.preconditions).trim() : undefined,
      steps: toArray(c.steps?.step).map((s) => ({
        action: String(s.actions ?? "").trim(),
        expected: String(s.expectedresults ?? "").trim(),
      })),
      priority: mapImportance(c.importance, warnings),
      type: "FUNCTIONAL", // TestLink has no direct analog to our case `type`
      tags: "",
      custom: {},
      warnings,
    });
  }

  for (const sub of toArray(suite.testsuite)) walkSuite(sub, path, out);
}

export function parseTestLinkXml(xml: string): ParsedImport {
  let doc: TLDoc;
  try {
    doc = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" }).parse(
      xml
    ) as TLDoc;
  } catch {
    throw new ImportParseError("Invalid XML");
  }
  if (!doc.testsuite) throw new ImportParseError("No root <testsuite> element found");

  const cases: ImportedCase[] = [];
  walkSuite(doc.testsuite, [], cases);

  if (!cases.length)
    throw new ImportParseError("No <testcase> with a name attribute found");

  return { cases, toolWarnings: [] };
}
