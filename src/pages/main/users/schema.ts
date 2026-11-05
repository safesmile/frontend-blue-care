import { z } from "zod";
const name = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(60, "Usa como máximo 60 caracteres.");
const roles = z
  .array(
    z
      .string()
      .regex(
        /^[a-z][a-z0-9-]{1,59}$/,
        "El identificador del rol no es válido.",
      ),
  )
  .min(1, "Selecciona al menos un rol.")
  .refine((value) => new Set(value).size === value.length, "No repitas roles.")
  .refine(
    (value) => value.every((role) => !role.startsWith("legacy-")),
    "Los roles históricos no pueden asignarse de nuevo.",
  );
const names = z.object({ firstName: name, lastName: name });
const combined = (value: { firstName: string; lastName: string }) =>
  value.firstName.length + value.lastName.length + 1 <= 120;
const combinedError = {
  path: ["lastName"],
  message: "El nombre y apellido juntos no pueden superar 120 caracteres.",
};
export const invitationSchema = names
  .extend({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Ingresa un correo válido.")
      .max(254),
    roles,
  })
  .refine(combined, combinedError);
export const userSchema = names
  .extend({ roles: z.array(z.string()).optional() })
  .refine(combined, combinedError);
export type InvitationFields = z.infer<typeof invitationSchema>;
export type UserFields = z.infer<typeof userSchema>;
