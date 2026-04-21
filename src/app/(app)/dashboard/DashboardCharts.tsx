"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Datum = { label: string; value: number };

const COLORS = [
  "#ea580c",
  "#2563eb",
  "#16a34a",
  "#a855f7",
  "#db2777",
  "#eab308",
  "#0891b2",
];

export function DashboardCharts({
  typeData,
  priorityData,
  statusData,
  machineStatusData,
  topMachineData,
}: {
  typeData: Datum[];
  priorityData: Datum[];
  statusData: Datum[];
  machineStatusData: Datum[];
  topMachineData: Datum[];
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Órdenes por tipo">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={typeData}
              dataKey="value"
              nameKey="label"
              outerRadius={80}
              label
            >
              {typeData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Órdenes por prioridad">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={priorityData}>
            <XAxis dataKey="label" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="#ea580c" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Órdenes por estado">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={statusData}>
            <XAxis dataKey="label" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Máquinas por estado">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={machineStatusData}
              dataKey="value"
              nameKey="label"
              outerRadius={80}
              label
            >
              {machineStatusData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top 5 máquinas con más órdenes" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topMachineData}>
            <XAxis dataKey="label" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {title}
      </h3>
      {children}
    </div>
  );
}
