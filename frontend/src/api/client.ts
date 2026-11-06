// Клиент API: базовый путь, cookie сессии и единый разбор ошибок.
// Типы запросов и ответов — только из schema.d.ts (npm run gen:api).
import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE ?? "/api/v1",
  credentials: "include",
});

export type User = components["schemas"]["User"];
export type ProfessionSummary = components["schemas"]["ProfessionSummary"];
export type ProfessionDetail = components["schemas"]["ProfessionDetail"];
export type Block = components["schemas"]["Block"];
export type Topic = components["schemas"]["Topic"];
export type Match = components["schemas"]["Match"];
export type MissingSkill = components["schemas"]["MissingSkill"];

type ErrorBody = components["schemas"]["Error"];

/** Ошибка API. Логику ветвим по code, message можно показать пользователю. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;
  readonly retryAfter: number | null;

  constructor(status: number, body: ErrorBody | undefined, retryAfter: string | null) {
    super(body?.error.message ?? (status === 0 ? "Нет связи с сервером" : "Что-то пошло не так, попробуйте позже"));
    this.status = status;
    this.code = body?.error.code ?? (status === 0 ? "network" : "internal");
    this.fields = body?.error.fields ?? {};
    this.retryAfter = retryAfter ? Number(retryAfter) : null;
  }
}

/** Разворачивает ответ openapi-fetch: данные или ApiError. */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let res: { data?: T; error?: unknown; response: Response };
  try {
    res = await promise;
  } catch {
    throw new ApiError(0, undefined, null);
  }
  if (!res.response.ok) {
    throw new ApiError(res.response.status, res.error as ErrorBody | undefined, res.response.headers.get("Retry-After"));
  }
  return res.data as T;
}
