import { ApiError, authErrorMessage } from "@/lib/api-client";
export function usersError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409)
      return "El registro cambió, el correo ya tiene una cuenta o todavía no ha pasado un minuto desde el último envío. Actualiza el listado y revisa su estado.";
    if (error.status === 404)
      return "El registro ya no está disponible. Actualiza el listado.";
    if (error.status === 400)
      return "Revisa los nombres y los roles. Deben existir y estar permitidos para tu cuenta.";
  }
  return authErrorMessage(error);
}
