export type ProviderErrorCode =
  | "not_configured"
  | "auth_failed"
  | "rate_limited"
  | "upstream_error"
  | "timeout"
  | "invalid_request"
  | "offer_expired"
  | "no_availability";

/**
 * Marker used instead of `instanceof`. Next bundles server code more than once
 * (node and edge runtimes), and a duplicated module graph gives two distinct
 * ProviderError classes — `instanceof` then returns false and the registry
 * silently stops falling back. A symbol on the instance survives that.
 */
const PROVIDER_ERROR = Symbol.for("airline.ProviderError");

/**
 * Errors raised by a distribution provider. `retryable` tells the registry
 * whether falling back to another provider is worth attempting.
 */
export class ProviderError extends Error {
  readonly [PROVIDER_ERROR] = true;
  readonly code: ProviderErrorCode;
  readonly provider: string;
  readonly status: number;
  readonly retryable: boolean;

  constructor(
    code: ProviderErrorCode,
    provider: string,
    message: string,
    options: { status?: number; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "ProviderError";
    this.code = code;
    this.provider = provider;
    this.status = options.status ?? httpStatusFor(code);
    this.retryable = RETRYABLE.has(code);
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return (
    typeof error === "object" &&
    error !== null &&
    PROVIDER_ERROR in error &&
    (error as Record<symbol, unknown>)[PROVIDER_ERROR] === true
  );
}

const RETRYABLE = new Set<ProviderErrorCode>([
  "not_configured",
  "auth_failed",
  "rate_limited",
  "upstream_error",
  "timeout",
]);

function httpStatusFor(code: ProviderErrorCode): number {
  switch (code) {
    case "invalid_request":
      return 400;
    case "offer_expired":
      return 409;
    case "no_availability":
      return 404;
    case "rate_limited":
      return 429;
    case "timeout":
      return 504;
    default:
      return 502;
  }
}

/** Client-safe shape — never leaks upstream payloads or credentials. */
export function toClientError(error: unknown): {
  status: number;
  body: { error: string; code: string };
} {
  if (isProviderError(error)) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code },
    };
  }
  return {
    status: 500,
    body: { error: "Flight search is temporarily unavailable", code: "internal" },
  };
}
