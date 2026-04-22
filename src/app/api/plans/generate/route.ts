import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireJefe } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const user = await requireJefe();
  const now = new Date();

  const due = await prisma.maintenancePlan.findMany({
    where: { active: true, nextDueAt: { lte: now } },
    include: { machine: { select: { id: true, code: true, name: true } } },
  });

  const created: string[] = [];
  for (const plan of due) {
    await prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.create({
        data: {
          title: plan.name,
          description:
            (plan.description ? plan.description + "\n\n" : "") +
            `Orden generada automáticamente por el plan "${plan.name}".`,
          type: plan.type,
          priority: plan.priority,
          visibility: plan.visibility,
          machineId: plan.machineId,
          creatorId: user.id,
          scheduledFor: plan.nextDueAt,
          planId: plan.id,
        },
      });
      created.push(order.id);

      // Advance nextDueAt forward until it is in the future
      let next = new Date(plan.nextDueAt);
      const oneDayMs = 24 * 60 * 60 * 1000;
      do {
        next = new Date(next.getTime() + plan.frequencyDays * oneDayMs);
      } while (next <= now);

      await tx.maintenancePlan.update({
        where: { id: plan.id },
        data: { lastGeneratedAt: now, nextDueAt: next },
      });
    });
  }

  return NextResponse.json({ generated: created.length, orderIds: created });
}
