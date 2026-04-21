import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const pinHash = await bcrypt.hash("1234", 10);

  const jefe = await prisma.user.upsert({
    where: { username: "jefe" },
    update: {},
    create: {
      username: "jefe",
      name: "Jefe de Mantenimiento",
      pinHash,
      role: "JEFE",
    },
  });

  await prisma.user.upsert({
    where: { username: "operario1" },
    update: {},
    create: {
      username: "operario1",
      name: "Operario Uno",
      pinHash,
      role: "EMPLEADO",
    },
  });
  const op2 = await prisma.user.upsert({
    where: { username: "operario2" },
    update: {},
    create: {
      username: "operario2",
      name: "Operario Dos",
      pinHash,
      role: "EMPLEADO",
    },
  });

  const m1 = await prisma.machine.upsert({
    where: { code: "PRN-001" },
    update: {},
    create: {
      code: "PRN-001",
      name: "Prensa hidráulica principal",
      location: "Sector A",
      description: "Prensa hidráulica de 200 toneladas",
      status: "OPERATIVA",
    },
  });
  const m2 = await prisma.machine.upsert({
    where: { code: "CMP-002" },
    update: {},
    create: {
      code: "CMP-002",
      name: "Compresor de tornillo",
      location: "Sala de máquinas",
      status: "OPERATIVA",
    },
  });
  await prisma.machine.upsert({
    where: { code: "CNC-003" },
    update: {},
    create: {
      code: "CNC-003",
      name: "Torno CNC",
      location: "Sector B",
      status: "EN_MANTENIMIENTO",
    },
  });

  const ordersCount = await prisma.workOrder.count();
  if (ordersCount === 0) {
    await prisma.workOrder.create({
      data: {
        title: "Cambio de aceite hidráulico",
        description:
          "Reemplazo programado de aceite hidráulico según plan de lubricación.",
        type: "PREVENTIVO",
        priority: "MEDIA",
        status: "PENDIENTE",
        visibility: "TODOS",
        machineId: m1.id,
        creatorId: jefe.id,
      },
    });
    await prisma.workOrder.create({
      data: {
        title: "Fuga de aire detectada",
        description: "Revisar conexiones y sellos del compresor.",
        type: "CORRECTIVO",
        priority: "ALTA",
        status: "EN_PROGRESO",
        visibility: "ASIGNADOS",
        machineId: m2.id,
        creatorId: jefe.id,
        assignments: { create: [{ userId: op2.id }] },
      },
    });
    await prisma.workOrder.create({
      data: {
        title: "Análisis vibracional trimestral",
        description: "Medición y análisis predictivo de vibraciones.",
        type: "PREDICTIVO",
        priority: "BAJA",
        status: "COMPLETADA",
        completedAt: new Date(),
        visibility: "SOLO_JEFES",
        machineId: m1.id,
        creatorId: jefe.id,
      },
    });
  }

  console.log("Seed listo. Usuarios: jefe / operario1 / operario2 · PIN: 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
