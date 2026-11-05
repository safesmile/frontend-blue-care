import test from "node:test";
import assert from "node:assert/strict";
import { importSource } from "./import-source.mjs";
const { createUsersApi } = await importSource("../src/pages/main/users/api.ts");
const {
  has,
  canEdit,
  assignableRoles,
  canResend,
  canRevoke,
  invitationState,
  resendWait,
} = await importSource("../src/pages/main/users/policies.ts");
const { invitationSchema, userSchema } = await importSource(
  "../src/pages/main/users/schema.ts",
);
const actor = {
  id: "a",
  roles: ["operator"],
  permissions: [
    "users:list",
    "users:manage",
    "users:update",
    "roles:assign",
    "invitations:create",
    "invitations:list",
    "invitations:resend",
    "invitations:revoke",
  ],
};
const now = Date.parse("2026-11-04T18:00:00Z");
const invitation = {
  id: "i",
  roles: ["operator"],
  status: "pending",
  expiresAt: new Date(now + 3600000).toISOString(),
  lastSendAttemptAt: new Date(now - 61000).toISOString(),
};
function setup(responses = []) {
  const calls = [];
  return {
    calls,
    api: createUsersApi({
      authorized: async (path, options) => {
        calls.push({ path, ...options });
        const response = responses.shift();
        if (response instanceof Error) throw response;
        return response;
      },
    }),
  };
}
test("list requests use only bounded backend pagination parameters", async () => {
  const { api, calls } = setup([
    { items: [], total: 0 },
    { items: [], total: 0 },
  ]);
  await api.users(25, 50);
  await api.invitations(10, 20);
  assert.deepEqual(
    calls.map((c) => c.path),
    ["/users?limit=25&offset=50", "/auth/invitations?limit=10&offset=20"],
  );
});
test("invitation creation submits normalized names/email and explicit roles without a password", async () => {
  const { api, calls } = setup([invitation]);
  const body = invitationSchema.parse({
    firstName: " Ana ",
    lastName: " Pérez ",
    email: " ANA@EXAMPLE.TEST ",
    roles: ["operator"],
    invitedBy: "untrusted",
    password: "untrusted",
  });
  await api.invite(body);
  assert.deepEqual(calls[0], {
    path: "/auth/invitations",
    method: "POST",
    body: {
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@example.test",
      roles: ["operator"],
    },
  });
});
test("resend uses POST, no token or invented actor fields, and propagates delivery failures", async () => {
  const { api, calls } = setup([new Error("delivery failed")]);
  await assert.rejects(api.resend("i"), /delivery failed/);
  assert.deepEqual(calls[0], {
    path: "/auth/invitations/i/resend",
    method: "POST",
    body: {},
  });
});
test("revoke supports a reason and correctly accepts a 204 empty result", async () => {
  const { api, calls } = setup([undefined]);
  assert.equal(await api.revoke("i", "Duplicada"), undefined);
  assert.deepEqual(calls[0], {
    path: "/auth/invitations/i/revoke",
    method: "POST",
    body: { reason: "Duplicada" },
  });
});
test("user updates patch only the selected properties", async () => {
  const { api, calls } = setup([{}]);
  await api.update("a", { enabled: false });
  assert.deepEqual(calls[0], {
    path: "/users/a",
    method: "PATCH",
    body: { enabled: false },
  });
});
test("role catalog fetches all server pages, rather than truncating at 100", async () => {
  const { api, calls } = setup([
    { items: Array.from({ length: 100 }, (_, i) => ({ id: i })), total: 101 },
    { items: [{ id: 100 }], total: 101 },
  ]);
  assert.equal((await api.roles()).length, 101);
  assert.deepEqual(
    calls.map((c) => c.path),
    ["/roles?limit=100&offset=0", "/roles?limit=100&offset=100"],
  );
});
test("empty catalog pages stop pagination safely", async () => {
  const { api, calls } = setup([{ items: [], total: 12 }]);
  assert.deepEqual(await api.roles(), []);
  assert.equal(calls.length, 1);
});
test("missing permissions deny list and mutations independently", () => {
  assert.equal(has(null, "users:list"), false);
  assert.equal(
    has(
      { ...actor, permissions: ["users:list"] },
      "users:list",
      "users:manage",
    ),
    false,
  );
  assert.equal(
    canResend(
      { ...actor, permissions: ["invitations:resend"] },
      invitation,
      now,
    ),
    false,
  );
  assert.equal(
    canRevoke({ ...actor, permissions: [] }, invitation, now),
    false,
  );
});
test("only superadmin can edit superadmin accounts", () => {
  assert.equal(canEdit(actor, { id: "other", roles: ["superadmin"] }), false);
  assert.equal(
    canEdit(
      { ...actor, roles: ["superadmin"] },
      { id: "other", roles: ["superadmin"] },
    ),
    true,
  );
});
test("edit checks global scope or self ownership in addition to operation permission", () => {
  const own = { ...actor, permissions: ["users:update"] };
  assert.equal(canEdit(own, { id: "other", roles: [] }), false);
  assert.equal(canEdit(own, { id: actor.id, roles: [] }), true);
});
test("delegated roles exclude legacy and roles outside actor permissions", () => {
  const roles = [
    { name: "operator", permissions: ["users:list"] },
    { name: "superadmin", permissions: [] },
    { name: "legacy-old", permissions: [] },
    { name: "billing", permissions: ["billing:manage"] },
  ];
  assert.deepEqual(
    assignableRoles(actor, roles).map((r) => r.name),
    ["operator"],
  );
  assert.deepEqual(
    assignableRoles({ ...actor, roles: ["superadmin"] }, roles).map(
      (r) => r.name,
    ),
    ["operator", "superadmin", "billing"],
  );
});
test("accepted and revoked invitations cannot be resent or revoked", () => {
  for (const status of ["accepted", "revoked"]) {
    assert.equal(canResend(actor, { ...invitation, status }, now), false);
    assert.equal(canRevoke(actor, { ...invitation, status }, now), false);
  }
});
test("expired invitations remain eligible for resend/revoke", () => {
  const expired = { ...invitation, expiresAt: new Date(now - 1).toISOString() };
  assert.equal(invitationState(expired, now), "expired");
  assert.equal(canResend(actor, expired, now), true);
  assert.equal(canRevoke(actor, expired, now), true);
});
test("resend enforces the 60-second interval using last attempted send, even on failure", () => {
  const recent = {
    ...invitation,
    deliveryStatus: "failed",
    lastSendAttemptAt: new Date(now - 1000).toISOString(),
  };
  assert.equal(resendWait(recent, now), 59);
  assert.equal(canResend(actor, recent, now), false);
  assert.equal(canResend(actor, recent, now + 59000), true);
});
test("non-superadmins cannot resend invitations granting superadmin", () => {
  assert.equal(
    canResend(actor, { ...invitation, roles: ["superadmin"] }, now),
    false,
  );
});
test("canonical names respect combined length and reject blanks", () => {
  const base = {
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana@example.test",
    roles: ["operator"],
  };
  for (const change of [
    { firstName: " " },
    { firstName: "a".repeat(60), lastName: "b".repeat(60) },
    { roles: [] },
    { roles: ["operator", "operator"] },
    { roles: ["legacy-old"] },
  ])
    assert.equal(
      invitationSchema.safeParse({ ...base, ...change }).success,
      false,
    );
  assert.equal(
    userSchema.safeParse({ firstName: "Ana", lastName: "Pérez", roles: [] })
      .success,
    true,
  );
});
