import type { Integration } from "@prisma/client";
import { decrypt } from "@/lib/crypto";

// F-07: issue tracker clients. One interface, three plain-`fetch` implementations
// (no SDK deps). Credentials are decrypted here and never leave this module —
// nothing that touches them may be logged, serialized, or returned to a client.

export const PROVIDERS = ["JIRA", "GITHUB", "GITLAB"] as const;
export type Provider = (typeof PROVIDERS)[number];

export type NewIssue = { title: string; body: string };
export type Issue = { key: string; url: string; title?: string; status?: string };

export interface IssueProvider {
  createIssue(i: NewIssue): Promise<Issue>;
  getIssue(key: string): Promise<Issue>;
  testConnection(): Promise<void>; // throws with a readable message
}

export type JiraAuth = { email: string; apiToken: string };
export type TokenAuth = { token: string };
export type IntegrationAuth = JiraAuth | TokenAuth;

const TIMEOUT_MS = 10_000;

/** Surface the provider's own error text — truncated, since Jira in particular
 * answers with multi-KB HTML on auth failures. */
async function request(
  url: string,
  init: RequestInit & { headers: Record<string, string> }
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const msg = (err as Error).name === "TimeoutError"
      ? `Request to ${new URL(url).hostname} timed out after 10s`
      : `Could not reach ${new URL(url).hostname}: ${(err as Error).message}`;
    throw new Error(msg);
  }
  const text = await res.text();
  if (!res.ok)
    throw new Error(
      `${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 300)}` : ""}`
    );
  return text ? JSON.parse(text) : {};
}

/** Strip a trailing slash so `${baseUrl}/rest/...` never double-slashes. */
function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Jira Cloud — basic auth (email:apiToken), ADF body.
// ---------------------------------------------------------------------------
class JiraProvider implements IssueProvider {
  constructor(
    private baseUrl: string,
    private projectKey: string,
    private auth: JiraAuth
  ) {}

  private headers() {
    const basic = Buffer.from(
      `${this.auth.email}:${this.auth.apiToken}`
    ).toString("base64");
    return {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    };
  }

  /** Jira rejects plain strings: the description must be an Atlassian Document.
   * Each line of our Markdown body becomes its own paragraph. */
  private toAdf(body: string) {
    return {
      type: "doc",
      version: 1,
      content: body.split("\n").map((line) => ({
        type: "paragraph",
        ...(line.trim()
          ? { content: [{ type: "text", text: line }] }
          : { content: [] }),
      })),
    };
  }

  private issueUrl(key: string) {
    return `${trimBase(this.baseUrl)}/browse/${key}`;
  }

  async createIssue({ title, body }: NewIssue): Promise<Issue> {
    const data = (await request(`${trimBase(this.baseUrl)}/rest/api/3/issue`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        fields: {
          project: { key: this.projectKey },
          summary: title,
          description: this.toAdf(body),
          issuetype: { name: "Bug" },
        },
      }),
    })) as { key: string };
    return { key: data.key, url: this.issueUrl(data.key) };
  }

  async getIssue(key: string): Promise<Issue> {
    const data = (await request(
      `${trimBase(this.baseUrl)}/rest/api/3/issue/${encodeURIComponent(key)}?fields=summary,status`,
      { method: "GET", headers: this.headers() }
    )) as { key: string; fields: { summary: string; status: { name: string } } };
    return {
      key: data.key,
      url: this.issueUrl(data.key),
      title: data.fields.summary,
      status: data.fields.status?.name,
    };
  }

  async testConnection(): Promise<void> {
    await request(
      `${trimBase(this.baseUrl)}/rest/api/3/project/${encodeURIComponent(this.projectKey)}`,
      { method: "GET", headers: this.headers() }
    );
  }
}

// ---------------------------------------------------------------------------
// GitHub — token auth, targetKey is "owner/repo".
// ---------------------------------------------------------------------------
class GitHubProvider implements IssueProvider {
  constructor(
    private baseUrl: string, // api.github.com, or a GHE api base
    private repo: string,
    private auth: TokenAuth
  ) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.auth.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  private repoUrl() {
    return `${trimBase(this.baseUrl)}/repos/${this.repo}`;
  }

  async createIssue({ title, body }: NewIssue): Promise<Issue> {
    const data = (await request(`${this.repoUrl()}/issues`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ title, body }),
    })) as { number: number; html_url: string };
    return { key: String(data.number), url: data.html_url };
  }

  async getIssue(key: string): Promise<Issue> {
    const n = key.replace(/^#/, "");
    const data = (await request(`${this.repoUrl()}/issues/${encodeURIComponent(n)}`, {
      method: "GET",
      headers: this.headers(),
    })) as { number: number; html_url: string; title: string; state: string };
    return {
      key: String(data.number),
      url: data.html_url,
      title: data.title,
      // GitHub says open/closed; normalize so the badge rule sees "Closed".
      status: data.state === "closed" ? "Closed" : "Open",
    };
  }

  async testConnection(): Promise<void> {
    await request(this.repoUrl(), { method: "GET", headers: this.headers() });
  }
}

// ---------------------------------------------------------------------------
// GitLab — token auth, targetKey is the project path ("group/sub/project").
// ---------------------------------------------------------------------------
class GitLabProvider implements IssueProvider {
  constructor(
    private baseUrl: string,
    private projectPath: string,
    private auth: TokenAuth
  ) {}

  private headers() {
    return {
      "PRIVATE-TOKEN": this.auth.token,
      "Content-Type": "application/json",
    };
  }

  private projectUrl() {
    return `${trimBase(this.baseUrl)}/api/v4/projects/${encodeURIComponent(this.projectPath)}`;
  }

  async createIssue({ title, body }: NewIssue): Promise<Issue> {
    const data = (await request(`${this.projectUrl()}/issues`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ title, description: body }),
    })) as { iid: number; web_url: string };
    return { key: String(data.iid), url: data.web_url };
  }

  async getIssue(key: string): Promise<Issue> {
    const n = key.replace(/^#/, "");
    const data = (await request(
      `${this.projectUrl()}/issues/${encodeURIComponent(n)}`,
      { method: "GET", headers: this.headers() }
    )) as { iid: number; web_url: string; title: string; state: string };
    return {
      key: String(data.iid),
      url: data.web_url,
      title: data.title,
      // GitLab says opened/closed.
      status: data.state === "closed" ? "Closed" : "Open",
    };
  }

  async testConnection(): Promise<void> {
    await request(this.projectUrl(), { method: "GET", headers: this.headers() });
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function defaultBaseUrl(provider: Provider): string {
  if (provider === "GITHUB") return "https://api.github.com";
  if (provider === "GITLAB") return "https://gitlab.com";
  return ""; // Jira has no default — the site URL is per-tenant
}

/** Build a client from raw (already-decrypted) credentials. Used by the "test
 * connection" flow before anything is persisted. */
export function makeProvider(
  provider: Provider,
  baseUrl: string,
  targetKey: string,
  auth: IntegrationAuth
): IssueProvider {
  if (provider === "JIRA")
    return new JiraProvider(baseUrl, targetKey, auth as JiraAuth);
  if (provider === "GITHUB")
    return new GitHubProvider(baseUrl, targetKey, auth as TokenAuth);
  return new GitLabProvider(baseUrl, targetKey, auth as TokenAuth);
}

/** Build a client from a stored row, decrypting `authEnc` in the process. */
export function providerFor(integration: Integration): IssueProvider {
  const auth = JSON.parse(decrypt(integration.authEnc)) as IntegrationAuth;
  return makeProvider(
    integration.provider as Provider,
    integration.baseUrl,
    integration.targetKey,
    auth
  );
}

/** Display form of an issue key: GitHub/GitLab are numeric, Jira is already
 * prefixed (QA-123). */
export function displayIssueKey(provider: string, key: string): string {
  return provider === "JIRA" ? key : `#${key.replace(/^#/, "")}`;
}

/** Accepts a bare key ("QA-123", "#42", "42") or a full issue URL and returns
 * the provider's canonical key. */
export function parseIssueKey(provider: string, input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    // Jira: /browse/QA-123 · GitHub: /owner/repo/issues/42 · GitLab: /-/issues/42
    const jira = raw.match(/\/browse\/([A-Za-z][A-Za-z0-9_]*-\d+)/);
    if (jira) return jira[1].toUpperCase();
    const numeric = raw.match(/\/issues\/(\d+)/);
    if (numeric) return numeric[1];
    return null;
  }

  if (provider === "JIRA")
    return /^[A-Za-z][A-Za-z0-9_]*-\d+$/.test(raw) ? raw.toUpperCase() : null;

  const n = raw.replace(/^#/, "");
  return /^\d+$/.test(n) ? n : null;
}

/** Badge rule: terminal states are green, everything else amber. */
export function isIssueClosed(status: string | null | undefined): boolean {
  if (!status) return false;
  return ["done", "closed", "resolved"].includes(status.trim().toLowerCase());
}
