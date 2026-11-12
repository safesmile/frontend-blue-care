import { PlanPreviewPage } from "@/pages/main/membership-admin/plan-preview";
import {
  PlansPage,
  PlanPage,
  NewPlanPage,
  NewPlanVersionPage,
} from "@/pages/main/membership-admin/plans";
import {
  BenefitsPage,
  BenefitPage,
  NewBenefitPage,
  NewBenefitVersionPage,
} from "@/pages/main/membership-admin/benefits";
import {
  MembershipsPage,
  MembershipPage,
  AssignMembershipPage,
} from "@/pages/main/membership-admin/memberships";
import ClinicsPage from "@/pages/main/clinics";
import ClinicDetailPage from "@/pages/main/clinics/detail-page";
import ClinicFormPage from "@/pages/main/clinics/form-page";
import PatientDetailPage from "@/pages/main/patient-detail";
import PeopleDirectoryPage from "@/pages/main/people";
import CollaboratorAccessPage from "@/pages/main/people/access-page";
import PeopleEditPage from "@/pages/main/people/edit-page";
import CreateInvitationPage from "@/pages/main/invitations/create-page";
import InvitationHistoryPage from "@/pages/main/invitations";
import RequireAuth from "@/components/shared/require-auth";
import AccountPage from "@/pages/main/account";
import AppLayout from "@/components/layout/app-layout";
import DashboardPage from "@/pages/main/dashboard";
import AdministrationPage from "@/pages/main/administration";
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
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/mi-cuenta" element={<AccountPage />} />
          <Route
            path="/mi-cuenta/cambiar-contrasena"
            element={<Navigate to="/mi-cuenta?seguridad=contrasena" replace />}
          />
          <Route
            path="/mi-cuenta/cambiar-correo"
            element={<Navigate to="/mi-cuenta?seguridad=correo" replace />}
          />
          <Route
            path="/pacientes"
            element={<PeopleDirectoryPage key="patients" audience="patients" />}
          />
          <Route
            path="/pacientes/invitar"
            element={
              <CreateInvitationPage key="patient-invite" audience="patients" />
            }
          />
          <Route
            path="/pacientes/invitaciones"
            element={
              <InvitationHistoryPage
                key="patient-history"
                audience="patients"
              />
            }
          />
          <Route path="/pacientes/:id" element={<PatientDetailPage />} />
          <Route
            path="/pacientes/:id/editar"
            element={<PeopleEditPage key="patient-edit" audience="patients" />}
          />
          <Route
            path="/colaboradores"
            element={
              <PeopleDirectoryPage
                key="collaborators"
                audience="collaborators"
              />
            }
          />
          <Route
            path="/colaboradores/invitar"
            element={
              <CreateInvitationPage
                key="collaborator-invite"
                audience="collaborators"
              />
            }
          />
          <Route
            path="/colaboradores/invitaciones"
            element={
              <InvitationHistoryPage
                key="collaborator-history"
                audience="collaborators"
              />
            }
          />
          <Route
            path="/colaboradores/:id/acceso"
            element={<CollaboratorAccessPage />}
          />
          <Route
            path="/colaboradores/:id/editar"
            element={
              <PeopleEditPage
                key="collaborator-edit"
                audience="collaborators"
              />
            }
          />
          <Route path="/membresias" element={<MembershipsPage />} />
          <Route
            path="/membresias/asignar"
            element={<AssignMembershipPage />}
          />
          <Route path="/membresias/:id" element={<MembershipPage />} />
          <Route path="/planes" element={<PlansPage />} />
          <Route path="/planes/nuevo" element={<NewPlanPage />} />
          <Route path="/planes/:id" element={<PlanPage />} />
          <Route path="/planes/vista-previa" element={<PlanPreviewPage />} />
          <Route
            path="/planes/:id/vista-previa"
            element={<PlanPreviewPage />}
          />
          <Route
            path="/planes/:id/versiones/nueva"
            element={<NewPlanVersionPage />}
          />
          <Route
            path="/planes/blue-care/beneficios"
            element={<Navigate to="/beneficios" replace />}
          />
          <Route path="/beneficios" element={<BenefitsPage />} />
          <Route path="/beneficios/nuevo" element={<NewBenefitPage />} />
          <Route path="/beneficios/:id" element={<BenefitPage />} />
          <Route
            path="/beneficios/:id/versiones/nueva"
            element={<NewBenefitVersionPage />}
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
          <Route path="/clinicas" element={<ClinicsPage />} />
          <Route
            path="/clinicas/nueva"
            element={<ClinicFormPage key="new" />}
          />
          <Route path="/clinicas/:id" element={<ClinicDetailPage />} />
          <Route
            path="/clinicas/:id/editar"
            element={<ClinicFormPage key="edit" />}
          />
          <Route
            path="/usuarios"
            element={<Navigate to="/colaboradores" replace />}
          />
          <Route
            path="/usuarios/invitaciones"
            element={<Navigate to="/colaboradores/invitaciones" replace />}
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
