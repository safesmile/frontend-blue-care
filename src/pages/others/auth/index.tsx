import { notify } from "@/lib/notify";
import { peopleMessages } from "@/lib/session-messages";
import { BackLink } from "@/components/shared/navigation-actions";
import { sessionMessages } from "@/lib/session-messages";
import { sessionHome } from "@/lib/access-context";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { api } from "@/lib/api";
import { authErrorMessage, type InvitationPreview } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import {
  schemaFor,
  safeReturnPath,
  tokenSchema,
  type AuthFields,
  type AuthMode,
} from "./schema";
import AuthLayout from "./layout";
const content: Record<
  AuthMode,
  { title: string; description: string; button: string }
> = {
  login: {
    title: "Iniciar sesión",
    description: sessionMessages().welcome,
    button: sessionMessages().signIn,
  },
  recovery: {
    title: "Recuperar acceso",
    description: "Ingresa tu correo para solicitar un enlace de recuperación.",
    button: "Enviar instrucciones",
  },
  "activation-request": {
    title: "Activar mi cuenta",
    description:
      "Si tu cuenta ya fue registrada, solicita un enlace para verificar tu correo y configurar tu contraseña.",
    button: "Solicitar enlace de activación",
  },
  reset: {
    title: "Restablecer contraseña",
    description:
      "Elige una nueva contraseña para recuperar el acceso a tu cuenta.",
    button: "Restablecer contraseña",
  },
  activate: {
    title: "Configurar contraseña",
    description:
      "Verifica tu correo y configura tu contraseña para activar tu cuenta.",
    button: "Activar cuenta",
  },
  invitation: {
    title: "Aceptar invitación",
    description:
      "Revisa tu invitación y configura una contraseña para completar tu acceso.",
    button: "Aceptar y configurar contraseña",
  },
  "confirm-email": {
    title: "Confirmar correo electrónico",
    description:
      "Confirma el nuevo correo desde este enlace. Después deberás iniciar sesión nuevamente.",
    button: "Confirmar nuevo correo",
  },
  "change-password": {
    title: "Cambiar contraseña",
    description:
      "Ingresa tu contraseña actual y elige una nueva. Se cerrarán tus sesiones al guardar.",
    button: "Cambiar contraseña",
  },
  "change-email": {
    title: "Cambiar correo electrónico",
    description:
      "Enviaremos un enlace al correo nuevo. Tu contacto actual se conserva hasta que lo confirmes.",
    button: "Enviar verificación",
  },
};
export default function AuthPage({ mode }: { mode: AuthMode }) {
  const location = useLocation();
  // A different email link resets all form/preview state, even on the same route.
  return <AuthForm key={`${mode}:${location.search}`} mode={mode} />;
}
function AuthForm({ mode }: { mode: AuthMode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [token] = useState(() => params.get("token") || "");
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState(false);
  const [show, setShow] = useState(false);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewState, setPreviewState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const tokenFlow = [
    "reset",
    "activate",
    "invitation",
    "confirm-email",
  ].includes(mode);
  const validToken = tokenSchema.safeParse(token).success;
  const needsPassword = [
    "reset",
    "activate",
    "invitation",
    "change-password",
  ].includes(mode);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFields>({ resolver: zodResolver(schemaFor(mode)) });
  useEffect(() => {
    if (mode !== "invitation" || !validToken) return;
    const controller = new AbortController();
    void api
      .previewInvitation(token, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setPreview(value);
          setPreviewState("ready");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setFailure(authErrorMessage(error, "token"));
          setPreviewState("error");
        }
      });
    return () => controller.abort();
  }, [mode, token, validToken, previewAttempt]);
  const state = location.state as { from?: unknown; message?: unknown } | null;
  if (mode === "login" && auth.status === "authenticated")
    return (
      <Navigate
        to={state?.from ? safeReturnPath(state.from) : sessionHome(auth.user)}
        replace
      />
    );
  const blocked =
    (tokenFlow && !validToken) ||
    (mode === "invitation" && previewState !== "ready");
  function showNotice(message: string) {
    setNotice(message);
    notify.success(message);
  }
  const submit = handleSubmit(async (values) => {
    setFailure("");
    setNotice("");
    try {
      switch (mode) {
        case "login":
          await api.login(values.email!, values.password!);
          notify.success(peopleMessages().signedIn);
          void navigate(
            state?.from
              ? safeReturnPath(state.from)
              : sessionHome(api.getSnapshot().user),
            { replace: true },
          );
          return;
        case "recovery":
          await api.forgotPassword(values.email!);
          showNotice(
            "Si la cuenta cumple los requisitos, recibirás un enlace de recuperación en tu correo. Revisa también la carpeta de spam.",
          );
          break;
        case "activation-request":
          await api.requestActivation(values.email!);
          showNotice(
            "Si la cuenta está registrada y pendiente de activar, recibirás un enlace en tu correo. No necesitas una membresía para activar tu cuenta.",
          );
          break;
        case "reset":
        case "activate":
        case "invitation":
          await api.redeem(mode, token, values.password!);
          showNotice(
            mode === "reset"
              ? "Contraseña restablecida. Inicia sesión con tu nueva contraseña."
              : "Tu cuenta está lista. Ya puedes iniciar sesión.",
          );
          break;
        case "confirm-email":
          await api.confirmEmail(token);
          showNotice(
            "Correo confirmado. Inicia sesión con tu nuevo correo electrónico.",
          );
          break;
        case "change-password":
          await api.changePassword(values.currentPassword!, values.password!);
          notify.success(peopleMessages().updated);
          void navigate("/iniciar-sesion", {
            replace: true,
            state: {
              message: "Contraseña actualizada. Inicia sesión nuevamente.",
            },
          });
          return;
        case "change-email":
          await api.changeEmail(values.email!, values.currentPassword!);
          showNotice(
            "Enviamos un enlace al nuevo correo. Ábrelo para confirmar el cambio; mientras tanto tu correo actual sigue vigente.",
          );
          break;
      }
      reset();
      setDone(true);
      // Remove consumed credentials from the current history entry.
      if (tokenFlow)
        void navigate("/iniciar-sesion", {
          replace: true,
          state: {
            message:
              mode === "reset"
                ? "Contraseña restablecida. Inicia sesión con tu nueva contraseña."
                : mode === "confirm-email"
                  ? "Correo confirmado. Inicia sesión con tu nuevo correo."
                  : "Tu cuenta está lista. Ya puedes iniciar sesión.",
          },
        });
    } catch (error) {
      const message = authErrorMessage(
        error,
        mode === "login" ? "login" : tokenFlow ? "token" : "credentials",
      );
      setFailure(message);
      notify.error(message);
    }
  });
  const passwordField = (
    name: "password" | "confirmPassword" | "currentPassword",
    label: string,
    current = false,
  ) => (
    <Field key={name} data-invalid={!!errors[name]}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <input
        id={name}
        className="bc-input"
        type={show ? "text" : "password"}
        autoComplete={current ? "current-password" : "new-password"}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...register(name)}
      />
      {errors[name] && (
        <FieldError id={`${name}-error`}>{errors[name]?.message}</FieldError>
      )}
    </Field>
  );
  return (
    <AuthLayout {...content[mode]}>
      {typeof state?.message === "string" && (
        <p className="bc-notice mb-4 text-sm" role="status">
          {state.message}
        </p>
      )}
      {tokenFlow && !validToken && !done && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
        >
          El enlace está incompleto o no es válido. Abre el enlace completo que
          recibiste por correo.
        </p>
      )}
      {mode === "invitation" && validToken && !done && (
        <div className="mb-5">
          {previewState === "loading" && (
            <p role="status">Comprobando invitación…</p>
          )}
          {preview && (
            <section className="bc-notice text-sm">
              <p className="font-medium">
                {preview.firstName} {preview.lastName}
              </p>
              <p className="mt-1 break-all">{preview.email}</p>
              <p className="mt-3">
                Vence:{" "}
                {new Intl.DateTimeFormat("es-GT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/Guatemala",
                }).format(new Date(preview.expiresAt))}
              </p>
            </section>
          )}
          {previewState === "error" && (
            <Button
              variant="outline"
              onClick={() => {
                setFailure("");
                setPreviewState("loading");
                setPreviewAttempt((a) => a + 1);
              }}
            >
              Reintentar comprobación
            </Button>
          )}
        </div>
      )}
      {failure && (
        <p
          className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {failure}
        </p>
      )}
      {notice && (
        <p className="bc-notice mb-5 text-sm" role="status">
          {notice}
        </p>
      )}
      {!done && !blocked && (
        <form className="space-y-5" noValidate onSubmit={submit}>
          <fieldset
            disabled={isSubmitting}
            className="space-y-5 disabled:opacity-70"
          >
            {[
              "login",
              "recovery",
              "activation-request",
              "change-email",
            ].includes(mode) && (
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">
                  {mode === "change-email"
                    ? "Nuevo correo electrónico"
                    : "Correo electrónico"}
                </FieldLabel>
                <input
                  id="email"
                  className="bc-input"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@bluecare.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <FieldError id="email-error">
                    {errors.email.message}
                  </FieldError>
                )}
              </Field>
            )}
            {mode === "login" && passwordField("password", "Contraseña", true)}
            {["change-password", "change-email"].includes(mode) &&
              passwordField("currentPassword", "Contraseña actual", true)}
            {needsPassword && (
              <>
                {passwordField("password", "Nueva contraseña")}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mínimo 8 caracteres con mayúscula, minúscula, número y
                  símbolo. Sin espacios; máximo 72 bytes.
                </p>
                {passwordField("confirmPassword", "Confirmar nueva contraseña")}
              </>
            )}
            {(mode === "login" || needsPassword || mode === "change-email") && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={show}
                  onChange={(e) => setShow(e.target.checked)}
                />
                Mostrar contraseñas
              </label>
            )}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Procesando…" : content[mode].button}
            </Button>
          </fieldset>
        </form>
      )}
      <div className="mt-5 flex flex-col gap-3 text-sm">
        {mode === "login" ? (
          <>
            <Link className="bc-link" to="/recuperar-acceso">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link className="bc-link" to="/solicitar-activacion">
              ¿Tu cuenta está pendiente de activar?
            </Link>
          </>
        ) : (
          <BackLink to="/iniciar-sesion">
            {peopleMessages().backToSignIn}
          </BackLink>
        )}
        {tokenFlow && !done && (
          <Link
            className="bc-link"
            to={
              mode === "reset" ? "/recuperar-acceso" : "/solicitar-activacion"
            }
          >
            {mode === "invitation"
              ? "Solicitar activación de una cuenta ya registrada"
              : "Solicitar un nuevo enlace"}
          </Link>
        )}
        {mode === "invitation" && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Si la invitación venció o fue revocada, solicita a quien te invitó
            que la reenvíe.
          </p>
        )}
        {["change-email", "change-password"].includes(mode) && (
          <BackLink to="/mi-cuenta">{peopleMessages().backToAccount}</BackLink>
        )}
      </div>
    </AuthLayout>
  );
}
