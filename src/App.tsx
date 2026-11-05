import UsersPage from "@/pages/main/users";
import RequireAuth from "@/components/shared/require-auth";
import AccountPage from "@/pages/main/account";
import AppLayout from "@/components/layout/app-layout";
import DashboardPage from "@/pages/main/dashboard";
import AdministrationPage from "@/pages/main/administration";
import PatientDetailPage from "@/pages/main/patient-detail";
import MembershipAssignmentPage from "@/pages/main/membership-assignment";
import PlanBenefitsPage from "@/pages/main/plan-benefits";
import ConsumptionRegistrationPage from "@/pages/main/consumption-registration";
import AuthPage from "@/pages/others/auth";
import NotFoundPage from "@/pages/others/not-found";
import { Navigate, Route, Routes } from "react-router";
export default function App() {
  return (
    <Routes>
      <Route
        path="/iniciar-sesion"
        element={<AuthPage key="login" mode="login" />}
      />
      <Route
        path="/recuperar-acceso"
        element={<AuthPage key="recovery" mode="recovery" />}
      />
      <Route
        path="/solicitar-activacion"
        element={<AuthPage mode="activation-request" />}
      />
      <Route
        path="/restablecer-contrasena"
        element={<AuthPage mode="reset" />}
      />
      <Route path="/reset-password" element={<AuthPage mode="reset" />} />
      <Route
        path="/aceptar-invitacion"
        element={<AuthPage mode="invitation" />}
      />
      <Route
        path="/accept-invitation"
        element={<AuthPage mode="invitation" />}
      />
      <Route
        path="/configurar-contrasena"
        element={<AuthPage mode="activate" />}
      />
      <Route path="/activate-account" element={<AuthPage mode="activate" />} />
      <Route
        path="/confirmar-correo"
        element={<AuthPage mode="confirm-email" />}
      />
      <Route
        path="/confirm-email"
        element={<AuthPage mode="confirm-email" />}
      />
      <Route
        path="/signin"
        element={<Navigate to="/iniciar-sesion" replace />}
      />
      <Route
        path="/verificar-identidad"
        element={<Navigate to="/solicitar-activacion" replace />}
      />
      <Route
        path="/two-step-verification"
        element={<Navigate to="/solicitar-activacion" replace />}
      />
      <Route element={<RequireAuth />}>
        <Route
          path="/mi-cuenta/cambiar-contrasena"
          element={<AuthPage mode="change-password" />}
        />
        <Route
          path="/mi-cuenta/cambiar-correo"
          element={<AuthPage mode="change-email" />}
        />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/mi-cuenta" element={<AccountPage />} />
          <Route
            path="/pacientes"
            element={<AdministrationPage key="pacientes" module="pacientes" />}
          />
          <Route
            path="/pacientes/santiago-izquierdo"
            element={<PatientDetailPage />}
          />
          <Route
            path="/membresias"
            element={
              <AdministrationPage key="membresias" module="membresias" />
            }
          />
          <Route
            path="/membresias/asignar"
            element={<MembershipAssignmentPage />}
          />
          <Route
            path="/planes"
            element={<AdministrationPage key="planes" module="planes" />}
          />
          <Route
            path="/planes/blue-care/beneficios"
            element={<PlanBenefitsPage />}
          />
          <Route
            path="/beneficios"
            element={
              <AdministrationPage key="beneficios" module="beneficios" />
            }
          />
          <Route
            path="/beneficios/registrar-consumo"
            element={<ConsumptionRegistrationPage />}
          />
          <Route
            path="/prevencion"
            element={
              <AdministrationPage key="prevencion" module="prevencion" />
            }
          />
          <Route
            path="/clinicas"
            element={<AdministrationPage key="clinicas" module="clinicas" />}
          />
          <Route path="/usuarios" element={<UsersPage key="users" />} />
          <Route
            path="/usuarios/invitaciones"
            element={<UsersPage key="invitations" tab="invitations" />}
          />
          <Route
            path="/auditoria"
            element={<AdministrationPage key="auditoria" module="auditoria" />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
