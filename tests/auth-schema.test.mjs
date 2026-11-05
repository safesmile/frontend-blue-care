import test from "node:test";
import assert from "node:assert/strict";
import { importSource } from "./import-source.mjs";
const { schemaFor, passwordSchema, tokenSchema, safeReturnPath } =
  await importSource("../src/pages/others/auth/schema.ts");
test("normalizes email without changing the supplied password", () => {
  assert.deepEqual(
    schemaFor("login").parse({
      email: "  PERSON@EXAMPLE.COM  ",
      password: " Abc123$ ",
    }),
    { email: "person@example.com", password: " Abc123$ " },
  );
});
test("password policy matches backend complexity and UTF-8 byte limits", () => {
  assert.equal(passwordSchema.safeParse("Secure123!").success, true);
  for (const invalid of [
    "short",
    "nouppercase1!",
    "NOLOWERCASE1!",
    "NoNumber!!",
    "NoSymbol123",
    "Has space123!",
    "Ab1!" + "é".repeat(35),
  ])
    assert.equal(passwordSchema.safeParse(invalid).success, false, invalid);
  assert.equal(passwordSchema.safeParse("Ab1!" + "é".repeat(34)).success, true);
});
test("confirmation is mandatory and current password is required for authenticated changes", () => {
  assert.equal(
    schemaFor("reset").safeParse({
      password: "Secure123!",
      confirmPassword: "Different123!",
    }).success,
    false,
  );
  assert.equal(
    schemaFor("change-password").safeParse({
      password: "Secure123!",
      confirmPassword: "Secure123!",
    }).success,
    false,
  );
  assert.equal(
    schemaFor("change-password").safeParse({
      currentPassword: "old",
      password: "Secure123!",
      confirmPassword: "Secure123!",
    }).success,
    true,
  );
});
test("only complete hex email tokens are accepted", () => {
  assert.equal(tokenSchema.safeParse("a".repeat(80)).success, true);
  for (const token of ["", "a".repeat(79), "A".repeat(80), "z".repeat(80)])
    assert.equal(tokenSchema.safeParse(token).success, false);
});
test("return paths cannot redirect to other origins or cause a login loop", () => {
  for (const path of [
    undefined,
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/iniciar-sesion",
    "/signin?next=x",
    "/x\n",
  ])
    assert.equal(safeReturnPath(path), "/");
  assert.equal(
    safeReturnPath("/pacientes?estado=activo"),
    "/pacientes?estado=activo",
  );
});
