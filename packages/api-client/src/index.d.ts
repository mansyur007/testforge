import type { ApiMethods, RequestOptions } from "../generated/client.js";

export * from "../generated/types.js";
export type { RequestOptions };

export interface RateLimitState {
  limit: number;
  remaining: number;
  /** Unix seconds at which the window rolls over. */
  reset: number;
}

export interface FieldErrorDetail {
  field: string;
  message: string;
}

/** Thrown for any non-2xx response. */
export declare class TestForgeApiError extends Error {
  status: number;
  /** Stable machine code, e.g. `validation_error`. */
  code: string;
  details: FieldErrorDetail[];
  response: Response;
  /** Seconds to wait; present on 429 only. */
  retryAfter: number | null;
  get isRateLimited(): boolean;
  get isValidation(): boolean;
}

export interface TestForgeClientOptions {
  /** Origin of the TestForge instance, e.g. https://testforge.example.com */
  baseUrl: string;
  /** API key from Settings → API Keys. */
  apiKey: string;
  /** Automatic retries on 429. Default 2. */
  maxRetries?: number;
  fetch?: typeof fetch;
}

declare class TestForgeClientBase {
  constructor(options: TestForgeClientOptions);
  baseUrl: string;
  apiKey: string;
  maxRetries: number;
  /** Rate-limit state from the most recent response, or null. */
  rateLimit: RateLimitState | null;

  request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T>;

  /** Walk every page of a collection endpoint, yielding items one at a time. */
  paginate<T>(
    method: (...args: never[]) => Promise<{ items: T[] }>,
    ...args: unknown[]
  ): AsyncGenerator<T, void, unknown>;
}

/** The client exposes one method per API operation (see ApiMethods). */
export declare const TestForgeClient: {
  new (options: TestForgeClientOptions): TestForgeClientBase & ApiMethods;
};
export type TestForgeClient = TestForgeClientBase & ApiMethods;

export default TestForgeClient;
