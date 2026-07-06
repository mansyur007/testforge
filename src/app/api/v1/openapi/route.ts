import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";

// Public: the spec describes how to authenticate, so it must be reachable
// without a key. Consumed by the /docs/api viewer and any external tooling.
export function GET() {
  return NextResponse.json(openApiSpec());
}
