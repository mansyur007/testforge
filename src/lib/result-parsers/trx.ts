import { XMLParser } from "fast-xml-parser";
import { ResultParseError, toArray, type NormalizedResults } from "./types";

// MSTest / vstest.console .trx format. Namespace-qualified
// (xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010") but always
// as the default namespace in practice, so element names parse unprefixed.
type TrxUnitTestResult = {
  testId: string;
  testName: string;
  duration?: string; // "hh:mm:ss.fffffff"
  outcome?: string;
  Output?: { ErrorInfo?: { Message?: string } };
};
type TrxUnitTest = {
  id: string;
  TestMethod?: { className?: string };
};
type TrxDoc = {
  TestRun?: {
    Results?: { UnitTestResult?: TrxUnitTestResult | TrxUnitTestResult[] };
    TestDefinitions?: { UnitTest?: TrxUnitTest | TrxUnitTest[] };
  };
};

function parseTrxDuration(d: string | undefined): number {
  if (!d) return 0;
  const [h, m, s] = d.split(":");
  const hours = parseInt(h, 10) || 0;
  const minutes = parseInt(m, 10) || 0;
  const seconds = parseFloat(s) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseTrx(xml: string): NormalizedResults {
  let parsed: TrxDoc;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    }).parse(xml) as TrxDoc;
  } catch {
    throw new ResultParseError("Invalid XML");
  }

  const run = parsed.TestRun;
  const results = toArray(run?.Results?.UnitTestResult);
  if (!results.length)
    throw new ResultParseError("No <UnitTestResult> found in the TRX file");

  const classnameById = new Map<string, string>();
  for (const ut of toArray(run?.TestDefinitions?.UnitTest)) {
    if (ut.TestMethod?.className) classnameById.set(ut.id, ut.TestMethod.className);
  }

  return {
    tests: results.map((r) => {
      const outcome = (r.outcome ?? "").toLowerCase();
      const status =
        outcome === "passed"
          ? "PASSED"
          : ["failed", "error", "timeout", "aborted"].includes(outcome)
            ? "FAILED"
            : "SKIPPED"; // NotExecuted, Inconclusive, Disconnected, Pending, …
      return {
        name: String(r.testName ?? ""),
        classname: classnameById.get(r.testId),
        status,
        timeSeconds: parseTrxDuration(r.duration),
        message: r.Output?.ErrorInfo?.Message,
      };
    }),
  };
}
