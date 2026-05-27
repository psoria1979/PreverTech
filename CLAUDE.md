<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PreverTech — AI Assistant Guide

Industrial maintenance management app. Work orders, machines, spare parts, time tracking, maintenance plans, PDF export, PWA.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, React 19) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 with `@tailwindcss/postcss` |
| ORM | Prisma 6.19.3 |
| Database | PostgreSQL |
| Auth | NextAuth.js 4 (credentials + JWT, PIN-based) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| QR | qrcode |
| Dates | date-fns |

---

## Commands

```bash
# Development
npm run dev            # Start dev server at localhost:3000
npm run build          # Production build
npm start              # Run production build
npm run lint           # ESLint check

# Database
npm run db:push        # Sync Prisma schema to DB (no migration file)
npm run db:migrate     # Create a new dev migration
npm run db:seed        # Load demo data (3 users, 3 machines, 3 orders)
npm run db:studio      # Open Prisma Studio UI
```

No test suite exists. There is no CI/CD configuration.

---

## Environment Variables

Required in `.env`:

```
DATABASE_URL=           # PostgreSQL connection string
NEXTAUTH_SECRET=        # Session signing key (openssl rand -base64 32)
NEXTAUTH_URL=           # Base URL (http://localhost:3000 in dev)
```

---

## Project Structure

```
prisma/
  schema.prisma         # All DB models and enums
  seed.ts               # Demo data (jefe/operario1/operario2 with PIN 1234)
src/
  app/
    (app)/              # Protected routes — sidebar layout, requires auth
      dashboard/        # KPI charts with date filter + PDF export
      machines/         # CRUD + machine timeline + QR code
      orders/           # Work orders list, detail, edit, new
        [id]/
          edit/
          pdf/          # Printable PDF view
        calendar/       # Calendar view of scheduled orders
        new/
      parts/            # Spare parts inventory
      plans/            # Preventive maintenance plans (JEFE only)
      profile/          # View own data + change PIN
      notifications/    # In-app notification list
      users/            # User management (JEFE only)
      layout.tsx        # Sidebar + unread notification badge
    api/
      auth/[...nextauth]/
      machines/         # CRUD + /[id]/qr
      orders/           # CRUD + /[id]/photos + /[id]/comments + /[id]/parts + /[id]/time
      parts/            # CRUD
      plans/            # CRUD + /generate
      notifications/    # List + mark-read
      reports/          # orders.csv, dashboard.pdf
      profile/          # PIN change
    login/              # Login page
    layout.tsx          # Root layout + metadata
    manifest.ts         # PWA manifest
    providers.tsx       # SessionProvider wrapper
  components/
    Badges.tsx          # StatusBadge, PriorityBadge, TypeBadge
    NavLink.tsx         # Sidebar nav link with optional badge count
    PageHeader.tsx      # Page title + action buttons slot
    SignOutButton.tsx   # Logout button
  lib/
    auth.ts             # NextAuth config (credentials provider, bcryptjs PIN)
    session.ts          # requireUser() and requireJefe() server helpers
    permissions.ts      # visibleOrdersWhere() and canViewOrder()
    order-filters.ts    # parseOrderFilters() + buildOrdersWhere()
    notifications.ts    # notifyOrderAssigned(), notifyStatusChanged()
    order-pdf.tsx       # React PDF layout for a single work order
    dashboard-pdf.tsx   # React PDF layout for the dashboard report
    prisma.ts           # Prisma client singleton
  types/
    next-auth.d.ts      # Session/JWT type extensions
```

---

## Authentication & Authorization

Authentication uses NextAuth.js credentials provider. Users log in with `username` + PIN (hashed with bcryptjs). Sessions are JWT-based.

**Roles:**
- `JEFE` — full access: create/edit orders, machines, users, parts, plans
- `EMPLEADO` — read access limited by order visibility + their assignments

**Server-side guards** (always use these in server components and API routes):

```ts
import { requireUser } from "@/lib/session";  // redirects to /login if unauthenticated
import { requireJefe } from "@/lib/session";  // redirects to /dashboard if not JEFE
```

---

## Visibility Rules

Each `WorkOrder` has a `visibility` field controlling who can see it:

| Value | JEFE | Assigned EMPLEADOs | All EMPLEADOs |
|---|:---:|:---:|:---:|
| `SOLO_JEFES` | ✔ | ✘ | ✘ |
| `ASIGNADOS` | ✔ | ✔ | ✘ |
| `TODOS` | ✔ | ✔ | ✔ |

Implementation in `src/lib/permissions.ts`:
- `visibleOrdersWhere(user)` — Prisma `where` clause for list queries
- `canViewOrder(user, order)` — point check for a single order

Every API route and page listing orders **must** apply `visibleOrdersWhere`. Never expose orders to EMPLEADOs without this filter.

---

## Database Schema

**Enums:**
- `Role`: `JEFE`, `EMPLEADO`
- `MachineStatus`: `OPERATIVA`, `EN_MANTENIMIENTO`, `FUERA_DE_SERVICIO`
- `WorkType`: `PREDICTIVO`, `PREVENTIVO`, `CORRECTIVO`, `MEJORA`, `INSPECCION`
- `Priority`: `BAJA`, `MEDIA`, `ALTA`, `CRITICA`
- `OrderStatus`: `PENDIENTE`, `EN_PROGRESO`, `COMPLETADA`, `CANCELADA`
- `Visibility`: `SOLO_JEFES`, `ASIGNADOS`, `TODOS`

**Key models:**
- `User` — username (unique), pinHash, name, role, active
- `Machine` — code (unique), name, location, description, status
- `WorkOrder` — number (autoincrement, unique), title, type, priority, status, visibility, scheduledFor, machineId, creatorId, planId
- `WorkOrderAssignment` — workOrderId + userId (unique pair)
- `WorkOrderPhoto` — image data stored as `Bytes` directly in DB
- `OrderComment` — body, workOrderId, userId
- `Notification` — title, message, workOrderId?, readAt?
- `Part` — code (unique), name, unit, stock, minStock, unitCost
- `PartUsage` — workOrderId, partId, quantity, unitCost (captured at use time)
- `TimeLog` — workOrderId, userId, minutes
- `MaintenancePlan` — machineId, frequencyDays, nextDueAt, active; generates `WorkOrder`s

**Cascade rules:**
- Deleting a `WorkOrder` cascades to photos, comments, assignments, part usages, time logs, notifications
- Deleting a `Machine` is **restricted** if orders exist; cascades to plans
- Deleting a `User` cascades to assignments, comments, notifications

---

## Code Patterns

### API Routes

All API routes follow this pattern:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";       // or requireJefe
import { visibleOrdersWhere } from "@/lib/permissions";

const schema = z.object({ ... });

export async function GET() {
  const user = await requireUser();
  // apply visibility filter for order queries
  const where = visibleOrdersWhere(user);
  const data = await prisma.workOrder.findMany({ where, ... });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await requireJefe();             // JEFE-only mutations
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  // ...
  return NextResponse.json(result, { status: 201 });
}
```

### Server Components (pages)

```ts
export const dynamic = "force-dynamic";  // always add this on pages using live DB data

export default async function SomePage({ searchParams }: { searchParams: Promise<...> }) {
  const user = await requireUser();
  const sp = await searchParams;         // searchParams is a Promise in Next.js 16
  // fetch data with Prisma directly — no API calls from server components
  return <JSX />;
}
```

### Notifications

When an order is assigned to employees or changes status, call helpers from `src/lib/notifications.ts`:

```ts
await notifyOrderAssigned(assigneeIds, { id, number, title });
await notifyStatusChanged(assigneeIds, { id, number, title }, newStatus);
```

### Zod Validation

All API input is validated with Zod. Use `.safeParse()` and return `{ error, details }` on failure. Enum values in Zod must match Prisma enums exactly (Spanish uppercase strings).

---

## Styling Conventions

- Tailwind CSS v4 — use utility classes directly, no `tailwind.config.js`
- Theme color: orange (`bg-orange-600`, `hover:bg-orange-700`)
- Dark mode is supported via `dark:` variants
- Use `clsx` for conditional class names
- `globals.css` imports Tailwind and defines CSS custom properties

---

## Important Next.js 16 Notes

- `searchParams` in page components is a **Promise** — always `await` it
- `params` in dynamic routes is also a **Promise** — always `await` it
- Server components fetch data directly from Prisma — do not call internal API routes
- `export const dynamic = "force-dynamic"` is required on pages with live data
- The `(app)` folder group is the protected area; its `layout.tsx` wraps content with the sidebar

---

## Seed Users (PIN: `1234`)

| Username | Role |
|---|---|
| `jefe` | JEFE |
| `operario1` | EMPLEADO |
| `operario2` | EMPLEADO |

---

## Schema Changes

When modifying `prisma/schema.prisma`:
1. Run `npm run db:push` for dev (no migration file needed)
2. Run `npm run db:migrate` when a tracked migration is required
3. Prisma client is regenerated automatically via the `postinstall` hook

Photo data is stored as `Bytes` in the database — no external file storage. Keep this in mind for large-scale deployments.
