import { Effect } from "effect";
import { login } from "./api/usdb/auth.ts";
import {
  generateRandomPassword,
  generateRandomUsername,
  register,
} from "./api/usdb/register.ts";
import { loadCredentials, saveCredentials } from "./storage/credentials.ts";

export type Session = {
  cookie: string;
  user: string;
};

export const ensureSession = Effect.gen(function* () {
  let creds = yield* loadCredentials;
  if (!creds) {
    const user = generateRandomUsername();
    const pass = generateRandomPassword();
    const email = `bounce+${user}@gmail.com`;
    yield* register({ user, pass, email });
    creds = yield* saveCredentials({ user, pass });
  }
  const cookie = yield* login({ user: creds.user, pass: creds.pass });
  const session: Session = { cookie, user: creds.user };
  return session;
});
