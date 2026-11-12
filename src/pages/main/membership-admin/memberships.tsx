import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { DynamicTable } from "@/components/shared/dynamic-table";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, EyeIcon } from "@/icons";
import type { Page } from "@/lib/list-page";
import { peopleApi } from "../invitations/service";
import type { Patient } from "../invitations/api";
import {
  list,
  memberships,
  save,
  type Benefit,
  type Membership,
  type PaidPeriod,
  type Plan,
} from "./api";
import {
  ActionLink,
  AdminForm,
  AdminPage,
  Loading,
  SelectField,
  cadence,
  date,
  field,
  money,
  useGrants,
  useMutation,
  useResource,
} from "./shared";

const states = {
  pending: "Pendiente de pago",
  active: "Activa",
  expired: "Vencida",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};
const billing = {
  review: "En revisión",
  pending: "Sincronización pendiente",
  stopped: "Renovaciones detenidas",
  paused: "Cobro pausado",
  active: "Cobro activo",
  "not-started": "Por iniciar",
};
const back: [string, string] = ["/membresias", "Volver a membresías"];

export function MembershipsPage() {
  const has = useGrants();
  return (
    <AdminPage
      title="Membresías"
      description="Consulta los contratos de pacientes, su vigencia, pagos confirmados y renovaciones. Cada membresía pertenece al paciente y su acceso a beneficios depende del pago."
    >
      <DynamicTable<Membership>
        title="Contratos registrados"
        rowKey={(row) => row.id}
        load={memberships}
        toolbar={
          has("memberships:create") &&
          has("patients:list") &&
          has("plans:catalog") && (
            <ActionLink to="/membresias/asignar">Asignar membresía</ActionLink>
          )
        }
        columns={[
          {
            id: "patientName",
            label: "Paciente",
            value: (row) => row.patientName ?? row.patientId,
            sortable: true,
            filter: { type: "contains" },
          },
          {
            id: "plan",
            label: "Plan contratado",
            value: (row) => row.contractedVersion.name,
          },
          {
            id: "cadence",
            label: "Modalidad",
            value: (row) => cadence[row.cadence],
            sortable: true,
            filter: {
              type: "in",
              options: Object.entries(cadence).map(([value, label]) => ({
                value,
                label,
              })),
            },
          },
          { id: "status", label: "Estado", value: (row) => states[row.status] },
          {
            id: "amountCents",
            label: "Precio contratado",
            value: (row) => money(row.amountCents),
            sortable: true,
          },
          {
            id: "paidThrough",
            label: "Vigente hasta",
            value: (row) => row.paidThrough,
            type: "date",
            sortable: true,
            filter: { type: "dateRange" },
          },
        ]}
        actions={
          has("memberships:read")
            ? [
                {
                  label: "Ver membresía",
                  icon: <EyeIcon aria-hidden="true" className="size-4" />,
                  to: (row) => "/membresias/" + row.id,
                },
              ]
            : undefined
        }
      />
    </AdminPage>
  );
}

export function AssignMembershipPage() {
  const navigate = useNavigate();
  const has = useGrants();
  const [patient, setPatient] = useState<Patient>();
  const [revision, setRevision] = useState(0);
  const result = useResource<Page<Plan>>("/plans/catalog?limit=100", revision);
  const published = result?.data?.items.flatMap((item) =>
    item.currentVersion ? [item.currentVersion] : [],
  );
  return (
    <AdminPage
      title="Asignar membresía"
      description="Selecciona al paciente, un plan publicado y la modalidad de pago. El contrato queda pendiente hasta que Recurrente confirme el pago."
      back={back}
    >
      {patient ? (
        <section className="bc-panel flex flex-wrap items-center justify-between gap-3">
          <p>
            <strong>Paciente</strong> · {patient.firstName} {patient.lastName}
          </p>
          <Button variant="outline" onClick={() => setPatient(undefined)}>
            Cambiar paciente
          </Button>
        </section>
      ) : (
        <DynamicTable<Patient>
          title="Seleccionar paciente"
          rowKey={(row) => row.id}
          load={peopleApi.patients}
          columns={[
            {
              id: "name",
              label: "Nombre",
              value: (row) => row.firstName + " " + row.lastName,
              sortable: true,
              filter: { type: "contains" },
            },
            {
              id: "email",
              label: "Correo",
              value: (row) => row.email,
              sortable: true,
              filter: { type: "contains" },
            },
          ]}
          actions={[
            {
              label: "Seleccionar paciente",
              icon: <CheckIcon aria-hidden="true" className="size-4" />,
              visible: (row) => row.enabled,
              onClick: setPatient,
            },
          ]}
        />
      )}
      {patient &&
        (!published ? (
          <Loading
            error={result?.error}
            onRetry={() => setRevision((value) => value + 1)}
          />
        ) : !published.length ? (
          <p className="bc-panel">
            Publica y habilita un plan antes de asignar una membresía.
          </p>
        ) : (
          <AdminForm
            key={patient.id}
            title="Condiciones de contratación"
            action="Registrar contrato pendiente"
            success="Membresía registrada, pendiente de pago."
            onSave={async (values) => {
              const saved = await save<Membership>("/memberships", {
                patientId: patient.id,
                planVersionId: field(values, "plan"),
                cadence: field(values, "cadence"),
              });
              void navigate(
                has("memberships:read")
                  ? "/membresias/" + saved.id
                  : "/membresias",
                { replace: true },
              );
            }}
          >
            <SelectField
              label="Plan y precios vigentes"
              name="plan"
              options={Object.fromEntries(
                published.map((row) => [
                  row.id,
                  row.name +
                    " · " +
                    money(row.monthlyPriceCents) +
                    " mensual / " +
                    money(row.annualPriceCents) +
                    " anual",
                ]),
              )}
            />
            <SelectField
              label="Modalidad de pago"
              name="cadence"
              options={cadence}
            />
          </AdminForm>
        ))}
    </AdminPage>
  );
}

interface Balance {
  benefit: Benefit;
  usedUnits: number;
  remainingUnits: number;
  windowEnd: string | null;
}

export function MembershipPage() {
  const { id } = useParams();
  const has = useGrants();
  const [refresh, setRefresh] = useState(0);
  const [transition, setTransition] = useState<"suspend" | "cancel">();
  const changed = () => setRefresh((value) => value + 1);
  const mutation = useMutation();
  const path = "/memberships/" + encodeURIComponent(id ?? "");
  const result = useResource<Membership>(path, refresh);
  const row = result?.data;
  const periods = useCallback(
    (offset: number, limit: number) =>
      list<PaidPeriod>(path + "/periods", offset, limit),
    [path],
  );
  const balances = useCallback(
    (offset: number, limit: number) =>
      list<Balance>("/benefits" + path + "/balances", offset, limit),
    [path],
  );
  return (
    <AdminPage
      title="Detalle de membresía"
      description="Consulta las condiciones aceptadas, la vigencia y el historial de pagos del paciente."
      back={back}
    >
      {!row ? (
        <Loading error={result?.error} onRetry={changed} />
      ) : (
        <>
          <section className="bc-panel space-y-4">
            <h2 className="text-lg font-semibold">
              {row.patientName ?? row.patientId}
            </h2>
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                [
                  "Plan contratado",
                  row.contractedVersion.name +
                    " · v" +
                    row.contractedVersion.number,
                ],
                ["Modalidad", cadence[row.cadence]],
                ["Precio contratado", money(row.amountCents)],
                ["Estado", states[row.status]],
                ["Vigencia pagada hasta", date(row.paidThrough)],
                [
                  "Cobro",
                  billing[row.billingSync as keyof typeof billing] ??
                    row.billingSync,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {label}
                  </dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {row.cancelRequestedAt && (
              <p className="bc-notice">
                Cancelación solicitada el {date(row.cancelRequestedAt)}.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {has("memberships:cancel") &&
                !row.cancelRequestedAt &&
                !row.closedAt && (
                  <Button
                    variant="outline"
                    onClick={() => setTransition("cancel")}
                  >
                    Cancelar renovación
                  </Button>
                )}
              {has("memberships:suspend") &&
                !row.suspendedAt &&
                !row.closedAt && (
                  <Button
                    variant="destructive"
                    onClick={() => setTransition("suspend")}
                  >
                    Suspender membresía
                  </Button>
                )}
            </div>
          </section>
          <DynamicTable<PaidPeriod>
            title="Períodos pagados"
            description="Los pagos confirmados conservan su historial."
            load={periods}
            rowKey={(item) => item.id}
            columns={[
              { id: "number", label: "Período", value: (item) => item.number },
              {
                id: "paidAt",
                label: "Fecha de pago",
                value: (item) => item.paidAt,
                type: "datetime",
              },
              {
                id: "startsAt",
                label: "Desde",
                value: (item) => item.startsAt,
                type: "date",
              },
              {
                id: "endsAt",
                label: "Hasta",
                value: (item) => item.endsAt,
                type: "date",
              },
              {
                id: "amount",
                label: "Importe",
                value: (item) => money(item.amountCents),
              },
            ]}
          />
          {has("benefits:balances") && (
            <DynamicTable<Balance>
              title="Saldo de beneficios del titular"
              description="El saldo es global entre clínicas. Los cupos del titular y los familiares son independientes."
              load={balances}
              rowKey={(item) => item.benefit.id}
              columns={[
                {
                  id: "name",
                  label: "Beneficio",
                  value: (item) =>
                    item.benefit.currentVersion?.name ?? item.benefit.code,
                },
                {
                  id: "used",
                  label: "Usados",
                  value: (item) => item.usedUnits,
                },
                {
                  id: "remaining",
                  label: "Restantes",
                  value: (item) => item.remainingUnits,
                },
                {
                  id: "windowEnd",
                  label: "Fin del período",
                  value: (item) => item.windowEnd,
                  type: "date",
                },
              ]}
            />
          )}
          <ConfirmationDialog
            open={!!transition}
            title={
              transition === "suspend"
                ? "Suspender membresía"
                : "Cancelar renovación"
            }
            description={
              transition === "suspend"
                ? "Los beneficios se suspenden de inmediato. La fecha de vencimiento pagada se conserva y se solicita pausar el cobro."
                : "Se solicitará detener cobros futuros. La cobertura pagada permanece hasta su vencimiento."
            }
            confirmLabel="Confirmar"
            destructive
            onClose={() => setTransition(undefined)}
            onConfirm={async () => {
              if (!transition) return;
              await mutation.run(async () => {
                await save(path + "/" + transition);
                changed();
              }, "Cambio registrado.");
            }}
          />
        </>
      )}
    </AdminPage>
  );
}
