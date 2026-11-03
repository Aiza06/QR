// Supabase Edge Function: admin-create-user
//
// Creates student, teacher, or administrator accounts with the service-role
// key. The caller's JWT is verified and the caller's database role must be an
// active administrator. Service-role keys never reach the mobile app.
//
// Deploy:
//   supabase functions deploy admin-create-user
//
// Required secrets are provided automatically by Supabase:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Server is not configured correctly." }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header." }, 401);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();

  if (callerError || !caller) {
    return json({ error: "Your session is invalid. Sign in again." }, 401);
  }

  const { data: callerProfile, error: callerProfileError } = await callerClient
    .from("profiles")
    .select("role, is_active")
    .eq("id", caller.id)
    .single();

  if (
    callerProfileError ||
    callerProfile?.role !== "admin" ||
    callerProfile?.is_active !== true
  ) {
    return json({ error: "Only an active administrator can create accounts." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const email = cleanString(body.email)?.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = cleanString(body.full_name);
  const role = cleanString(body.role);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "A valid email address is required." }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters." }, 400);
  }
  if (!fullName) {
    return json({ error: "Full name is required." }, 400);
  }
  if (!role || !["student", "teacher", "admin"].includes(role)) {
    return json({ error: "Role must be student, teacher, or admin." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

  if (createError || !created.user) {
    const message = createError?.message ?? "Could not create the account.";
    const friendly = /already|registered|exists/i.test(message)
      ? "An account with that email already exists."
      : message;
    return json({ error: friendly }, 400);
  }

  const profileUpdate = {
    email,
    full_name: fullName,
    role,
    is_active: true,
    student_number: cleanString(body.student_number),
    employee_number: cleanString(body.employee_number),
    grade_level: cleanString(body.grade_level),
    section: cleanString(body.section),
    department: cleanString(body.department),
    phone: cleanString(body.phone),
  };

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .update(profileUpdate)
    .eq("id", created.user.id)
    .select(
      "id, email, full_name, role, is_active, student_number, employee_number, grade_level, section, department, phone, created_at, updated_at",
    )
    .single();

  if (profileError) {
    // Do not leave a half-created account behind.
    await adminClient.auth.admin.deleteUser(created.user.id);
    const friendly = profileError.code === "23505"
      ? "That student or employee number is already in use."
      : profileError.message;
    return json({ error: friendly }, 400);
  }

  return json({ user: { id: created.user.id, email }, profile });
});
