import { XMLParser } from "fast-xml-parser";
import { ResultParseError, toArray, type NormalizedResults } from "./types";

type XunitFailure = { message?: string };
type XunitTest = {
  name?: string;
  type?: string;
  method?: string;
  time?: string;
  result?: string; // Pass | Fail | Skip
  failure?: XunitFailure;
};
type XunitCollection = { test?: XunitTest | XunitTest[] };
type XunitAssembly = { collection?: XunitCollection | XunitCollection[] };
type XunitDoc = { assemblies?: { assembly?: XunitAssembly | XunitAssembly[] } };

export function parseXUnit2(xml: string): NormalizedResults {
  let parsed: XunitDoc;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    }).parse(xml) as XunitDoc;
  } catch {
    throw new ResultParseError("Invalid XML");
  }

  const assemblies = toArray(parsed.assemblies?.assembly);
  const collections = assemblies.flatMap((a) => toArray(a.collection));
  const tests = collections.flatMap((c) => toArray(c.test));
  if (!tests.length)
    throw new ResultParseError("No <test> found in the xUnit.net v2 result file");

  return {
    tests: tests.map((t) => {
      const result = (t.result ?? "").toLowerCase();
      return {
        name: String(t.name ?? (t.type && t.method ? `${t.type}.${t.method}` : "")),
        classname: t.type ? String(t.type) : undefined,
        status:
          result === "pass" ? "PASSED" : result === "fail" ? "FAILED" : "SKIPPED",
        timeSeconds: parseFloat(String(t.time ?? "0")) || 0,
        message: t.failure?.message,
      };
    }),
  };
}
