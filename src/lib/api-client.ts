export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  verified: boolean;
  enabled: boolean;
  roles: string[];
  permissions: string[];
}
export interface Credentials {
  token: string;
  refreshToken: string;
}
export interface InvitationPreview {
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  expiresAt: string;
  status: "pending";
}
export type AuthSnapshot = {
  status: "loading" | "authenticated" | "anonymous" | "error";
  user: AuthUser | null;
  error: string | null;
};
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code = "") {
    super("No se pudo completar la solicitud.");
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
export function authErrorMessage(error: unknown, operation = "") {
  if (!(error instanceof ApiError))
    return "Ocurrió un error. Intenta nuevamente.";
  if (error.status === 0)
    return "No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.";
  if (error.status === 429)
    return "Has realizado demasiados intentos. Espera un minuto antes de volver a intentarlo.";
  if (error.status >= 500)
    return "El servicio no está disponible en este momento. Intenta nuevamente más tarde.";
  if (operation === "login" && error.status === 401)
    return "No pudimos iniciar sesión. Revisa tus credenciales y que tu cuenta esté activada.";
  if (error.code === "Email already registered")
    return "Ese correo no está disponible. Usa otro correo electrónico.";
  if (error.code === "Email is unchanged")
    return "Ingresa un correo diferente al actual.";
  if (operation === "token" && [400, 404, 409, 410].includes(error.status))
    return "Este enlace no es válido, ya fue utilizado o venció. Solicita uno nuevo o contacta a quien te invitó.";
  if (error.status === 401)
    return operation === "credentials"
      ? "La contraseña actual no es correcta o tu sesión ya no está vigente."
      : "Tu sesión ya no está vigente. Inicia sesión nuevamente.";
  if (error.status === 403)
    return "No tienes permiso para realizar esta operación.";
  if (error.status === 409)
    return "La operación entra en conflicto con el estado actual. Revisa los datos e intenta nuevamente.";
  return "No se pudo completar la solicitud. Revisa los datos e intenta nuevamente.";
}
const STORAGE_KEY = "bluecare.auth.session";
const validCredentials = (value: unknown): value is Credentials => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Credentials>;
  return (
    typeof v.token === "string" &&
    v.token.length > 0 &&
    typeof v.refreshToken === "string" &&
    /^[a-f0-9]{80}$/.test(v.refreshToken)
  );
};
// A credential pair is always replaced in a single storage write. No passwords or profiles are persisted.
export function createApiClient({
  baseUrl,
  fetcher = fetch,
  storage,
}: {
  baseUrl: string;
  fetcher?: typeof fetch;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
}) {
  let credentials: Credentials | null = null;
  try {
    const saved: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    if (validCredentials(saved)) credentials = saved;
    else storage?.removeItem(STORAGE_KEY);
  } catch {
    /* Memory-only sessions work when browser storage is unavailable. */
  }
  let revision = 0;
  let identityEpoch = 0;
  let closing = false;
  let snapshot: AuthSnapshot = {
    status: credentials ? "loading" : "anonymous",
    user: null,
    error: null,
  };
  const listeners = new Set<() => void>();
  const publish = (state: AuthSnapshot) => {
    snapshot = state;
    listeners.forEach((fn) => fn());
  };
  const save = (value: Credentials | null) => {
    credentials = value;
    revision++;
    try {
      if (value) storage?.setItem(STORAGE_KEY, JSON.stringify(value));
      else storage?.removeItem(STORAGE_KEY);
    } catch {
      /* Keep the current session in memory. */
    }
  };
  const clearSession = () => {
    identityEpoch++;
    save(null);
    publish({ status: "anonymous", user: null, error: null });
  };
  async function send<T>(
    path: string,
    {
      method = "GET",
      body,
      token,
      signal,
    }: {
      method?: string;
      body?: unknown;
      token?: string;
      signal?: AbortSignal;
    } = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(`${baseUrl.replace(/\/$/, "")}${path}`, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
          : AbortSignal.timeout(20000),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ApiError(0);
    }
    if (!response.ok) {
      let code = "";
      try {
        const data = (await response.json()) as { message?: unknown };
        if (typeof data.message === "string") code = data.message;
      } catch {
        /* Proxies may return a non-JSON response. */
      }
      throw new ApiError(response.status, code);
    }
    if (response.status === 204) return undefined as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError(502);
    }
  }
  let refreshFlight: Promise<void> | null = null;
  function refresh() {
    if (refreshFlight) return refreshFlight;
    const current = credentials;
    const expected = revision;
    if (!current || closing) return Promise.reject(new ApiError(401));
    refreshFlight = (async () => {
      try {
        const next = await send<Credentials>("/auth/refresh", {
          method: "POST",
          body: { refreshToken: current.refreshToken },
        });
        if (revision !== expected) throw new ApiError(401);
        if (!validCredentials(next)) throw new ApiError(502);
        save(next);
      } catch (error) {
        if (
          revision === expected &&
          error instanceof ApiError &&
          [400, 401, 403].includes(error.status)
        )
          clearSession();
        throw error;
      }
    })().finally(() => {
      refreshFlight = null;
    });
    return refreshFlight;
  }
  async function authorized<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    if (!credentials || closing) throw new ApiError(401);
    const usedToken = credentials.token;
    const expectedIdentity = identityEpoch;
    try {
      const result = await send<T>(path, { ...options, token: usedToken });
      if (identityEpoch !== expectedIdentity) throw new ApiError(401);
      return result;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      if (!credentials || closing || identityEpoch !== expectedIdentity)
        throw error;
      // Another request may already have rotated both credentials.
      if (credentials.token === usedToken) await refresh();
      if (!credentials || closing) throw new ApiError(401);
      const result = await send<T>(path, {
        ...options,
        token: credentials.token,
      });
      if (identityEpoch !== expectedIdentity) throw new ApiError(401);
      return result;
    }
  }
  let initializeFlight: Promise<void> | null = null;
  function initialize() {
    if (initializeFlight) return initializeFlight;
    if (!credentials) return Promise.resolve();
    publish({ status: "loading", user: null, error: null });
    const expectedIdentity = identityEpoch;
    initializeFlight = (async () => {
      try {
        const user = await authorized<AuthUser>("/auth/me");
        if (!credentials || identityEpoch !== expectedIdentity) return;
        publish({ status: "authenticated", user, error: null });
      } catch (error) {
        if (!credentials || identityEpoch !== expectedIdentity) return;
        if (error instanceof ApiError && [401, 403].includes(error.status))
          clearSession();
        else
          publish({
            status: "error",
            user: null,
            error: authErrorMessage(error),
          });
      }
    })().finally(() => {
      initializeFlight = null;
    });
    return initializeFlight;
  }
  let logoutFlight: Promise<void> | null = null;
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    initialize,
    clearSession,
    authorized,
    async login(email: string, password: string) {
      // Invalidate earlier in-flight logins/refreshes before accepting a new identity.
      identityEpoch++;
      const expected = ++revision;
      const result = await send<Credentials & { user: AuthUser }>(
        "/auth/login",
        { method: "POST", body: { email, password } },
      );
      if (revision !== expected) throw new ApiError(401);
      if (!validCredentials(result) || !result.user?.id)
        throw new ApiError(502);
      save({ token: result.token, refreshToken: result.refreshToken });
      publish({ status: "authenticated", user: result.user, error: null });
    },
    logout() {
      if (logoutFlight) return logoutFlight;
      // Let an already-running rotation finish before revoking its replacement.
      logoutFlight = (async () => {
        if (refreshFlight) {
          try {
            await refreshFlight;
          } catch {
            /* Revoke the latest available credentials. */
          }
        }
        closing = true;
        if (!credentials) {
          clearSession();
          return;
        }
        const current = credentials;
        const expected = ++revision;
        await send<void>("/auth/logout", {
          method: "POST",
          body: { refreshToken: current.refreshToken },
        });
        if (revision === expected) clearSession();
      })().finally(() => {
        closing = false;
        logoutFlight = null;
      });
      return logoutFlight;
    },
    forgotPassword: (email: string) =>
      send("/auth/password/forgot", { method: "POST", body: { email } }),
    requestActivation: (email: string) =>
      send("/auth/activation/request", { method: "POST", body: { email } }),
    previewInvitation: (token: string, signal?: AbortSignal) =>
      send<InvitationPreview>(
        `/auth/invitations/by-token?${new URLSearchParams({ token })}`,
        { signal },
      ),
    async redeem(
      kind: "reset" | "activate" | "invitation",
      token: string,
      password: string,
    ) {
      const path =
        kind === "reset"
          ? "/auth/password/reset"
          : kind === "activate"
            ? "/auth/activation/confirm"
            : "/auth/invitations/accept";
      await send<void>(path, { method: "POST", body: { token, password } });
      clearSession();
    },
    async confirmEmail(token: string) {
      await send<void>("/auth/email/confirm", {
        method: "POST",
        body: { token },
      });
      clearSession();
    },
    async changePassword(currentPassword: string, newPassword: string) {
      await authorized<void>("/auth/password/change", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      clearSession();
    },
    changeEmail: (email: string, currentPassword: string) =>
      authorized("/auth/email/change", {
        method: "POST",
        body: { email, currentPassword },
      }),
  };
}
