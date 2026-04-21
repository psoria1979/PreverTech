# PreverTech · Mantenimiento Industrial

Aplicación web para gestionar mantenimiento industrial: órdenes de trabajo (predictivo / preventivo / correctivo / mejora / inspección), base de datos de máquinas, usuarios con roles y dashboard de KPIs.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 6** + **PostgreSQL**
- **NextAuth.js** (usuario + PIN)
- **Recharts** para gráficos
- **@react-pdf/renderer** para imprimir órdenes en PDF

## Funcionalidades

- **Autenticación** con usuario y PIN (hash bcrypt).
- **Roles**: `JEFE` y `EMPLEADO`. Solo los jefes crean/editan órdenes, máquinas y usuarios.
- **Órdenes de trabajo** con:
  - Tipo: predictivo, preventivo, correctivo, mejora, inspección.
  - Prioridad y estado (pendiente, en progreso, completada, cancelada).
  - Máquina asociada, programación, notas.
  - **Visibilidad configurable por orden**:
    - `SOLO_JEFES` — la ven únicamente los jefes.
    - `ASIGNADOS` — jefes + empleados explícitamente asignados.
    - `TODOS` — jefes + todos los empleados.
  - **Exportación a PDF** imprimible (`/orders/[id]/pdf`).
- **Máquinas**: código, nombre, ubicación, estado (operativa / en mantenimiento / fuera de servicio).
- **Dashboard**: KPIs y gráficos por tipo, prioridad, estado, estado de máquinas y top máquinas con más órdenes.

## Setup

### 1. Variables de entorno

```bash
cp .env.example .env
```

Configurar en `.env`:

- `DATABASE_URL` — conexión a PostgreSQL.
- `NEXTAUTH_SECRET` — secreto de sesiones (`openssl rand -base64 32`).
- `NEXTAUTH_URL` — URL base (en dev: `http://localhost:3000`).

### 2. Base de datos

```bash
npm install
npm run db:push       # crea el esquema en Postgres
npm run db:seed       # datos demo
```

Usuarios demo (PIN `1234`):

- `jefe` — rol JEFE
- `operario1` — rol EMPLEADO
- `operario2` — rol EMPLEADO (asignado a una orden con visibilidad ASIGNADOS)

### 3. Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 4. Producción

```bash
npm run build
npm start
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm start` — iniciar producción
- `npm run db:push` — sincronizar esquema
- `npm run db:migrate` — crear migración dev
- `npm run db:seed` — cargar datos demo
- `npm run db:studio` — Prisma Studio

## Reglas de visibilidad

Cada orden tiene un campo `visibility` que determina quién la ve:

| Valor         | Jefes | Asignados | Todos los empleados |
|---------------|:-----:|:---------:|:-------------------:|
| `SOLO_JEFES`  |   ✔   |     ✘     |          ✘          |
| `ASIGNADOS`   |   ✔   |     ✔     |          ✘          |
| `TODOS`       |   ✔   |     ✔     |          ✔          |

Implementado en `src/lib/permissions.ts`:
- `visibleOrdersWhere(user)` — cláusula Prisma `where` para listados.
- `canViewOrder(user, order)` — chequeo puntual para una orden.

## Estructura

```
prisma/
  schema.prisma        User · Machine · WorkOrder · WorkOrderAssignment
  seed.ts
src/
  app/
    (app)/             layout protegido con sidebar
      dashboard/
      machines/
      orders/
      users/
    api/
      auth/[...nextauth]/
      machines/ orders/ users/
    login/
    layout.tsx · page.tsx · providers.tsx
  components/
    Badges · NavLink · PageHeader · SignOutButton
  lib/
    auth.ts            NextAuth (credentials + JWT)
    order-pdf.tsx      generador de PDF
    permissions.ts     reglas de visibilidad
    prisma.ts
    session.ts         requireUser / requireJefe
  types/
    next-auth.d.ts
```
