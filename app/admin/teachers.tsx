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
import AdminSelect, {
  type AdminSelectOption,
} from "@/components/admin/AdminSelect";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { adminStyles } from "@/components/admin/styles";
import { ADMIN_COLORS } from "@/constants/colors";
import {
  listProfiles,
  updateProfileDetails,
  type AdminProfile,
} from "@/lib/admin";
import { displayName, initials } from "@/lib/profiles";

type FormState = {
  full_name: string;
  email: string;
  employee_number: string;
  department: string;
  phone: string;
};

const EMPTY_FORM: FormState = {
  full_name: "",
  email: "",
  employee_number: "",
  department: "",
  phone: "",
};

export default function ManageTeachersScreen() {
  const [teachers, setTeachers] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await listProfiles("teacher");
    if (result.error) setError(result.error);
    else setTeachers(result.data);

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
    return teachers.filter((teacher) => {
      if (
        departmentFilter !== "all" &&
        (teacher.department ?? "").trim() !== departmentFilter
      ) {
        return false;
      }
      if (!query) return true;
      return [
        teacher.full_name,
        teacher.email,
        teacher.employee_number,
        teacher.department,
        teacher.phone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [departmentFilter, search, teachers]);

  const departmentOptions = useMemo<AdminSelectOption[]>(() => {
    const departments = new Set<string>();
    teachers.forEach((teacher) => {
      if (teacher.department?.trim()) departments.add(teacher.department.trim());
    });
    return [
      { label: "All departments", value: "all" },
      ...[...departments]
        .sort((a, b) => a.localeCompare(b))
        .map((department) => ({ label: department, value: department })),
    ];
  }, [teachers]);

  const openEdit = (teacher: AdminProfile) => {
    setEditing(teacher);
    setForm({
      full_name: teacher.full_name ?? "",
      email: teacher.email,
      employee_number: teacher.employee_number ?? "",
      department: teacher.department ?? "",
      phone: teacher.phone ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
  };

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.employee_number.trim()) return "Employee number is required.";
    if (!/^[A-Za-z0-9._-]{2,30}$/.test(form.employee_number.trim())) {
      return "Employee number may only contain letters, numbers, dots, dashes, and underscores.";
    }
    return null;
  };

  const handleSave = async () => {
    if (saving || !editing) return;

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    const result = await updateProfileDetails(editing.id, {
      full_name: form.full_name.trim(),
      employee_number: form.employee_number.trim(),
      department: form.department.trim() || null,
      phone: form.phone.trim() || null,
    });

    if (result.error) {
      setFormError(result.error);
    } else {
      setModalOpen(false);
      setEditing(null);
      setNotice("Teacher record updated.");
      await load();
    }

    setSaving(false);
  };

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="Manage Teachers"
        subtitle="Review and maintain teacher records linked to their authenticated accounts."
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
            placeholder="Search teachers…"
          />
          <AdminSelect
            label="Department"
            value={departmentFilter}
            options={departmentOptions}
            onSelect={setDepartmentFilter}
          />
          <Text style={styles.countText}>
            {filtered.length} of {teachers.length} teacher records
          </Text>
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
          <AdminLoading label="Loading teacher records…" />
        ) : error ? (
          <AdminError
            title="Could not load teachers"
            message={error}
            onRetry={() => load()}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={teachers.length === 0 ? "No teachers yet" : "No matches"}
            message={
              teachers.length === 0
                ? "Teacher accounts created through registration will appear here."
                : "Try a different search term."
            }
            icon="person-outline"
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onPress={() => openEdit(teacher)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AdminFormModal
        visible={modalOpen}
        title="Edit teacher"
        subtitle="Update teacher details. Email addresses are managed by authentication."
        onClose={closeModal}
        footer={
          <View style={styles.footerRow}>
            <Pressable
              onPress={closeModal}
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
              onPress={handleSave}
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
                  name="checkmark"
                  size={17}
                  color={ADMIN_COLORS.white}
                />
              )}
              <Text style={adminStyles.buttonPrimaryText}>
                {saving ? "Saving…" : "Save Changes"}
              </Text>
            </Pressable>
          </View>
        }
      >
        <AdminField
          label="Full name"
          value={form.full_name}
          onChangeText={(value) => update("full_name", value)}
          placeholder="e.g. Ms. Ana Reyes"
          editable={!saving}
        />

        <AdminField
          label="Email"
          value={form.email}
          onChangeText={(value) => update("email", value)}
          placeholder="teacher@school.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
          hint="Email changes must be made in Supabase Auth."
        />

        <AdminField
          label="Employee number"
          value={form.employee_number}
          onChangeText={(value) => update("employee_number", value)}
          placeholder="e.g. EMP-2026-004"
          autoCapitalize="characters"
          editable={!saving}
          hint="Must be unique across all teachers and staff."
        />

        <AdminField
          label="Department"
          value={form.department}
          onChangeText={(value) => update("department", value)}
          placeholder="e.g. Science Department"
          editable={!saving}
        />

        <AdminField
          label="Phone"
          value={form.phone}
          onChangeText={(value) => update("phone", value)}
          placeholder="Optional contact number"
          keyboardType="phone-pad"
          editable={!saving}
        />

        {formError ? (
          <Text style={adminStyles.formError}>{formError}</Text>
        ) : null}
      </AdminFormModal>
    </View>
  );
}

function TeacherCard({
  teacher,
  onPress,
}: {
  teacher: AdminProfile;
  onPress: () => void;
}) {
  const name = displayName(teacher);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.teacherCard,
        pressed && { opacity: 0.78 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${name}`}
    >
      <View style={styles.teacherTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name) || "?"}</Text>
        </View>
        <View style={styles.teacherCopy}>
          <Text style={styles.teacherName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.employeeNumber} numberOfLines={1}>
            {teacher.employee_number || "No employee number"}
          </Text>
        </View>
        <AdminBadge
          label={teacher.is_active ? "Active" : "Inactive"}
          tone={teacher.is_active ? "active" : "inactive"}
        />
      </View>

      <View style={styles.teacherMetaRow}>
        <Text style={styles.teacherMeta} numberOfLines={1}>
          {teacher.department || "No department"} · {teacher.email}
        </Text>
        <Ionicons
          name="create-outline"
          size={16}
          color={ADMIN_COLORS.textSoft}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingTop: 16,
    gap: 12,
  },
  countText: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
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
  teacherCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
  },
  teacherTop: {
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
  teacherCopy: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  employeeNumber: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  teacherMetaRow: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teacherMeta: {
    flex: 1,
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
