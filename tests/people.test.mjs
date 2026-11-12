import test from "node:test";
import assert from "node:assert/strict";
import { importSource } from "./import-source.mjs";
const { createPeopleApi } = await importSource(
  "../src/pages/main/invitations/api.ts",
);
const { canOpenRoute } = await importSource("../src/lib/access-context.ts");
function setup() {
  const calls = [];
  const api = createPeopleApi({
    authorized: async (path, options = {}) => {
      calls.push({ path, ...options });
      return { items: [], total: 0 };
    },
  });
  return { api, calls };
}
const contact = {
  firstName: "Ana",
  lastName: "Patient",
  email: "ana@example.test",
};
test("patient and collaborator invitation payloads cannot mix roles, types or clinic assignments", async () => {
  const { api, calls } = setup();
  await api.invitePatient({
    ...contact,
    roles: ["superadmin"],
    staff: true,
    clinicId: "untrusted",
    clinicAssignments: [{}],
  });
  assert.deepEqual(calls[0], {
    path: "/auth/invitations/patients",
    method: "POST",
    body: contact,
  });
  await api.invitePatient({ ...contact, patientId: "patient-id" });
  assert.deepEqual(calls[1].body, { ...contact, patientId: "patient-id" });
  await api.inviteCollaborator({
    ...contact,
    clinicId: "clinic-a",
    role: "reception",
    roles: ["admin"],
    staff: false,
  });
  assert.deepEqual(calls[2], {
    path: "/auth/invitations/collaborators",
    method: "POST",
    body: { ...contact, clinicId: "clinic-a", role: "reception" },
  });
});
test("directories and invitation histories use separate server filters before pagination", async () => {
  const { api, calls } = setup();
  await api.collaborators(25, 25);
  await api.patients(50, 90);
  await api.invitations("patients", 25, 25);
  await api.invitations("collaborators", 0);
  await api.roles("clinic-a");
  assert.deepEqual(
    calls.map((call) => call.path),
    [
      "/users/collaborators?limit=25&offset=25",
      "/patients?limit=25&offset=50",
      "/auth/invitations?limit=25&offset=25&kind=patient",
      "/auth/invitations?limit=10&offset=0&kind=collaborator",
      "/auth/invitations/collaborators/roles?clinicId=clinic-a",
    ],
  );
});
test("work access changes only the selected clinic assignment", async () => {
  const { api, calls } = setup();
  await api.assign("staff-id", "clinic-a", "reception");
  await api.unassign("staff-id", "clinic-b");
  assert.deepEqual(calls, [
    {
      path: "/clinics/clinic-a/staff/staff-id",
      method: "PUT",
      body: { roles: ["reception"] },
    },
    { path: "/clinics/clinic-b/staff/staff-id", method: "DELETE" },
  ]);
});
test("new pages are bounded by permissions and patient invitation does not need role delegation", () => {
  const staff = {
    mode: "staff",
    clinicId: "clinic-a",
    clinics: [{ id: "clinic-a" }],
    permissions: ["invitations:create", "patients:link", "patients:list"],
  };
  assert.equal(canOpenRoute(staff, "/pacientes/invitar"), true);
  assert.equal(canOpenRoute(staff, "/colaboradores/invitar"), false);
  assert.equal(canOpenRoute(staff, "/colaboradores"), false);
  assert.equal(
    canOpenRoute(
      { ...staff, permissions: ["clinics:staff-list"] },
      "/colaboradores",
    ),
    true,
  );
  assert.equal(
    canOpenRoute({ ...staff, mode: "patient" }, "/pacientes/invitar"),
    false,
  );
  assert.equal(
    canOpenRoute(
      { ...staff, permissions: ["patients:read"] },
      "/pacientes/patient-id/editar",
    ),
    false,
  );
});

test("patient list and detail require their respective permissions and a clinic", () => {
  const staff = {
    mode: "staff",
    clinics: [{ id: "clinic-a" }],
    permissions: ["patients:list"],
  };
  assert.equal(canOpenRoute(staff, "/pacientes"), true);
  assert.equal(canOpenRoute(staff, "/pacientes/patient-id"), false);
  const reader = { ...staff, permissions: ["patients:read"] };
  assert.equal(canOpenRoute(reader, "/pacientes"), false);
  assert.equal(canOpenRoute(reader, "/pacientes/patient-id"), true);
  assert.equal(
    canOpenRoute({ ...reader, clinics: [] }, "/pacientes/patient-id"),
    false,
  );
});

test("list query preserves multiple column filters, sort direction and invitation kind", async () => {
  const { api, calls } = setup();
  const filters = [
    { field: "email", operator: "contains", value: "%test@example.test" },
    { field: "status", operator: "in", value: ["pending", "expired"] },
    { field: "createdAt", operator: "dateRange", value: { to: "2026-11-09" } },
  ];
  await api.invitations("patients", 25, 25, {
    filters,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const query = new URL(calls[0].path, "http://localhost").searchParams;
  assert.equal(query.get("kind"), "patient");
  assert.equal(query.get("sortBy"), "createdAt");
  assert.equal(query.get("sortOrder"), "desc");
  assert.equal(query.get("offset"), "25");
  assert.deepEqual(JSON.parse(query.get("filters")), filters);
});
