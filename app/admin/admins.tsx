import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AdminBadge from "@/components/admin/AdminBadge";
import AdminField from "@/components/admin/AdminField";
import AdminFormModal from "@/components/admin/AdminFormModal";
import AdminScreenHeader from "@/components/admin/AdminScreenHeader";
import AdminSearchBar from "@/components/admin/AdminSearchBar";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { adminStyles } from "@/components/admin/styles";
import { ADMIN_COLORS } from "@/constants/colors";
import {
  createManagedUser,
  listProfiles,
  setUserRole,
  type AdminProfile,
} from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { formatDate, isValidEmail } from "@/lib/datetime";
import { displayName, initials, type Role } from "@/lib/profiles";

type CreateForm = {
  full_name: string;
  email: string;
  password: string;
  phone: string;
};

const EMPTY_FORM: CreateForm = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
};

export default function AdminAccountsScreen() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [changingRole, setChangingRole] = useState<Role | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await listProfiles("admin");
    if (result.error) setError(result.error);
    else setAdmins(result.data);

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return admins;
    return admins.filter((admin) =>
      [admin.full_name, admin.email, admin.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [admins, search]);

  const activeAdmins = admins.filter((admin) => admin.is_active).length;

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (saving) return;
    setCreateOpen(false);
    setFormError(null);
  };

  const handleCreate = async () => {
    if (saving) return;

    if (!form.full_name.trim()) {
      setFormError("Full name is required.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const result = await createManagedUser({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      full_name: form.full_name.trim(),
      role: "admin",
      phone: form.phone.trim() || null,
    });

    if (result.error) {
      setFormError(result.error);
    } else {
      setCreateOpen(false);
      setNotice("Administrator account created.");
      await load();
    }

    setSaving(false);
  };

  const handleDemote = (admin: AdminProfile, role: "teacher" | "student") => {
    if (admin.id === currentUser?.id) {
      setActionError("You cannot change your own role.");
      return;
    }

    confirmAction({
      title: "Remove administrator access?",
      message: `${displayName(admin)} will be changed to a ${role} and will lose all admin permissions.`,
      confirmLabel: "Remove Access",
      destructive: true,
      onConfirm: async () => {
        setChangingRole(role);
        setActionError(null);

        const result = await setUserRole(admin.id, role);
        if (result.error) {
          setActionError(result.error);
        } else {
          setSelected(null);
          setNotice(
            `Administrator access removed. Account is now a ${role}.`,
          );
          await load();
        }

        setChangingRole(null);
      },
    });
  };

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="Admin Accounts"
        subtitle="Create administrators and review privileged access. Admin accounts can manage every record."
        eyebrow="Administration"
        rightAction={
          <Pressable
            onPress={openCreate}
            style={styles.headerAdd}
            accessibilityRole="button"
            accessibilityLabel="Create administrator"
          >
            <Ionicons name="add" size={20} color={ADMIN_COLORS.white} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={adminStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={ADMIN_COLORS.accent}
            colors={[ADMIN_COLORS.accent]}
          />
        }
      >
        <View style={styles.toolbar}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={ADMIN_COLORS.accentStrong}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>
                {activeAdmins} active administrator
                {activeAdmins === 1 ? "" : "s"}
              </Text>
              <Text style={styles.summaryHint}>
                The database always keeps at least one active administrator.
              </Text>
            </View>
          </View>

          <AdminSearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search administrators…"
          />

          <Pressable
            onPress={openCreate}
            style={({ pressed }) => [
              adminStyles.button,
              adminStyles.buttonPrimary,
              pressed && { opacity: 0.78 },
            ]}
          >
            <Ionicons
              name="person-add-outline"
              size={18}
              color={ADMIN_COLORS.white}
            />
            <Text style={adminStyles.buttonPrimaryText}>
              Create Administrator
            </Text>
          </Pressable>
        </View>

        {notice ? (
          <View style={styles.notice}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={ADMIN_COLORS.success}
            />
            <Text style={styles.noticeText}>{notice}</Text>
            <Pressable onPress={() => setNotice(null)} hitSlop={10}>
              <Ionicons name="close" size={15} color={ADMIN_COLORS.success} />
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <AdminLoading label="Loading administrator accounts…" />
        ) : error ? (
          <AdminError
            title="Could not load administrators"
            message={error}
            onRetry={() => load()}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={admins.length === 0 ? "No administrators" : "No matches"}
            message={
              admins.length === 0
                ? "Grant the first admin with the SQL command in supabase/admin_setup.sql."
                : "Try a different search term."
            }
            icon="shield-outline"
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((admin) => (
              <AdminCard
                key={admin.id}
                admin={admin}
                isCurrent={admin.id === currentUser?.id}
                onPress={() => {
                  setSelected(admin);
                  setActionError(null);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AdminFormModal
        visible={createOpen}
        title="Create administrator"
        subtitle="Uses the admin-create-user Edge Function, which verifies your admin session and keeps the service-role key on the server."
        onClose={closeCreate}
        footer={
          <View style={styles.footerRow}>
            <Pressable
              onPress={closeCreate}
              disabled={saving}
              style={({ pressed }) => [
                adminStyles.button,
                adminStyles.buttonSecondary,
                styles.footerButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={adminStyles.buttonSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              disabled={saving}
              style={({ pressed }) => [
                adminStyles.button,
                adminStyles.buttonPrimary,
                styles.footerButton,
                pressed && { opacity: 0.78 },
                saving && adminStyles.buttonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={ADMIN_COLORS.white} />
              ) : (
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={ADMIN_COLORS.white}
                />
              )}
              <Text style={adminStyles.buttonPrimaryText}>
                {saving ? "Creating…" : "Create Admin"}
              </Text>
            </Pressable>
          </View>
        }
      >
        <View style={styles.warning}>
          <Ionicons
            name="warning-outline"
            size={17}
            color={ADMIN_COLORS.warning}
          />
          <Text style={styles.warningText}>
            Administrators have full access to users, student and teacher
            records, events, attendance, reports, and QR codes.
          </Text>
        </View>

        <AdminField
          label="Full name"
          value={form.full_name}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, full_name: value }));
            setFormError(null);
          }}
          placeholder="e.g. School Registrar"
          editable={!saving}
        />
        <AdminField
          label="Email"
          value={form.email}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, email: value }));
            setFormError(null);
          }}
          placeholder="admin@school.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!saving}
        />
        <AdminField
          label="Password"
          value={form.password}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, password: value }));
            setFormError(null);
          }}
          placeholder="At least 8 characters"
          secureTextEntry
          editable={!saving}
          hint="Share through a secure channel and ask them to change it."
        />
        <AdminField
          label="Phone"
          value={form.phone}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, phone: value }));
            setFormError(null);
          }}
          placeholder="Optional contact number"
          keyboardType="phone-pad"
          editable={!saving}
        />

        {formError ? (
          <Text style={adminStyles.formError}>{formError}</Text>
        ) : null}
      </AdminFormModal>

      <AdminFormModal
        visible={!!selected}
        title="Administrator access"
        subtitle="Review this account or remove its administrator privileges."
        onClose={() => setSelected(null)}
        footer={
          <Pressable
            onPress={() => setSelected(null)}
            style={({ pressed }) => [
              adminStyles.button,
              adminStyles.buttonSecondary,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={adminStyles.buttonSecondaryText}>Close</Text>
          </Pressable>
        }
      >
        {selected ? (
          <>
            <View style={styles.detailIdentity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initials(displayName(selected)) || "AD"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailName}>
                  {displayName(selected)}
                  {selected.id === currentUser?.id ? " (You)" : ""}
                </Text>
                <Text style={styles.detailEmail}>{selected.email}</Text>
              </View>
              <AdminBadge
                label={selected.is_active ? "Active" : "Inactive"}
                tone={selected.is_active ? "active" : "inactive"}
              />
            </View>

            <View style={styles.detailMeta}>
              <Text style={styles.detailMetaText}>
                Created {formatDate(selected.created_at)}
              </Text>
              <Text style={styles.detailMetaText}>
                Phone: {selected.phone || "Not set"}
              </Text>
            </View>

            {selected.id === currentUser?.id ? (
              <Text style={styles.selfNote}>
                You cannot change your own role. Ask another administrator if
                your access needs to change.
              </Text>
            ) : (
              <>
                <View style={styles.divider} />
                <Text style={styles.dangerTitle}>
                  Remove administrator access
                </Text>
                <Text style={styles.dangerHint}>
                  The account remains active but loses all administrative
                  permissions. The change is immediate.
                </Text>

                <View style={styles.demoteRow}>
                  <Pressable
                    onPress={() => handleDemote(selected, "teacher")}
                    disabled={changingRole !== null}
                    style={({ pressed }) => [
                      adminStyles.button,
                      adminStyles.buttonSecondary,
                      styles.demoteButton,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {changingRole === "teacher" ? (
                      <ActivityIndicator
                        size="small"
                        color={ADMIN_COLORS.text}
                      />
                    ) : (
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={ADMIN_COLORS.text}
                      />
                    )}
                    <Text style={adminStyles.buttonSecondaryText}>
                      Make Teacher
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDemote(selected, "student")}
                    disabled={changingRole !== null}
                    style={({ pressed }) => [
                      adminStyles.button,
                      adminStyles.buttonDanger,
                      styles.demoteButton,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {changingRole === "student" ? (
                      <ActivityIndicator
                        size="small"
                        color={ADMIN_COLORS.danger}
                      />
                    ) : (
                      <Ionicons
                        name="school-outline"
                        size={16}
                        color={ADMIN_COLORS.danger}
                      />
                    )}
                    <Text style={adminStyles.buttonDangerText}>
                      Make Student
                    </Text>
                  </Pressable>
                </View>

                {actionError ? (
                  <Text style={adminStyles.formError}>{actionError}</Text>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </AdminFormModal>
    </View>
  );
}

function AdminCard({
  admin,
  isCurrent,
  onPress,
}: {
  admin: AdminProfile;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const name = displayName(admin);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.adminCard,
        pressed && { opacity: 0.78 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}'s administrator details`}
    >
      <View style={styles.adminTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name) || "AD"}</Text>
        </View>
        <View style={styles.adminCopy}>
          <Text style={styles.adminName} numberOfLines={1}>
            {name}{" "}
            {isCurrent ? <Text style={styles.youLabel}>You</Text> : null}
          </Text>
          <Text style={styles.adminEmail} numberOfLines={1}>
            {admin.email}
          </Text>
        </View>
        <AdminBadge label="Admin" tone="admin" />
      </View>

      <View style={styles.adminMetaRow}>
        <Text style={styles.adminMeta}>
          Created {formatDate(admin.created_at)}
        </Text>
        <AdminBadge
          label={admin.is_active ? "Active" : "Inactive"}
          tone={admin.is_active ? "active" : "inactive"}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerAdd: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ADMIN_COLORS.headerRaised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toolbar: {
    paddingTop: 16,
    gap: 12,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: ADMIN_COLORS.accentFaint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 13,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: ADMIN_COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  summaryHint: {
    fontSize: 10,
    lineHeight: 15,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ADMIN_COLORS.successSoft,
    borderRadius: 12,
    padding: 11,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: ADMIN_COLORS.success,
  },
  list: {
    marginTop: 14,
    gap: 10,
  },
  adminCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
  },
  adminTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: ADMIN_COLORS.accentStrong,
  },
  adminCopy: {
    flex: 1,
  },
  adminName: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  youLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: ADMIN_COLORS.accentStrong,
  },
  adminEmail: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  adminMetaRow: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  adminMeta: {
    flex: 1,
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
  },
  warning: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: ADMIN_COLORS.warningSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: ADMIN_COLORS.warning,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
  detailIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
    marginTop: 8,
  },
  detailName: {
    fontSize: 15,
    fontWeight: "800",
    color: ADMIN_COLORS.text,
  },
  detailEmail: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  detailMeta: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 13,
    marginTop: 10,
    gap: 4,
  },
  detailMetaText: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
  },
  selfNote: {
    backgroundColor: ADMIN_COLORS.warningSoft,
    color: ADMIN_COLORS.warning,
    borderRadius: 10,
    padding: 10,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: ADMIN_COLORS.border,
    marginVertical: 16,
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: ADMIN_COLORS.danger,
  },
  dangerHint: {
    fontSize: 11,
    lineHeight: 17,
    color: ADMIN_COLORS.textMuted,
    marginTop: 3,
    marginBottom: 10,
  },
  demoteRow: {
    flexDirection: "row",
    gap: 9,
  },
  demoteButton: {
    flex: 1,
  },
});
