import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
    page: { padding: 24, fontSize: 12 },
    title: { fontSize: 18, marginBottom: 6 },
    sub: { marginBottom: 4 },
    section: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e6e6e6" },
    mealTitle: { fontSize: 14, marginBottom: 8 },
    muted: { color: "#444" },
    row: { flexDirection: "row", marginBottom: 4 },
    cellName: { width: "46%" },
    cell: { width: "18%" },
});
