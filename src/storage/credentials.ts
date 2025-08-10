import { readFile, writeFile } from "node:fs/promises";
import { Effect } from "effect";
import { resolveDataFilePath } from "./paths.ts";

export type StoredCredentials = {
  user: string;
  pass: string;
};

const FILE_NAME = "credentials.json";

const readJsonFile = (
  path: string,
): Effect.Effect<StoredCredentials | null, Error> =>
  Effect.catchAll(
    Effect.tryPromise({
      try: async () =>
        JSON.parse(await readFile(path, "utf8")) as StoredCredentials,
      catch: (e) =>
        e instanceof Error ? e : new Error("Failed to read credentials"),
    }),
    () => Effect.succeed(null as unknown as StoredCredentials),
  );

const writeJsonFile = (
  path: string,
  data: unknown,
): Effect.Effect<true, Error> =>
  Effect.tryPromise({
    try: async () => {
      await writeFile(path, JSON.stringify(data, null, 2), "utf8");
      return true as const;
    },
    catch: (e) => (e instanceof Error ? e : new Error("Failed to write file")),
  });

export const loadCredentials: Effect.Effect<StoredCredentials | null, Error> =
  Effect.gen(function* () {
    const path = yield* resolveDataFilePath(FILE_NAME);
    const data = yield* readJsonFile(path);
    if (
      data &&
      typeof data.user === "string" &&
      typeof data.pass === "string"
    ) {
      return data as StoredCredentials;
    }
    return null;
  });

export const saveCredentials = (
  creds: StoredCredentials,
): Effect.Effect<StoredCredentials, Error> =>
  Effect.gen(function* () {
    const path = yield* resolveDataFilePath(FILE_NAME);
    yield* writeJsonFile(path, creds);
    return creds;
  });
