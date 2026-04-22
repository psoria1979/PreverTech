import type { Prisma, WorkType, OrderStatus, Priority } from "@prisma/client";
import type { Role } from "@prisma/client";
import { visibleOrdersWhere } from "@/lib/permissions";

export type OrderFilters = {
  q?: string;
  type?: string;
  status?: string;
  priority?: string;
  machineId?: string;
  from?: string;
  to?: string;
};

const TYPES = ["PREDICTIVO", "PREVENTIVO", "CORRECTIVO", "MEJORA", "INSPECCION"];
const STATUSES = ["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"];
const PRIORITIES = ["BAJA", "MEDIA", "ALTA", "CRITICA"];

export function parseOrderFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): OrderFilters {
  const get = (k: string) => {
    if (params instanceof URLSearchParams) return params.get(k) ?? undefined;
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    q: get("q") || undefined,
    type: get("type") || undefined,
    status: get("status") || undefined,
    priority: get("priority") || undefined,
    machineId: get("machineId") || undefined,
    from: get("from") || undefined,
    to: get("to") || undefined,
  };
}

export function buildOrdersWhere(
  user: { id: string; role: Role },
  filters: OrderFilters
): Prisma.WorkOrderWhereInput {
  const and: Prisma.WorkOrderWhereInput[] = [];
  const visibility = visibleOrdersWhere(user);
  if (visibility) and.push(visibility);

  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.type && TYPES.includes(filters.type)) {
    and.push({ type: filters.type as WorkType });
  }
  if (filters.status && STATUSES.includes(filters.status)) {
    and.push({ status: filters.status as OrderStatus });
  }
  if (filters.priority && PRIORITIES.includes(filters.priority)) {
    and.push({ priority: filters.priority as Priority });
  }
  if (filters.machineId) and.push({ machineId: filters.machineId });

  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.from) createdAt.gte = new Date(filters.from);
  if (filters.to) {
    const end = new Date(filters.to);
    end.setHours(23, 59, 59, 999);
    createdAt.lte = end;
  }
  if (Object.keys(createdAt).length) and.push({ createdAt });

  return and.length ? { AND: and } : {};
}
