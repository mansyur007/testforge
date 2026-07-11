import { XMLParser } from "fast-xml-parser";
import { ResultParseError, toArray, type NormalizedResults, type NormalizedTest } from "./types";

type NUnitFailure = { message?: string };
type NUnitTestCase = {
  name?: string;
  fullname?: string;
  classname?: string;
  result?: string; // Passed | Failed | Skipped | Inconclusive
  duration?: string; // seconds, real number
  failure?: NUnitFailure;
};
type NUnitTestSuite = {
  "test-suite"?: NUnitTestSuite | NUnitTestSuite[];
  "test-case"?: NUnitTestCase | NUnitTestCase[];
};
type NUnitDoc = {
  "test-run"?: NUnitTestSuite;
};

function statusFor(result: string | undefined): NormalizedTest["status"] {
  const r = (result ?? "").toLowerCase();
  if (r === "passed") return "PASSED";
  if (r === "failed") return "FAILED";
  return "SKIPPED"; // Skipped, Inconclusive
}

function collectCases(node: NUnitTestSuite | undefined, out: NormalizedTest[]) {
  if (!node) return;
  for (const tc of toArray(node["test-case"])) {
    out.push({
      name: String(tc.fullname ?? tc.name ?? ""),
      classname: tc.classname ? String(tc.classname) : undefined,
      status: statusFor(tc.result),
      timeSeconds: parseFloat(String(tc.duration ?? "0")) || 0,
      message: tc.failure?.message,
    });
  }
  for (const suite of toArray(node["test-suite"])) collectCases(suite, out);
}

export function parseNUnit3(xml: string): NormalizedResults {
  let parsed: NUnitDoc;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    }).parse(xml) as NUnitDoc;
  } catch {
    throw new ResultParseError("Invalid XML");
  }

  const tests: NormalizedTest[] = [];
  collectCases(parsed["test-run"], tests);
  if (!tests.length)
    throw new ResultParseError("No <test-case> found in the NUnit3 result file");

  return { tests };
}
