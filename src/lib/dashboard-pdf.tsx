import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

type Count = { label: string; value: number };

export type DashboardReportData = {
  from: Date | null;
  to: Date | null;
  generatedAt: Date;
  generatedBy: string;
  totals: {
    total: number;
    pendiente: number;
    enProgreso: number;
    completada: number;
    cancelada: number;
  };
  byType: Count[];
  byPriority: Count[];
  byStatus: Count[];
  machinesByStatus: Count[];
  topMachines: Count[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "2px solid #ea580c",
    paddingBottom: 8,
    marginBottom: 16,
  },
  brand: { fontSize: 18, fontWeight: 700, color: "#ea580c" },
  brandSub: { fontSize: 9, color: "#666" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  range: { fontSize: 10, color: "#555", marginBottom: 14 },
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },
  kpi: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 8,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 6,
    color: "#111",
  },
  table: {
    borderTop: "1px solid #ddd",
    borderLeft: "1px solid #ddd",
  },
  tr: { flexDirection: "row" },
  th: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontWeight: 700,
    color: "#555",
    textTransform: "uppercase",
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #ddd",
    borderRight: "1px solid #ddd",
  },
  td: {
    flex: 1,
    padding: 5,
    fontSize: 10,
    borderBottom: "1px solid #ddd",
    borderRight: "1px solid #ddd",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
});

function fmtDate(d: Date | null) {
  return d ? d.toLocaleDateString("es-AR") : "—";
}

function fmtDateTime(d: Date) {
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        {headers.map((h, i) => (
          <Text key={i} style={styles.th}>
            {h}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <View style={styles.tr}>
          <Text style={{ ...styles.td, flex: headers.length, color: "#999" }}>
            Sin datos
          </Text>
        </View>
      ) : (
        rows.map((r, i) => (
          <View key={i} style={styles.tr}>
            {r.map((c, j) => (
              <Text key={j} style={styles.td}>
                {String(c)}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

export async function renderDashboardPdf(
  data: DashboardReportData
): Promise<Buffer> {
  const range =
    data.from || data.to
      ? `Rango: ${fmtDate(data.from)} — ${fmtDate(data.to)}`
      : "Rango: todo el histórico";

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PreverTech</Text>
            <Text style={styles.brandSub}>Reporte de mantenimiento</Text>
          </View>
          <Text style={styles.brandSub}>
            Generado {fmtDateTime(data.generatedAt)} · {data.generatedBy}
          </Text>
        </View>

        <Text style={styles.title}>Resumen de órdenes de trabajo</Text>
        <Text style={styles.range}>{range}</Text>

        <View style={styles.row}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Total</Text>
            <Text style={styles.kpiValue}>{data.totals.total}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Pendientes</Text>
            <Text style={styles.kpiValue}>{data.totals.pendiente}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>En progreso</Text>
            <Text style={styles.kpiValue}>{data.totals.enProgreso}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Completadas</Text>
            <Text style={styles.kpiValue}>{data.totals.completada}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Canceladas</Text>
            <Text style={styles.kpiValue}>{data.totals.cancelada}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Por tipo de trabajo</Text>
        <Table
          headers={["Tipo", "Cantidad"]}
          rows={data.byType.map((r) => [r.label, r.value])}
        />

        <Text style={styles.sectionTitle}>Por prioridad</Text>
        <Table
          headers={["Prioridad", "Cantidad"]}
          rows={data.byPriority.map((r) => [r.label, r.value])}
        />

        <Text style={styles.sectionTitle}>Por estado</Text>
        <Table
          headers={["Estado", "Cantidad"]}
          rows={data.byStatus.map((r) => [r.label, r.value])}
        />

        <Text style={styles.sectionTitle}>Máquinas por estado</Text>
        <Table
          headers={["Estado", "Cantidad"]}
          rows={data.machinesByStatus.map((r) => [r.label, r.value])}
        />

        <Text style={styles.sectionTitle}>Top máquinas con más órdenes</Text>
        <Table
          headers={["Máquina", "Órdenes"]}
          rows={data.topMachines.map((r) => [r.label, r.value])}
        />

        <Text style={styles.footer} fixed>
          PreverTech · Reporte generado {fmtDateTime(data.generatedAt)}
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
