import { z } from "zod";
export type AuthMode =
  | "login"
  | "recovery"
  | "activation-request"
  | "reset"
  | "activate"
  | "invitation"
  | "confirm-email"
  | "change-password"
  | "change-email";
export const tokenSchema = z
  .string()
  .regex(/^[a-f0-9]{80}$/, "El enlace no es válido o está incompleto.");
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ingresa un correo electrónico válido.")
  .max(254, "El correo es demasiado largo.");
const currentPassword = z
  .string()
  .min(1, "Ingresa tu contraseña actual.")
  .max(72, "La contraseña es demasiado larga.");
export const passwordSchema = z
  .string()
  .min(8, "Usa al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])\S+$/,
    "Incluye mayúscula, minúscula, número y símbolo, sin espacios.",
  )
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "La contraseña no puede superar 72 bytes; evita usar demasiados caracteres especiales.",
  );

export interface AuthFields {
  email?: string;
  password?: string;
  currentPassword?: string;
  confirmPassword?: string;
}
export function schemaFor(mode: AuthMode): z.ZodType<AuthFields> {
  if (mode === "login")
    return z.object({
      email,
      password: z
        .string()
        .min(1, "Ingresa tu contraseña.")
        .max(72, "La contraseña es demasiado larga."),
    });
  if (mode === "recovery" || mode === "activation-request")
    return z.object({ email });
  if (mode === "confirm-email") return z.object({});
  if (mode === "change-email") return z.object({ email, currentPassword });
  const passwords = z.object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma la contraseña."),
  });
  const confirmation = {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  };
  if (mode === "change-password")
    return passwords
      .extend({ currentPassword })
      .refine((data) => data.password === data.confirmPassword, confirmation);
  return passwords.refine(
    (data) => data.password === data.confirmPassword,
    confirmation,
  );
}
export function safeReturnPath(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value) &&
    !/^\/(iniciar-sesion|signin|cerrar-sesion)([/?#]|$)/.test(value)
    ? value
    : "/";
}
