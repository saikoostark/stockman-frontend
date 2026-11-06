export interface ApiErrorDetail {
  code: string;
  message: string;
  fields: Record<string, string> | null;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: Record<string, string> | null;

  constructor(code: string, message: string, status: number, fields: Record<string, string> | null = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
