import test from "node:test";
import assert from "node:assert/strict";
import { importSource } from "./import-source.mjs";
const { createApiClient, ApiError, authErrorMessage } = await importSource(
  "../src/lib/api-client.ts",
);
const pair = { token: "access-one", refreshToken: "a".repeat(80) };
const next = { token: "access-two", refreshToken: "b".repeat(80) };
const user = {
  id: "user-1",
  name: "Prueba Autenticación",
  email: "auth@example.test",
  firstName: "Prueba",
  lastName: "Autenticación",
  verified: true,
  enabled: true,
  roles: ["admin"],
  permissions: ["auth:me", "auth:password-change", "auth:email-change"],
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
const empty = () => new Response(null, { status: 204 });
function memory(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_k, v) => {
      value = v;
    },
    removeItem: () => {
      value = null;
    },
    read: () => value,
  };
}
function setup(handler, initial = null) {
  const calls = [];
  const storage = memory(initial);
  const client = createApiClient({
    baseUrl: "https://api.example.test/api/v1/",
    storage,
    fetcher: async (url, options) => {
      const call = {
        url,
        ...options,
        body: options.body ? JSON.parse(options.body) : undefined,
      };
      calls.push(call);
      return handler(call, calls);
    },
  });
  return { client, calls, storage };
}
const statusIs = (status) => (error) =>
  error instanceof ApiError && error.status === status;
test("login uses the actual contract and persists only an atomic credential pair", async () => {
  const { client, calls, storage } = setup(() => json({ ...pair, user }));
  await client.login(user.email, "Secure123!");
  assert.equal(calls[0].url, "https://api.example.test/api/v1/auth/login");
  assert.deepEqual(calls[0].body, {
    email: user.email,
    password: "Secure123!",
  });
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.equal(calls[0].cache, "no-store");
  assert.equal(calls[0].referrerPolicy, "no-referrer");
  assert.deepEqual(JSON.parse(storage.read()), pair);
  assert.equal(client.getSnapshot().user.id, user.id);
});
test("invalid credentials do not establish a session or expose backend messages", async () => {
  const { client, storage } = setup(() =>
    json({ message: "Invalid credentials" }, 401),
  );
  await assert.rejects(client.login(user.email, "wrong"), statusIs(401));
  assert.equal(storage.read(), null);
  assert.equal(client.getSnapshot().status, "anonymous");
  assert.match(authErrorMessage(new ApiError(401), "login"), /credenciales/);
});
test("bootstrap resolves me from the server and deduplicates StrictMode requests", async () => {
  const { client, calls } = setup(() => json(user), JSON.stringify(pair));
  await Promise.all([client.initialize(), client.initialize()]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].headers.Authorization, "Bearer access-one");
  assert.equal(client.getSnapshot().status, "authenticated");
});
test("concurrent unauthorized requests rotate once, replace both tokens and retry", async () => {
  let refreshes = 0;
  const { client, storage } = setup((call) => {
    if (call.url.endsWith("/auth/refresh")) {
      refreshes++;
      assert.deepEqual(call.body, { refreshToken: pair.refreshToken });
      return json(next);
    }
    return call.headers.Authorization === "Bearer access-two"
      ? json(user)
      : json({}, 401);
  }, JSON.stringify(pair));
  await Promise.all([
    client.authorized("/auth/me"),
    client.authorized("/auth/me"),
  ]);
  assert.equal(refreshes, 1);
  assert.deepEqual(JSON.parse(storage.read()), next);
});
test("invalid refresh clears the session", async () => {
  const { client, storage } = setup(() => json({}, 401), JSON.stringify(pair));
  await client.initialize();
  assert.equal(client.getSnapshot().status, "anonymous");
  assert.equal(storage.read(), null);
});
test("network failure retains credentials and allows session verification to be retried", async () => {
  let online = false;
  const { client, storage } = setup(() => {
    if (!online) throw new TypeError("network");
    return json(user);
  }, JSON.stringify(pair));
  await client.initialize();
  assert.equal(client.getSnapshot().status, "error");
  assert.ok(storage.read());
  online = true;
  await client.initialize();
  assert.equal(client.getSnapshot().status, "authenticated");
});
test("a forbidden operation never rotates or erases a valid session", async () => {
  const { client, calls, storage } = setup(
    () => json({}, 403),
    JSON.stringify(pair),
  );
  await assert.rejects(client.authorized("/private"), statusIs(403));
  assert.equal(calls.length, 1);
  assert.ok(storage.read());
});
test("logout revokes the refresh token and clears storage only after success", async () => {
  const { client, calls, storage } = setup(() => empty(), JSON.stringify(pair));
  await Promise.all([client.logout(), client.logout()]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body, { refreshToken: pair.refreshToken });
  assert.equal(storage.read(), null);
});
test("failed logout keeps credentials so revocation can be retried", async () => {
  const { client, storage } = setup(() => json({}, 503), JSON.stringify(pair));
  await assert.rejects(client.logout(), statusIs(503));
  assert.ok(storage.read());
});
test("a late refresh cannot resurrect a cleared session", async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  let started;
  const ready = new Promise((r) => {
    started = r;
  });
  const { client, storage } = setup((call) => {
    if (call.url.endsWith("/auth/refresh")) {
      started();
      return pending;
    }
    return json({}, 401);
  }, JSON.stringify(pair));
  const request = client.authorized("/auth/me");
  await ready;
  client.clearSession();
  resolve(json(next));
  await assert.rejects(request, statusIs(401));
  assert.equal(storage.read(), null);
  assert.equal(client.getSnapshot().status, "anonymous");
});
test("logout waits for an in-flight rotation and revokes its replacement", async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  let started;
  const ready = new Promise((r) => {
    started = r;
  });
  let revoked;
  const { client, storage } = setup((call) => {
    if (call.url.endsWith("/auth/refresh")) {
      started();
      return pending;
    }
    if (call.url.endsWith("/auth/logout")) {
      revoked = call.body;
      return empty();
    }
    return call.headers.Authorization === "Bearer access-two"
      ? json(user)
      : json({}, 401);
  }, JSON.stringify(pair));
  const request = client.authorized("/auth/me").catch(() => {});
  await ready;
  const logout = client.logout();
  resolve(json(next));
  await Promise.all([request, logout]);
  assert.deepEqual(revoked, { refreshToken: next.refreshToken });
  assert.equal(storage.read(), null);
});
test("public recovery and activation send only email and do not sign in", async () => {
  const { client, calls } = setup(() => json({ message: "generic" }, 202));
  await client.forgotPassword(user.email);
  await client.requestActivation(user.email);
  assert.deepEqual(
    calls.map((c) => c.body),
    [{ email: user.email }, { email: user.email }],
  );
  assert.equal(client.getSnapshot().status, "anonymous");
});
test("invitation preview uses a public GET and never sends the password", async () => {
  const { client, calls } = setup(() => json({ email: user.email }));
  await client.previewInvitation(pair.refreshToken);
  assert.equal(calls[0].method, "GET");
  assert.equal(
    new URL(calls[0].url).searchParams.get("token"),
    pair.refreshToken,
  );
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[0].headers.Authorization, undefined);
});
for (const [kind, path] of [
  ["reset", "/auth/password/reset"],
  ["activate", "/auth/activation/confirm"],
  ["invitation", "/auth/invitations/accept"],
])
  test(`${kind} consumes token/password, handles 204, and clears old session`, async () => {
    const { client, calls, storage } = setup(
      () => empty(),
      JSON.stringify(pair),
    );
    await client.redeem(kind, pair.refreshToken, "Secure123!");
    assert.ok(calls[0].url.endsWith(path));
    assert.deepEqual(calls[0].body, {
      token: pair.refreshToken,
      password: "Secure123!",
    });
    assert.equal(storage.read(), null);
  });
test("email confirmation posts the token explicitly and clears the revoked session", async () => {
  const { client, calls, storage } = setup(() => empty(), JSON.stringify(pair));
  await client.confirmEmail(pair.refreshToken);
  assert.deepEqual(calls[0].body, { token: pair.refreshToken });
  assert.equal(storage.read(), null);
});
test("changing email keeps the current session until confirmation", async () => {
  const { client, calls, storage } = setup(
    () => json({ message: "sent" }, 202),
    JSON.stringify(pair),
  );
  await client.changeEmail("new@example.test", "current");
  assert.deepEqual(calls[0].body, {
    email: "new@example.test",
    currentPassword: "current",
  });
  assert.equal(calls[0].headers.Authorization, "Bearer access-one");
  assert.ok(storage.read());
});
test("changing password uses newPassword and clears revoked credentials", async () => {
  const { client, calls, storage } = setup(() => empty(), JSON.stringify(pair));
  await client.changePassword("current", "Secure123!");
  assert.deepEqual(calls[0].body, {
    currentPassword: "current",
    newPassword: "Secure123!",
  });
  assert.equal(storage.read(), null);
});
test("corrupt storage does not crash startup and blocked storage still allows a memory session", async () => {
  const { client } = setup(() => json(user), "not-json");
  assert.equal(client.getSnapshot().status, "anonymous");
  const unavailable = {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
    removeItem() {
      throw new Error();
    },
  };
  const other = createApiClient({
    baseUrl: "/api/v1",
    storage: unavailable,
    fetcher: async () => json({ ...pair, user }),
  });
  await other.login(user.email, "Secure123!");
  assert.equal(other.getSnapshot().status, "authenticated");
});
test("rate limiting and expired invitation errors are localized", async () => {
  const { client } = setup(() => json({}, 410));
  await assert.rejects(
    client.previewInvitation(pair.refreshToken),
    statusIs(410),
  );
  assert.match(authErrorMessage(new ApiError(410), "token"), /venció/);
  assert.match(authErrorMessage(new ApiError(429)), /Espera/);
});

test("an old request is never replayed with a different identity after another login", async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  const { client, calls } = setup(
    (call) =>
      call.url.endsWith("/auth/login")
        ? json({ ...next, user: { ...user, id: "user-2" } })
        : pending,
    JSON.stringify(pair),
  );
  const old = client.authorized("/private");
  await client.login("other@example.test", "Secure123!");
  resolve(json({}, 401));
  await assert.rejects(old, statusIs(401));
  assert.equal(calls.length, 2);
  assert.equal(client.getSnapshot().user.id, "user-2");
});
test("a late profile check cannot replace the current identity", async () => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  const { client } = setup(
    (call) =>
      call.url.endsWith("/auth/login")
        ? json({ ...next, user: { ...user, id: "user-2" } })
        : pending,
    JSON.stringify(pair),
  );
  const old = client.initialize();
  await client.login("other@example.test", "Secure123!");
  resolve(json(user));
  await old;
  assert.equal(client.getSnapshot().user.id, "user-2");
});
