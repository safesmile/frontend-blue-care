import test from "node:test";
import assert from "node:assert/strict";
import { importSource } from "./import-source.mjs";
const { createApiClient } = await importSource("../src/lib/api-client.ts");
const { canOpenRoute, sessionHome } = await importSource(
  "../src/lib/access-context.ts",
);
const pair = { token: "old-access", refreshToken: "a".repeat(80) };
const next = { token: "new-access", refreshToken: "b".repeat(80) };
const staff = {
  id: "ana",
  name: "Ana",
  mode: "staff",
  clinicId: "a",
  roles: ["customer", "reception"],
  globalRoles: ["customer"],
  permissions: ["auth:me", "dashboard:read", "patients:list"],
  clinics: [
    {
      id: "a",
      name: "Clinic A",
      roles: ["reception"],
      permissions: ["patients:list"],
    },
    {
      id: "b",
      name: "Clinic B",
      roles: ["admin"],
      permissions: ["dashboard:read"],
    },
  ],
};
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
function setup(handler) {
  let saved = JSON.stringify(pair);
  const calls = [];
  const client = createApiClient({
    baseUrl: "https://api.test",
    storage: {
      getItem: () => saved,
      setItem: (_, value) => {
        saved = value;
      },
      removeItem: () => {
        saved = null;
      },
    },
    fetcher: async (url, options) => {
      const call = {
        path: new URL(url).pathname,
        ...options,
        body: options.body ? JSON.parse(options.body) : undefined,
      };
      calls.push(call);
      return handler(call);
    },
  });
  return { client, calls, saved: () => JSON.parse(saved) };
}
test("clinic switch atomically replaces credentials and the complete permission context", async () => {
  const { client, calls, saved } = setup((call) =>
    call.path.endsWith("switch-clinic")
      ? json({
          ...next,
          user: { ...staff, clinicId: "b", roles: ["customer", "admin"] },
        })
      : json(staff),
  );
  await client.initialize();
  await client.switchClinic("b");
  assert.deepEqual(calls[1].body, {
    clinicId: "b",
    refreshToken: pair.refreshToken,
  });
  assert.equal(calls[1].headers.Authorization, "Bearer old-access");
  assert.deepEqual(saved(), next);
  assert.equal(client.getSnapshot().user.clinicId, "b");
  assert.deepEqual(client.getSnapshot().user.roles, ["customer", "admin"]);
  assert.equal(client.getSnapshot().switching, false);
  assert.equal(client.getSnapshot().contextVersion, 1);
});
test("all means a null clinic and failed selection retains the original session", async () => {
  const { client, saved, calls } = setup((call) =>
    call.path.endsWith("switch-clinic") ? json({}, 403) : json(staff),
  );
  await client.initialize();
  await assert.rejects(
    client.switchClinic(null),
    (error) => error.status === 403,
  );
  assert.equal(calls[1].body.clinicId, null);
  assert.deepEqual(saved(), pair);
  assert.equal(client.getSnapshot().user.clinicId, "a");
  assert.equal(client.getSnapshot().switching, false);
});
test("old-clinic responses are discarded and never replayed against the new clinic", async () => {
  const delayed = deferred();
  const { client, calls } = setup((call) =>
    call.path === "/patients"
      ? delayed.promise
      : call.path.endsWith("switch-clinic")
        ? json({ ...next, user: { ...staff, clinicId: "b" } })
        : json(staff),
  );
  await client.initialize();
  const oldRequest = client.authorized("/patients", {
    method: "PATCH",
    body: { phone: "test" },
  });
  await client.switchClinic("b");
  delayed.resolve(json({}, 401));
  await assert.rejects(oldRequest, (error) => error.status === 409);
  assert.equal(calls.filter((call) => call.path === "/patients").length, 1);
  assert.equal(calls.filter((call) => call.path === "/auth/refresh").length, 0);
});
test("new requests wait for context rotation and simultaneous selector changes are rejected", async () => {
  const delayed = deferred();
  const { client, calls } = setup((call) =>
    call.path.endsWith("switch-clinic") ? delayed.promise : json(staff),
  );
  await client.initialize();
  const switching = client.switchClinic("b");
  assert.equal(client.getSnapshot().switching, true);
  const queued = client.authorized("/patients");
  await assert.rejects(
    client.switchClinic("a"),
    (error) => error.status === 409,
  );
  assert.equal(calls.filter((call) => call.path === "/patients").length, 0);
  delayed.resolve(json({ ...next, user: { ...staff, clinicId: "b" } }));
  await switching;
  await queued;
  assert.equal(
    calls.find((call) => call.path === "/patients").headers.Authorization,
    "Bearer new-access",
  );
});
test("patient access is determined by the server and cannot be selected by the client", async () => {
  const patient = {
    ...staff,
    mode: "patient",
    clinics: [],
    permissions: ["auth:me", "patients:self"],
  };
  delete patient.clinicId;
  const { client } = setup(() => json(patient));
  await client.initialize();
  assert.equal(client.switchMode, undefined);
  assert.equal(client.getSnapshot().user.mode, "patient");
  assert.equal(canOpenRoute(patient, "/pacientes"), false);
  assert.equal(canOpenRoute(patient, "/mi-cuenta"), true);
  assert.equal(sessionHome(patient), "/mi-cuenta");
});

test("staff without clinics keeps profile and platform access but cannot enter clinical screens", () => {
  const empty = {
    ...staff,
    clinics: [],
    clinicId: null,
    permissions: ["users:list", "dashboard:read", "patients:list"],
  };
  assert.equal(sessionHome(empty), "/mi-cuenta");
  assert.equal(canOpenRoute(empty, "/"), false);
  assert.equal(canOpenRoute(empty, "/pacientes"), false);
  assert.equal(canOpenRoute(empty, "/usuarios"), true);
  assert.equal(canOpenRoute(empty, "/mi-cuenta"), true);
  assert.equal(
    canOpenRoute({ ...staff, clinicId: "foreign" }, "/pacientes"),
    false,
  );
});
test("a profile reload reflects revoked clinics and advances the view context", async () => {
  let count = 0;
  const { client } = setup(() =>
    json(count++ ? { ...staff, clinics: [] } : staff),
  );
  await client.initialize();
  await client.reloadProfile();
  assert.deepEqual(client.getSnapshot().user.clinics, []);
  assert.equal(client.getSnapshot().contextVersion, 1);
});
test("a late clinic switch cannot restore a logged-out or replaced identity", async () => {
  const delayed = deferred();
  const { client, saved } = setup((call) =>
    call.path.endsWith("switch-clinic") ? delayed.promise : json(staff),
  );
  await client.initialize();
  const switching = client.switchClinic("b");
  client.clearSession();
  delayed.resolve(json({ ...next, user: { ...staff, clinicId: "b" } }));
  await assert.rejects(switching, (error) => error.status === 401);
  assert.equal(saved(), null);
  assert.equal(client.getSnapshot().status, "anonymous");
});

test("ordinary refresh ignores route metadata and safely retries within the same clinic", async () => {
  const { client, calls } = setup((call) => {
    if (call.path === "/auth/me")
      return json({ ...staff, clinicPermission: "auth:me" });
    if (call.path === "/auth/refresh") return json({ ...next, user: staff });
    return call.headers.Authorization === "Bearer new-access"
      ? json({ ok: true })
      : json({}, 401);
  });
  await client.initialize();
  assert.deepEqual(await client.authorized("/patients"), { ok: true });
  assert.equal(client.getSnapshot().contextVersion, 0);
  assert.equal(calls.filter((call) => call.path === "/auth/refresh").length, 1);
});
test("refresh into a recovered clinic context discards an operation rather than replaying it", async () => {
  const { client, calls } = setup((call) => {
    if (call.path === "/auth/me") return json(staff);
    if (call.path === "/auth/refresh")
      return json({ ...next, user: { ...staff, clinicId: null, clinics: [] } });
    return json({}, 401);
  });
  await client.initialize();
  await assert.rejects(
    client.authorized("/patients", { method: "POST", body: {} }),
    (error) => error.status === 409,
  );
  assert.equal(client.getSnapshot().user.clinicId, null);
  assert.equal(client.getSnapshot().contextVersion, 1);
  assert.equal(calls.filter((call) => call.path === "/patients").length, 1);
});
