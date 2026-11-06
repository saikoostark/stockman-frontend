import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Locale routing only. API, static assets and files with extensions are skipped;
  // /api/v1/* reaches the backend through next.config.ts rewrites, never through proxy.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
