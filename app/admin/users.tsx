import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import AdminBadge from "@/components/admin/AdminBadge";
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
  listProfiles,
  setUserActive,
  setUserRole,
  type AdminProfile,
} from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { formatDate } from "@/lib/datetime";
import { displayName, initials, type Role } from "@/lib/profiles";

const ROLE_FILTERS: { label: string; value: "all" | Role }[] = [
  { label: "All", value: "all" },
  { label: "Students", value: "student" },
  { label: "Teachers", value: "teacher" },
  { label: "Admins", value: "admin" },
];

const ROLE_OPTIONS: { label: string; value: Role; hint: string }[] = [
  {
    label: "Student",
    value: "student",
    hint: "Can scan QR codes and view their own attendance.",
  },
  {
    label: "Teacher",
    value: "teacher",
    hint: "Can create events, issue QR codes, and view event attendance.",
  },
  {
    label: "Admin",
    value: "admin",
    hint: "Full access to users, records, events, and reports.",
  },
];

export default function ManageUsersScreen() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [selected, setSelected] = useState<AdminProfile | null>(null);
  const [savingRole, setSavingRole] = useState<Role | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await listProfiles();
    if (result.error) setError(result.error);
    else setProfiles(result.data);

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
    return profiles.filter((profile) => {
      if (roleFilter !== "all" && profile.role !== roleFilter) return false;
      if (!query) return true;
      return [
        profile.full_name,
        profile.email,
        profile.student_number,
        profile.employee_number,
        profile.department,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [profiles, roleFilter, search]);

  const openUser = (profile: AdminProfile) => {
    setSelected(profile);
    setActionError(null);
    setActionSuccess(null);
  };

  const closeUser = () => {
    setSelected(null);
    setActionError(null);
    setActionSuccess(null);
  };

  const handleRoleChange = (role: Role) => {
    if (!selected || role === selected.role) return;

    if (selected.id === currentUser?.id) {
      setActionError("You cannot change your own role.");
      return;
    }

    confirmAction({
      title: "Change user role?",
      message: `${displayName(selected)} will become a ${role}. Their access changes immediately.`,
      confirmLabel: "Change Role",
      destructive: role !== "admin",
      onConfirm: async () => {
        setSavingRole(role);
        setActionError(null);
        setActionSuccess(null);

        const result = await setUserRole(selected.id, role);
        if (result.error) {
          setActionError(result.error);
        } else {
          const updated = { ...selected, role };
          setSelected(updated);
          setProfiles((current) =>
            current.map((profile) =>
              profile.id === updated.id ? updated : profile,
            ),
          );
          setActionSuccess(`Role updated to ${role}.`);
        }

        setSavingRole(null);
      },
    });
  };

  const handleStatusChange = (active: boolean) => {
    if (!selected) return;

    if (selected.id === currentUser?.id) {
      setActionError("You cannot change your own account status.");
      return;
    }

    confirmAction({
      title: active ? "Activate account?" : "Deactivate account?",
      message: active
        ? `${displayName(selected)} will be able to sign in and use the app again.`
        : `${displayName(selected)} will be blocked from signing in and will lose data access.`,
      confirmLabel: active ? "Activate" : "Deactivate",
      destructive: !active,
      onConfirm: async () => {
        setSavingStatus(true);
        setActionError(null);
        setActionSuccess(null);

        const result = await setUserActive(selected.id, active);
        if (result.error) {
          setActionError(result.error);
        } else {
          const updated = { ...selected, is_active: active };
          setSelected(updated);
          setProfiles((current) =>
            current.map((profile) =>
              profile.id === updated.id ? updated : profile,
            ),
          );
          setActionSuccess(
            active ? "Account activated." : "Account deactivated.",
          );
        }

        setSavingStatus(false);
      },
    });
  };

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="Manage Users"
        subtitle="Search registered accounts, assign roles, and control account access."
        eyebrow="Administration"
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
          <AdminSearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email, or ID…"
          />
          <View style={[adminStyles.chipRow, styles.filterRow]}>
            {ROLE_FILTERS.map((filter) => {
              const active = roleFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  onPress={() => setRoleFilter(filter.value)}
                  style={[adminStyles.chip, active && adminStyles.chipActive]}
                >
                  <Text
                    style={[
                      adminStyles.chipText,
                      active && adminStyles.chipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.countText}>
            {filtered.length} of {profiles.length} accounts
          </Text>
        </View>

        {loading ? (
          <AdminLoading label="Loading registered users…" />
        ) : error ? (
          <AdminError
            title="Could not load users"
            message={error}
            onRetry={() => load()}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title="No users found"
            message={
              profiles.length === 0
                ? "No accounts have registered yet."
                : "No accounts match the current search and role filter."
            }
            icon="people-outline"
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((profile) => (
              <UserCard
                key={profile.id}
                profile={profile}
                isCurrent={profile.id === currentUser?.id}
                onPress={() => openUser(profile)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AdminFormModal
        visible={!!selected}
        title="User details"
        subtitle="Role and access changes are verified by the database."
        onClose={closeUser}
        footer={
          <Pressable
            onPress={closeUser}
            style={({ pressed }) => [
              adminStyles.button,
              adminStyles.buttonSecondary,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={adminStyles.buttonSecondaryText}>Done</Text>
          </Pressable>
        }
      >
        {selected ? (
          <>
            <View style={styles.detailIdentity}>
              <View style={styles.detailAvatar}>
                <Text style={styles.detailAvatarText}>
                  {initials(displayName(selected)) || "?"}
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
                label={selected.role}
                tone={selected.role}
              />
            </View>

            {selected.id === currentUser?.id ? (
              <Text style={styles.selfNote}>
                You are viewing your own account. Role and status changes are
                disabled to prevent accidental lockout.
              </Text>
            ) : null}

            <Text style={adminStyles.label}>Role</Text>
            <View style={styles.roleList}>
              {ROLE_OPTIONS.map((option) => {
                const active = selected.role === option.value;
                const saving = savingRole === option.value;
                const disabled =
                  selected.id === currentUser?.id || savingRole !== null;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleRoleChange(option.value)}
                    disabled={disabled}
                    style={[
                      styles.roleOption,
                      active && styles.roleOptionActive,
                      disabled && !active && { opacity: 0.5 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleOptionTitle}>{option.label}</Text>
                      <Text style={styles.roleOptionHint}>{option.hint}</Text>
                    </View>
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color={ADMIN_COLORS.accentStrong}
                      />
                    ) : (
                      <Ionicons
                        name={
                          active
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={20}
                        color={
                          active
                            ? ADMIN_COLORS.accentStrong
                            : ADMIN_COLORS.textSoft
                        }
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.statusCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Account status</Text>
                <Text style={styles.statusHint}>
                  Inactive accounts cannot sign in or read app data.
                </Text>
              </View>
              {savingStatus ? (
                <ActivityIndicator
                  size="small"
                  color={ADMIN_COLORS.accentStrong}
                />
              ) : (
                <Switch
                  value={selected.is_active}
                  onValueChange={handleStatusChange}
                  disabled={
                    selected.id === currentUser?.id || savingStatus
                  }
                  trackColor={{
                    false: ADMIN_COLORS.borderStrong,
                    true: ADMIN_COLORS.accent,
                  }}
                  thumbColor={ADMIN_COLORS.white}
                />
              )}
            </View>

            {actionError ? (
              <Text style={adminStyles.formError}>{actionError}</Text>
            ) : null}
            {actionSuccess ? (
              <Text style={adminStyles.formSuccess}>{actionSuccess}</Text>
            ) : null}

            <View style={adminStyles.divider} />
            <DetailRow label="Email" value={selected.email} />
            <DetailRow
              label="Student number"
              value={selected.student_number || "Not set"}
            />
            <DetailRow
              label="Employee number"
              value={selected.employee_number || "Not set"}
            />
            <DetailRow
              label="Department"
              value={selected.department || "Not set"}
            />
            <DetailRow label="Phone" value={selected.phone || "Not set"} />
            <DetailRow
              label="Created"
              value={formatDate(selected.created_at)}
            />
            <DetailRow label="User ID" value={selected.id} small />
          </>
        ) : null}
      </AdminFormModal>
    </View>
  );
}

function UserCard({
  profile,
  isCurrent,
  onPress,
}: {
  profile: AdminProfile;
  isCurrent: boolean;
  onPress: () => void;
}) {
  const name = displayName(profile);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.userCard,
        pressed && styles.userCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}'s details`}
    >
      <View style={styles.userCardTop}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {initials(name) || "?"}
          </Text>
        </View>

        <View style={styles.userCopy}>
          <Text style={styles.userName} numberOfLines={1}>
            {name} {isCurrent ? <Text style={styles.youLabel}>You</Text> : null}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {profile.email}
          </Text>
        </View>

        <AdminBadge label={profile.role} tone={profile.role} />
      </View>

      <View style={styles.userMetaRow}>
        <Text style={styles.userMeta}>
          {profile.student_number
            ? `Student ${profile.student_number}`
            : profile.employee_number
              ? `Employee ${profile.employee_number}`
              : profile.department || "No additional details"}
        </Text>
        <AdminBadge
          label={profile.is_active ? "Active" : "Inactive"}
          tone={profile.is_active ? "active" : "inactive"}
        />
      </View>
    </Pressable>
  );
}

function DetailRow({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, small && styles.detailValueSmall]}
        selectable={small}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingTop: 16,
    gap: 12,
  },
  filterRow: {
    marginTop: 2,
  },
  countText: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
  },
  list: {
    marginTop: 14,
    gap: 10,
  },
  userCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
  },
  userCardPressed: {
    opacity: 0.78,
  },
  userCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: ADMIN_COLORS.accentStrong,
  },
  userCopy: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  youLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: ADMIN_COLORS.accentStrong,
  },
  userEmail: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  userMetaRow: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  userMeta: {
    flex: 1,
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
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
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: ADMIN_COLORS.accentFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  detailAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: ADMIN_COLORS.accentStrong,
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
  selfNote: {
    backgroundColor: ADMIN_COLORS.warningSoft,
    color: ADMIN_COLORS.warning,
    borderRadius: 10,
    padding: 10,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  roleList: {
    gap: 8,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: ADMIN_COLORS.card,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 13,
    padding: 12,
  },
  roleOptionActive: {
    borderColor: ADMIN_COLORS.accent,
    backgroundColor: ADMIN_COLORS.accentFaint,
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  roleOptionHint: {
    fontSize: 10,
    lineHeight: 15,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: ADMIN_COLORS.card,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 13,
    padding: 13,
    marginTop: 14,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  statusHint: {
    fontSize: 10,
    lineHeight: 15,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  detailRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_COLORS.border,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: ADMIN_COLORS.textSoft,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    color: ADMIN_COLORS.text,
  },
  detailValueSmall: {
    fontSize: 10,
    color: ADMIN_COLORS.textMuted,
  },
});
