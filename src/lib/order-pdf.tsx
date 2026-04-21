import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

type OrderForPdf = {
  number: number;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  visibility: string;
  scheduledFor: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  machine: { code: string; name: string; location: string | null };
  creator: { name: string; username: string };
  assignments: { user: { name: string; username: string } }[];
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
  orderNumber: { fontSize: 14, fontWeight: 700 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 12 },
  section: { marginBottom: 12 },
  label: {
    fontSize: 8,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: { fontSize: 11 },
  gridRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  gridCell: { flex: 1 },
  description: {
    backgroundColor: "#f4f4f5",
    padding: 10,
    borderRadius: 4,
    lineHeight: 1.4,
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 60,
    gap: 40,
    justifyContent: "space-between",
  },
  signatureBox: {
    flex: 1,
    borderTop: "1px solid #333",
    paddingTop: 6,
    fontSize: 9,
    textAlign: "center",
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

function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const VISIBILITY_LABEL: Record<string, string> = {
  SOLO_JEFES: "Solo jefes",
  ASIGNADOS: "Jefes y asignados",
  TODOS: "Jefes y empleados",
};

export async function renderOrderPdf(order: OrderForPdf): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>PreverTech</Text>
            <Text style={styles.brandSub}>Orden de trabajo · Mantenimiento</Text>
          </View>
          <Text style={styles.orderNumber}>N° {order.number}</Text>
        </View>

        <Text style={styles.title}>{order.title}</Text>

        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <Text style={styles.label}>Tipo</Text>
            <Text style={styles.value}>{order.type}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.label}>Prioridad</Text>
            <Text style={styles.value}>{order.priority}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.value}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <Text style={styles.label}>Máquina</Text>
            <Text style={styles.value}>
              {order.machine.code} — {order.machine.name}
            </Text>
            {order.machine.location && (
              <Text style={styles.brandSub}>{order.machine.location}</Text>
            )}
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.label}>Programada</Text>
            <Text style={styles.value}>
              {order.scheduledFor
                ? new Date(order.scheduledFor).toLocaleDateString("es-AR")
                : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <Text style={styles.label}>Creada por</Text>
            <Text style={styles.value}>{order.creator.name}</Text>
            <Text style={styles.brandSub}>{fmt(order.createdAt)}</Text>
          </View>
          <View style={styles.gridCell}>
            <Text style={styles.label}>Visibilidad</Text>
            <Text style={styles.value}>
              {VISIBILITY_LABEL[order.visibility] ?? order.visibility}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descripción del trabajo</Text>
          <Text style={styles.description}>{order.description}</Text>
        </View>

        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notas</Text>
            <Text style={styles.description}>{order.notes}</Text>
          </View>
        )}

        {order.assignments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Personal asignado</Text>
            {order.assignments.map((a, i) => (
              <Text key={i} style={styles.value}>
                · {a.user.name} (@{a.user.username})
              </Text>
            ))}
          </View>
        )}

        {order.completedAt && (
          <View style={styles.section}>
            <Text style={styles.label}>Completada</Text>
            <Text style={styles.value}>{fmt(order.completedAt)}</Text>
          </View>
        )}

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text>Firma del operario</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Firma del jefe de mantenimiento</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          PreverTech · Generado el {fmt(new Date())}
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
