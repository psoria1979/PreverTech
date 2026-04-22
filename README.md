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
  - **Filtros y búsqueda** por texto, tipo, estado, prioridad, máquina y rango de fechas.
  - **Exportación a PDF** imprimible por orden (`/orders/[id]/pdf`).
  - **Exportación CSV** de la lista filtrada (`/api/reports/orders.csv?...`).
  - **Fotos adjuntas** (JPEG/PNG/WebP/GIF, hasta 8 MB) subidas por el jefe o los empleados asignados.
  - **Comentarios** (hilo de actividad) — todos los que ven la orden pueden comentar.
  - **Calendario** de órdenes programadas (`/orders/calendar`).
- **Máquinas**:
  - Código, nombre, ubicación, estado (operativa / en mantenimiento / fuera de servicio).
  - **Búsqueda y filtro** por estado.
  - **Detalle con historial/timeline** de órdenes por máquina.
  - **QR code** autogenerado por máquina (`/api/machines/[id]/qr`) para escanear en planta.
- **Dashboard**:
  - KPIs y gráficos por tipo, prioridad, estado, estado de máquinas y top máquinas con más órdenes.
  - **Filtro por rango de fechas** para ver los KPIs en cualquier período.
  - **Reporte PDF** exportable (`/api/reports/dashboard.pdf?from=&to=`).
- **Notificaciones in-app**:
  - Se generan cuando se asigna una orden a un empleado o cuando cambia el estado de una orden en la que está asignado.
  - Badge con conteo de no leídas en el menú; vista dedicada en `/notifications`.
- **Perfil de usuario** (`/profile`): ver datos propios y **cambiar el PIN** propio.
- **Repuestos / inventario** (`/parts`): catálogo con stock y stock mínimo, costo unitario, alerta visual cuando el stock está bajo.
- **Consumo de repuestos por orden**: los jefes y empleados asignados registran consumos en el detalle de la orden; descuenta stock automáticamente, captura el costo unitario al momento y calcula el total de la orden. Eliminar un consumo devuelve el stock.
- **Registro de tiempo trabajado por orden**: carga de horas/minutos con nota, totalizado por orden.
- **Planes de mantenimiento preventivo recurrentes** (`/plans`, solo jefes): definen tarea + máquina + frecuencia + próxima fecha. El botón "Generar vencidos" (o `POST /api/plans/generate`) crea órdenes automáticamente y avanza la próxima fecha según la frecuencia. Las órdenes generadas quedan vinculadas al plan.
- **PWA**: manifest + ícono, se puede instalar en el celular desde el navegador ("Agregar a la pantalla de inicio").

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
                       WorkOrderPhoto · Notification
  seed.ts
src/
  app/
    (app)/             layout protegido con sidebar + badge de no leídas
      dashboard/       con filtro por fechas y descarga PDF
      machines/        lista + detalle con historial/timeline + edición
      orders/          lista con filtros + detalle + PDF + fotos
      notifications/
      users/
    api/
      auth/[...nextauth]/
      machines/
      orders/          crea/edita/elimina + fotos + PDF imprimible
      notifications/   list + marcar leídas
      reports/         orders.csv + dashboard.pdf
      users/
    login/
    layout.tsx · page.tsx · providers.tsx
  components/
    Badges · NavLink · PageHeader · SignOutButton
  lib/
    auth.ts            NextAuth (credentials + JWT)
    order-pdf.tsx      PDF de una orden
    dashboard-pdf.tsx  PDF del dashboard
    order-filters.ts   filtros/visibilidad en Prisma where
    notifications.ts   helpers de notificaciones
    permissions.ts     reglas de visibilidad
    prisma.ts
    session.ts         requireUser / requireJefe
  types/
    next-auth.d.ts
```
