import { NextResponse } from "next/server";
import { openApiV2Spec } from "@/lib/openapi-v2";

// Public, like the v1 spec: the document describes how to authenticate, so it
// has to be readable without credentials. Consumed by the /docs/api viewer and
// by the packages/api-client generator.
export function GET() {
  return NextResponse.json(openApiV2Spec());
}
