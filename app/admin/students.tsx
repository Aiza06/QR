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
  listProfiles,
  updateProfileDetails,
  type AdminProfile,
} from "@/lib/admin";
import { displayName, initials } from "@/lib/profiles";

type FormState = {
  full_name: string;
  email: string;
  student_number: string;
  phone: string;
};

const EMPTY_FORM: FormState = {
  full_name: "",
  email: "",
  student_number: "",
  phone: "",
};

export default function ManageStudentsScreen() {
  const [students, setStudents] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const result = await listProfiles("student");
    if (result.error) setError(result.error);
    else setStudents(result.data);

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
    return students.filter((student) => {
      if (!query) return true;
      return [
        student.full_name,
        student.email,
        student.student_number,
        student.phone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [search, students]);

  const openEdit = (student: AdminProfile) => {
    setEditing(student);
    setForm({
      full_name: student.full_name ?? "",
      email: student.email,
      student_number: student.student_number ?? "",
      phone: student.phone ?? "",
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
    if (!form.student_number.trim()) return "Student number is required.";
    if (!/^[A-Za-z0-9._-]{2,30}$/.test(form.student_number.trim())) {
      return "Student number may only contain letters, numbers, dots, dashes, and underscores.";
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
      student_number: form.student_number.trim(),
      phone: form.phone.trim() || null,
    });

    if (result.error) {
      setFormError(result.error);
    } else {
      setModalOpen(false);
      setEditing(null);
      setNotice("Student record updated.");
      await load();
    }

    setSaving(false);
  };

  return (
    <View style={adminStyles.screen}>
      <AdminScreenHeader
        title="Manage Students"
        subtitle="Review and maintain student records linked to authenticated accounts."
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
            placeholder="Search students…"
          />
          <Text style={styles.countText}>
            {filtered.length} of {students.length} student records
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
              <Ionicons
                name="close"
                size={15}
                color={ADMIN_COLORS.success}
              />
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <AdminLoading label="Loading student records…" />
        ) : error ? (
          <AdminError
            title="Could not load students"
            message={error}
            onRetry={() => load()}
          />
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={students.length === 0 ? "No students yet" : "No matches"}
            message={
              students.length === 0
                ? "Student accounts created through registration will appear here."
                : "Try a different search term."
            }
            icon="school-outline"
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onPress={() => openEdit(student)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AdminFormModal
        visible={modalOpen}
        title="Edit student"
        subtitle="Update the student record. Email addresses are managed by authentication."
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
          placeholder="e.g. Maria Santos"
          editable={!saving}
        />

        <AdminField
          label="Email"
          value={form.email}
          onChangeText={(value) => update("email", value)}
          placeholder="student@school.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
          hint="Email changes must be made in Supabase Auth."
        />

        <AdminField
          label="Student number"
          value={form.student_number}
          onChangeText={(value) => update("student_number", value)}
          placeholder="e.g. STU-2026-0142"
          autoCapitalize="characters"
          editable={!saving}
          hint="Must be unique across all students."
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

function StudentCard({
  student,
  onPress,
}: {
  student: AdminProfile;
  onPress: () => void;
}) {
  const name = displayName(student);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.studentCard,
        pressed && { opacity: 0.78 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${name}`}
    >
      <View style={styles.studentTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(name) || "?"}</Text>
        </View>
        <View style={styles.studentCopy}>
          <Text style={styles.studentName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.studentNumber} numberOfLines={1}>
            {student.student_number || "No student number"}
          </Text>
        </View>
        <AdminBadge
          label={student.is_active ? "Active" : "Inactive"}
          tone={student.is_active ? "active" : "inactive"}
        />
      </View>

      <View style={styles.studentMetaRow}>
        <Text style={styles.studentMeta} numberOfLines={1}>
          {student.email}
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
  studentCard: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 14,
  },
  studentTop: {
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
  studentCopy: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  studentNumber: {
    fontSize: 11,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  studentMetaRow: {
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentMeta: {
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
