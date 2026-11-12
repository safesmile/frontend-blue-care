import { api } from "@/lib/api";
import { listSearchParams, type ListQuery, type Page } from "@/lib/list-page";

export interface Revision {
  id: string;
  number: number;
  name: string;
  description: string;
  createdAt: string;
  publishedAt: string | null;
}
export interface PlanVersion extends Revision {
  monthlyPriceCents: number;
  annualPriceCents: number;
  benefitDescriptions: string[];
  benefitIds?: string[] | null;
  maxBeneficiaries?: number | null;
  taxDisclosure: string;
}
export interface BenefitVersion extends Revision {
  limitUnits: number;
  discountBasisPoints: number | null;
  enabled: boolean;
}
export interface Plan {
  id: string;
  code: string;
  enabled: boolean;
  createdAt: string;
  currentVersion: PlanVersion | null;
  benefits?: PlanBenefit[];
  latestDraft?: PlanVersion | null;
  draftBenefits?: PlanBenefit[];
  maxBeneficiaries?: number;
}
export interface Benefit {
  id: string;
  planId: string | null;
  code: string;
  kind: "discount" | "service" | "item";
  period: "monthly" | "annual" | "contract";
  audience: "holder" | "beneficiaries" | "all";
  currentVersion: BenefitVersion | null;
  latestDraft?: BenefitVersion | null;
}
export interface PlanBenefit extends Pick<
  Benefit,
  "id" | "code" | "kind" | "period" | "audience"
> {
  name: string | null;
  description: string | null;
  enabled: boolean | null;
  limitUnits: number | null;
  discountBasisPoints: number | null;
}
export interface Membership {
  id: string;
  patientId: string;
  patientName: string;
  contractedVersion: PlanVersion;
  status: "pending" | "active" | "expired" | "suspended" | "cancelled";
  cadence: "monthly" | "annual";
  amountCents: number;
  createdAt: string;
  paidThrough: string | null;
  cancelRequestedAt: string | null;
  suspendedAt: string | null;
  closedAt: string | null;
  eligible: boolean;
  billingSync: string;
}
export interface PaidPeriod {
  id: string;
  number: number;
  paidAt: string;
  startsAt: string;
  endsAt: string;
  amountCents: number;
}

export function list<T>(
  path: string,
  offset: number,
  limit: number,
  query?: ListQuery,
  filters?: Record<string, string>,
) {
  const params = listSearchParams(limit, offset, query);
  Object.entries(filters ?? {}).forEach(([field, value]) =>
    params.set(field, value),
  );
  return api.authorized<Page<T>>(path + "?" + params);
}
export function save<T>(
  path: string,
  body: object = {},
  method: "POST" | "PUT" | "PATCH" = "POST",
) {
  return api.authorized<T>(path, { method, body });
}
export const plans = (offset: number, limit: number, query?: ListQuery) =>
  list<Plan>("/plans", offset, limit, query);
export const catalog = (offset: number, limit: number, query?: ListQuery) =>
  list<Plan>("/plans/catalog", offset, limit, query);
export const memberships = (offset: number, limit: number, query?: ListQuery) =>
  list<Membership>("/memberships", offset, limit, query);
