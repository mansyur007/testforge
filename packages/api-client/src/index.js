// Typed client for the TestForge REST API v2.
//
// The per-endpoint methods are generated from the OpenAPI document (see
// ../generated/client.js); everything in this file is the hand-written runtime
// around them — auth, error shaping, rate-limit bookkeeping and paging.

import { buildMethods } from "../generated/client.js";

/**
 * Thrown for any non-2xx response. Carries the API's stable machine `code`
 * (unauthorized, validation_error, rate_limited, …) and, for 422s, the
 * per-field `details`, so callers can branch without parsing prose.
 */
export class TestForgeApiError extends Error {
  constructor(status, payload, response) {
    const error = payload?.error ?? {};
    super(error.message ?? `HTTP ${status}`);
    this.name = "TestForgeApiError";
    this.status = status;
    this.code = error.code ?? "http_error";
    this.details = error.details ?? [];
    this.response = response;
    /** Seconds to wait, present on 429 only. */
    this.retryAfter = Number(response?.headers?.get?.("retry-after")) || null;
  }

  get isRateLimited() {
    return this.status === 429;
  }
  get isValidation() {
    return this.status === 422;
  }
}

function readRateLimit(headers) {
  const limit = headers.get("x-ratelimit-limit");
  if (limit === null) return null; // session-authed call: no budget
  return {
    limit: Number(limit),
    remaining: Number(headers.get("x-ratelimit-remaining")),
    /** Unix seconds at which the window rolls over. */
    reset: Number(headers.get("x-ratelimit-reset")),
  };
}

export class TestForgeClient {
  /**
   * @param {object} opts
   * @param {string} opts.baseUrl  Origin of the TestForge instance.
   * @param {string} opts.apiKey   API key from Settings → API Keys.
   * @param {number} [opts.maxRetries]  Automatic retries on 429 (default 2).
   * @param {typeof fetch} [opts.fetch]  Injectable for tests.
   */
  constructor({ baseUrl, apiKey, maxRetries = 2, fetch: fetchImpl } = {}) {
    if (!baseUrl) throw new Error("baseUrl is required");
    if (!apiKey) throw new Error("apiKey is required");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.maxRetries = maxRetries;
    this.fetch = fetchImpl ?? globalThis.fetch;
    /** Rate-limit state from the most recent response, or null. */
    this.rateLimit = null;
    Object.assign(this, buildMethods(this.request.bind(this)));
  }

  async request(method, path, body, options = {}) {
    const url = new URL(`${this.baseUrl}/api/v2${path}`);
    for (const [k, v] of Object.entries(options.query ?? {}))
      if (v !== undefined) url.searchParams.set(k, String(v));

    const isForm = body instanceof FormData;
    const headers = { authorization: `Bearer ${this.apiKey}` };
    // Let the runtime set the multipart boundary; only JSON is declared here.
    if (body !== undefined && !isForm) headers["content-type"] = "application/json";

    for (let attempt = 0; ; attempt++) {
      const res = await this.fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
        signal: options.signal,
      });

      this.rateLimit = readRateLimit(res.headers) ?? this.rateLimit;

      // 204 and other empty bodies carry nothing to parse.
      const payload =
        res.status === 204 || res.headers.get("content-length") === "0"
          ? null
          : await res.json().catch(() => null);

      if (res.ok) return payload;

      const err = new TestForgeApiError(res.status, payload, res);
      // Only 429 is retried, and only when the server told us how long to wait
      // — retrying a 4xx that isn't rate-limiting would just repeat the error.
      if (!err.isRateLimited || attempt >= this.maxRetries) throw err;
      await new Promise((r) => setTimeout(r, (err.retryAfter ?? 1) * 1000));
    }
  }

  /**
   * Walk every page of a collection endpoint, yielding items one at a time.
   *
   *   for await (const m of client.paginate(client.listMilestones, "my-project"))
   *
   * Stops when a page comes back empty, so it terminates even if `meta.total`
   * shifts underneath a long walk.
   */
  async *paginate(method, ...args) {
    const last = args[args.length - 1];
    const hasOptions = last && typeof last === "object" && !Array.isArray(last);
    const base = hasOptions ? args.slice(0, -1) : args;
    const options = hasOptions ? last : {};
    const perPage = options.query?.perPage ?? 100;

    for (let page = 1; ; page++) {
      const res = await method.call(this, ...base, {
        ...options,
        query: { ...options.query, page, perPage },
      });
      const items = res?.items ?? [];
      if (items.length === 0) return;
      for (const item of items) yield item;
      if (res.meta && page >= res.meta.totalPages) return;
    }
  }
}

export default TestForgeClient;
