import type { ApiErrorBody } from "./types";

// سمت سرور: آدرس داخلی؛ سمت مرورگر: مسیر نسبی (از طریق Nginx)
const BASE =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_URL ?? "http://localhost/api/v1")
    : "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  // ثانیه برای ISR، یا false برای بدون کش
  revalidate?: number | false;
  tags?: string[];
};

export async function apiFetch<T>(
  path: string,
  { body, revalidate, tags, headers, ...init }: Options = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include", // کوکی httpOnly برای JWT
    next: { revalidate, tags },
  });

  if (!res.ok) {
    let err: ApiErrorBody["error"] | undefined;
    try {
      err = ((await res.json()) as ApiErrorBody).error;
    } catch {
      // بدنه JSON نبود
    }
    throw new ApiError(
      res.status,
      err?.code ?? "unknown_error",
      err?.message ?? res.statusText,
      err?.fields
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}