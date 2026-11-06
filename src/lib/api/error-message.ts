import { isApiError } from "./errors";

/**
 * Map any thrown error to a localized, user-readable message using the
 * "errors.<code>" catalog keys, falling back to the server message or a
 * generic network error.
 */
export function errorMessage(
  t: (key: string) => string,
  error: unknown,
): string {
  if (isApiError(error)) {
    const known = `errors.${error.code}`;
    const translated = t(known);
    return translated !== known ? translated : error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return t("errors.internal_error");
}
