import { XMLParser } from "fast-xml-parser";
import { ResultParseError, toArray, type NormalizedResults } from "./types";

type JUnitCase = {
  name: string;
  classname?: string;
  time?: string;
  failure?: unknown;
  error?: unknown;
  skipped?: unknown;
};
type JUnitSuite = { testcase?: JUnitCase | JUnitCase[] };
type JUnitDoc = {
  testsuites?: { testsuite?: JUnitSuite | JUnitSuite[] };
  testsuite?: JUnitSuite | JUnitSuite[];
};

export function parseJUnit(xml: string): NormalizedResults {
  let parsed: JUnitDoc;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    }).parse(xml) as JUnitDoc;
  } catch {
    throw new ResultParseError("Invalid XML");
  }

  const suites = toArray(
    parsed.testsuites ? parsed.testsuites.testsuite : parsed.testsuite
  );
  const testcases: JUnitCase[] = suites.flatMap((s) => toArray(s?.testcase));
  if (!testcases.length)
    throw new ResultParseError("No <testcase> found in the JUnit XML");

  return {
    tests: testcases.map((tc) => ({
      name: String(tc.name ?? ""),
      classname: tc.classname ? String(tc.classname) : undefined,
      status:
        tc.failure !== undefined || tc.error !== undefined
          ? "FAILED"
          : tc.skipped !== undefined
            ? "SKIPPED"
            : "PASSED",
      timeSeconds: parseFloat(String(tc.time ?? "0")) || 0,
    })),
  };
}
