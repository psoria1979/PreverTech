import type { Role, Visibility } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export function isJefe(role: Role | undefined | null): boolean {
  return role === "JEFE";
}

/**
 * Prisma `where` clause that filters WorkOrders visible to a given user,
 * applying the per-order visibility rules:
 *  - SOLO_JEFES: only bosses
 *  - ASIGNADOS: bosses + employees in the assignment list
 *  - TODOS: bosses + all employees
 */
export function visibleOrdersWhere(user: {
  id: string;
  role: Role;
}): Prisma.WorkOrderWhereInput | undefined {
  if (user.role === "JEFE") return undefined;

  return {
    OR: [
      { visibility: "TODOS" },
      {
        visibility: "ASIGNADOS",
        assignments: { some: { userId: user.id } },
      },
    ],
  };
}

export function canViewOrder(
  user: { id: string; role: Role },
  order: { visibility: Visibility; assignments?: { userId: string }[] }
): boolean {
  if (user.role === "JEFE") return true;
  if (order.visibility === "TODOS") return true;
  if (order.visibility === "ASIGNADOS") {
    return order.assignments?.some((a) => a.userId === user.id) ?? false;
  }
  return false;
}
