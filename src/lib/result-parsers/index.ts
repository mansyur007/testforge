import { ResultParseError, type NormalizedResults } from "./types";
import { parseJUnit } from "./junit";
import { parseTrx } from "./trx";
import { parseNUnit3 } from "./nunit3";
import { parseXUnit2 } from "./xunit2";
import { parseCucumber } from "./cucumber";
import { parseMocha } from "./mocha";

export type ResultFormat = "junit" | "trx" | "nunit3" | "xunit2" | "cucumber" | "mocha";
export const RESULT_FORMATS: ResultFormat[] = [
  "junit",
  "trx",
  "nunit3",
  "xunit2",
  "cucumber",
  "mocha",
];

export { ResultParseError, type NormalizedResults, type NormalizedTest, type NormalizedStatus } from "./types";

// Auto-detect when `format` is omitted: JSON body → shape of parsed value;
// XML body → root element name.
export function detectFormat(text: string): ResultFormat {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let json: unknown;
    try {
      json = JSON.parse(trimmed);
    } catch {
      throw new ResultParseError("Could not detect format: invalid JSON");
    }
    if (Array.isArray(json)) return "cucumber";
    if (json && typeof json === "object" && "tests" in json && "stats" in json)
      return "mocha";
    throw new ResultParseError("Could not detect format: unrecognized JSON shape");
  }

  const rootMatch = trimmed.match(/<([a-zA-Z0-9:_-]+)[\s>/]/);
  const root = rootMatch?.[1]?.replace(/^[^:]*:/, "");
  switch (root) {
    case "TestRun":
      return "trx";
    case "test-run":
      return "nunit3";
    case "assemblies":
      return "xunit2";
    case "testsuites":
    case "testsuite":
      return "junit";
    default:
      throw new ResultParseError(
        `Could not detect format: unrecognized root element${root ? ` <${root}>` : ""}`
      );
  }
}

export function parseResults(format: ResultFormat, text: string): NormalizedResults {
  switch (format) {
    case "junit":
      return parseJUnit(text);
    case "trx":
      return parseTrx(text);
    case "nunit3":
      return parseNUnit3(text);
    case "xunit2":
      return parseXUnit2(text);
    case "cucumber":
      return parseCucumber(text);
    case "mocha":
      return parseMocha(text);
  }
}
