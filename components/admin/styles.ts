import { StyleSheet } from "react-native";

import { ADMIN_COLORS } from "@/constants/colors";

export const adminStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 44,
  },
  contentTop: {
    paddingTop: 18,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
    letterSpacing: 0.2,
  },
  sectionHint: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
  },
  card: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 16,
    shadowColor: ADMIN_COLORS.header,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: ADMIN_COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: ADMIN_COLORS.backgroundSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: ADMIN_COLORS.text,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  fieldError: {
    fontSize: 12,
    color: ADMIN_COLORS.danger,
    marginTop: 6,
  },
  formError: {
    backgroundColor: ADMIN_COLORS.dangerSoft,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: ADMIN_COLORS.danger,
    marginTop: 12,
    lineHeight: 18,
  },
  formSuccess: {
    backgroundColor: ADMIN_COLORS.successSoft,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: ADMIN_COLORS.success,
    marginTop: 12,
    lineHeight: 18,
  },
  button: {
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: ADMIN_COLORS.header,
  },
  buttonPrimaryPressed: {
    backgroundColor: ADMIN_COLORS.headerRaised,
  },
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: ADMIN_COLORS.white,
  },
  buttonSecondary: {
    backgroundColor: ADMIN_COLORS.accentFaint,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  buttonDanger: {
    backgroundColor: ADMIN_COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: "transparent",
  },
  buttonDangerText: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.danger,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: ADMIN_COLORS.card,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  chipActive: {
    backgroundColor: ADMIN_COLORS.header,
    borderColor: ADMIN_COLORS.header,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: ADMIN_COLORS.textMuted,
  },
  chipTextActive: {
    color: ADMIN_COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_COLORS.border,
    marginVertical: 14,
  },
  metaText: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    lineHeight: 18,
  },
  bodyText: {
    fontSize: 14,
    color: ADMIN_COLORS.text,
    lineHeight: 20,
  },
});
