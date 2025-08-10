import { Effect } from "effect";
import { API_URL } from "./config.ts";

export type Credentials = {
  user: string;
  pass: string;
};

const buildLoginForm = ({ user, pass }: Credentials): URLSearchParams => {
  const form = new URLSearchParams();
  form.set("user", user);
  form.set("pass", pass);
  form.set("login", "Login");
  return form;
};

const extractCookieHeader = (response: Response): string | null => {
  const anyHeaders = response.headers as unknown as {
    getSetCookie?: () => string[];
    get: (name: string) => string | null;
  };

  const setCookies = anyHeaders.getSetCookie?.();
  if (Array.isArray(setCookies) && setCookies.length > 0) {
    return setCookies.map((c) => c.split(";", 1)[0]).join("; ");
  }

  const combined = anyHeaders.get("set-cookie");
  if (!combined) return null;

  // Fallback parsing: pull out name=value tokens robustly without splitting on commas in Expires
  const matches = combined.matchAll(/([^=;,\s]+=[^;]+)(?:;|$)/g);
  const pairs: string[] = Array.from(matches, (m) => m[1]).filter(
    (p): p is string => typeof p === "string",
  );
  if (pairs.length === 0) return null;
  // Deduplicate by cookie name, keep last occurrence
  const byName = new Map<string, string>();
  for (const p of pairs) {
    const name = p.split("=", 1)[0]!;
    byName.set(name, p);
  }
  return Array.from(byName.values()).join("; ");
};

/**
 * Perform login and return a Cookie header string to be used in subsequent requests
 */
export const login = (
  credentials: Credentials,
): Effect.Effect<string, Error, never> =>
  Effect.gen(function* () {
    const form = buildLoginForm(credentials);
    const response = yield* Effect.tryPromise({
      try: async () =>
        await fetch(`${API_URL}/index.php?link=login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        }),
      catch: (e) =>
        e instanceof Error ? e : new Error("Login request failed"),
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new Error(`Login failed: ${response.status} ${response.statusText}`),
      );
    }

    const cookieHeader = extractCookieHeader(response);
    if (!cookieHeader) {
      return yield* Effect.fail(
        new Error("Missing Set-Cookie in login response"),
      );
    }

    return cookieHeader;
  });
