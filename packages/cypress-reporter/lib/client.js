// Minimal TestForge REST client (shared shape with the Playwright reporter).
// No dependencies — Node 18+ global fetch.

const TC_RE = /TC-[A-Za-z0-9]+-\d+/;

export class TestForgeClient {
  constructor({ url, token, project }) {
    this.url = String(url || "").replace(/\/$/, "");
    this.token = token;
    this.project = project;
    this.caseMap = new Map();
    this.runId = null;
  }

  get configured() {
    return Boolean(this.url && this.token && this.project);
  }

  async #req(path, { method = "GET", body } = {}) {
    const res = await fetch(`${this.url}/api/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = payload?.error?.message || payload?.error || `HTTP ${res.status}`;
      throw new Error(`${method} ${path}: ${msg}`);
    }
    return payload;
  }

  async loadCaseMap() {
    let cursor = null;
    do {
      const qs = new URLSearchParams({ limit: "200" });
      if (cursor) qs.set("cursor", cursor);
      const page = await this.#req(`/projects/${this.project}/cases?${qs}`);
      for (const c of page.data ?? [])
        if (c.displayId) this.caseMap.set(c.displayId.toUpperCase(), c.id);
      cursor = page.nextCursor;
    } while (cursor);
    return this.caseMap;
  }

  resolveCaseId(text) {
    const m = String(text || "").match(TC_RE);
    if (!m) return null;
    return this.caseMap.get(m[0].toUpperCase()) ?? null;
  }

  async createRun({ name, source, origin }) {
    const run = await this.#req(`/projects/${this.project}/runs`, {
      method: "POST",
      body: { name, source, origin },
    });
    this.runId = run.id;
    return run.id;
  }

  async postResult({ caseId, status, comment, elapsedSeconds }) {
    if (!this.runId) return;
    await this.#req(`/projects/${this.project}/runs/${this.runId}/results`, {
      method: "POST",
      body: {
        caseId,
        status,
        comment: comment ? String(comment).slice(0, 5000) : undefined,
        elapsedSeconds,
      },
    });
  }

  async completeRun() {
    if (!this.runId) return;
    await this.#req(`/projects/${this.project}/runs/${this.runId}`, {
      method: "PATCH",
      body: { status: "COMPLETED" },
    });
  }
}
