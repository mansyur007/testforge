import type { Metadata } from "next";
import { ApiDocs } from "@/components/ApiDocs";

export const metadata: Metadata = {
  title: "API Reference — TestForge",
  description: "REST API v1 reference for TestForge (OpenAPI 3.1).",
};

export const dynamic = "force-dynamic";

export default function ApiDocsPage() {
  return <ApiDocs />;
}
