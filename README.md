# QR Attendance System

A React Native + Expo Router + TypeScript attendance app backed by Supabase.
This version adds a complete administrator dashboard while preserving the
existing student and teacher flows.

---

## 1. Requirements

| Tool | Version |
|---|---|
| Node.js | LTS |
| Expo SDK | 54 |
| Expo Go | 54.x |
| Supabase project | Any current project |

Install dependencies:

```powershell
npm install --legacy-peer-deps
```

---

## 2. Environment variables

Create `.env` in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Use only the **anon/publishable** key in the Expo app. Never put the
`service_role` key in `.env`, `EXPO_PUBLIC_*`, or any mobile code.

---

## 3. Supabase database setup

Open **Supabase Dashboard → SQL Editor** and run these files in order:

1. `supabase/schema.sql` — base profiles, events, and attendance tables.
2. `supabase/admin_setup.sql` — admin role, account status, profile details,
   event descriptions, secure QR tokens, RLS policies, and server functions.

Both scripts are idempotent. If you are upgrading an existing installation,
running `admin_setup.sql` is the required migration.

### Grant the first administrator

Run this once in the SQL Editor, using the email of an account that already
registered in the app:

```sql
update public.profiles
   set role = 'admin',
       is_active = true
 where lower(email) = lower('you@school.edu');
```

Then sign out and sign back in. The app reads the role from the database, not
from client metadata. Keep at least one active administrator at all times.

> The SQL Editor runs without an end-user JWT, so this is the intentional
> bootstrap path for the first administrator. After that, create additional
> admins from **Admin Dashboard → Admin Accounts**.

### What the migration adds

- `profiles.role` now supports `student`, `teacher`, and `admin`.
- `profiles.is_active`, `student_number`, `employee_number`, `grade_level`,
  `section`, `department`, and `phone`.
- Unique indexes on student and employee numbers.
- `events.description` and `events.updated_at`.
- `event_qr_tokens` — a table with no client grants, used for server-validated
  event QR tokens.
- RLS policies for students, teachers, and administrators.
- Profile self-escalation protection triggers.
- Server functions:
  - `admin_set_user_role`
  - `admin_set_user_active`
  - `get_event_qr_token`
  - `admin_rotate_event_qr_token`
  - `register_attendance_qr`

Run these verification queries if needed:

```sql
select email, role, is_active from public.profiles order by created_at;
select event_code, title, start_time, end_time from public.events;
select count(*) from public.attendance;
```

---

## 4. Deploy the admin Edge Function

Administrator account creation uses a Supabase Edge Function so the
service-role key stays on the server.

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy admin-create-user
```

Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` to Edge Functions automatically. Do not add them to
the Expo environment.

The function:

1. Verifies the caller's JWT.
2. Reads the caller's profile and requires `role = 'admin'` and
   `is_active = true`.
3. Creates the Auth user with the service-role client.
4. Writes the requested role and profile details.
5. Deletes the half-created Auth user if the profile update fails.

If the function is not deployed, the Admin Accounts screen shows a clear error
instead of silently creating an incomplete account.

---

## 5. Run the app

```powershell
npx expo start
```

- Press `a` for Android, `i` for iOS, or `w` for web.
- Sign in with the account that was promoted to administrator.
- Administrators are taken directly to `/admin` after sign-in, and opening the
  Profile tab also redirects there. The **Admin Dashboard** shortcut remains on
  the Home screen for administrators.

---

## 6. Role and security model

| Role | Access |
|---|---|
| Student | Scan QR codes, view their own attendance history, edit their own name. |
| Teacher | Everything a student can do, plus create events, issue QR codes for their own events, and view attendance for those events. |
| Admin | Full dashboard: users, students, teachers, admins, events, attendance, reports, and QR management. |

Security properties implemented:

- Admin routes are guarded by a database profile check, not a client flag.
- `is_admin()` and `is_active_user()` are `SECURITY DEFINER` helpers used by RLS.
- The setup removes legacy admin helper functions, triggers, and permissive
  policies so an old access path cannot bypass the current `role = 'admin'`
  and `is_active = true` checks.
- Security-definer RPCs revoke execute from `public` and `anon`; only signed-in
  users can call them, and each function repeats its own authorization check.
- Client metadata cannot create or elevate an administrator.
- Users cannot change their own role or active status.
- Role/status changes require an active administrator, enforced again inside
  database functions.
- The last active administrator cannot be demoted or deactivated.
- Deactivation sets `auth.users.banned_until` and blocks RLS data access.
- Event deletion is administrator-only.
- Students have no direct `INSERT` permission on `attendance`.
- QR scans call `register_attendance_qr`, which validates:
  - the event exists,
  - the event token matches,
  - the event time window (plus 24-hour grace),
  - the account is active,
  - duplicate `(student, event)` records are rejected.
- QR payloads contain only an event code, optional display metadata, and a
  random event token. They contain no personal data or service keys.
- Service-role credentials exist only inside the Edge Function.

---

## 7. Implemented features

### Dashboard (`/admin`)

- Desktop app shell with a persistent navy sidebar, searchable top bar,
  notification shortcut, administrator menu, and Sign Out.
- Responsive layout: a mobile sidebar overlay below 900 px, a full right rail
  on wide screens, and stacked cards on smaller screens.
- Mint welcome hero with a live date/time and QR illustration, five pastel
  metric cards for users, students, teachers, events, and attendance.
- Real 7-day attendance trend chart and a real per-event attendance donut.
  Empty periods show an empty state instead of invented percentages.
- Recent activity is composed from real profile, event, and attendance
  timestamps; upcoming events come from the next scheduled events.
- Quick Actions and Quick Navigation open every admin area.
- Every metric and quick action is clickable; the profile menu includes
  Refresh Dashboard, and pull-to-refresh works on native.
- Loading, error, and retry states for every data-backed panel.

### Manage Users (`/admin/users`)

- Search by name, email, student/employee number, department, grade, or section.
- Filter by student, teacher, or admin.
- Detail modal with account information.
- Role assignment through the secure `admin_set_user_role` function.
- Activate/deactivate through `admin_set_user_active`.
- Self-role and self-status changes disabled in the UI and blocked in SQL.
- Last-admin protection.
- Duplicate-submission prevention and success/error feedback.

### Manage Students (`/admin/students`)

- Search and list student records.
- Accounts are created through the public registration flow; admins review,
  edit, and deactivate them.
- Edit name, student number, and phone.
- Unique student-number validation with a friendly duplicate message.
- Validation for names, email addresses, passwords, and identifiers.
- Empty, loading, error, and success states.

### Manage Teachers (`/admin/teachers`)

- Search and list teacher records.
- Accounts are created through the public registration flow; admins review
  and maintain them.
- Edit name, employee number, department, and phone.
- Unique employee-number validation.
- Same validation and state handling as students.

### Admin Accounts (`/admin/admins`)

- List all administrators with active status.
- Create new administrator accounts through the Edge Function.
- Review administrator details.
- Remove admin access by changing the account to teacher or student.
- Self-demotion disabled; last-admin protection enforced by the database.

### Manage Events (`/admin/events`)

- List, search, edit, and delete events. New events are created by teachers from
  the Teacher tab; admins review and maintain them.
- Fields: title, unique event code, description, start time, end time.
- Native date/time pickers on Android/iOS and browser date inputs on web.
- Validation: required title/code, valid date range, end after start, unique code.
- Computed Upcoming / Live / Ended status.
- Attendance count and creator display.
- Destructive delete confirmation explains the attendance cascade.
- Direct link to the event's QR code.

### Attendance Records (`/admin/attendance`)

- Real records joined with event and profile data.
- Search by student, email, event, code, or creator.
- Filter by event, student, teacher/creator, and scan date.
- Present status, scan date/time, and student identity.
- Delete with confirmation (admin only).
- Unique constraint and server-side scan function prevent duplicates.

### Reports (`/admin/reports`)

- Filters: event, student, class/section, and optional date range.
- Totals: records, unique students, events with records, attendance rate.
- Attendance-rate formula and denominator shown in the UI.
- Per-event breakdown with scan counts, unique attendees, and rates.
- CSV export:
  - Web: downloads a `.csv` file.
  - Android/iOS: opens the native share sheet with CSV content.
- Empty-state and invalid-date-range handling.
- Formula/calculation guards for empty datasets.

### QR Code Management (`/admin/qr-codes`)

- Select any event and generate its QR code.
- Event token is issued by the database.
- QR shows event metadata, attendance count, and token status.
- Replace/rotate QR code with confirmation; old code stops working.
- Clear security explanation.
- No sensitive secrets in the QR payload.

### Existing student/teacher flows

- Login and registration remain unchanged.
- Teachers create events from the Teacher tab.
- New teacher-generated QRs include secure event tokens.
- The Scan tab still uses the same camera flow; the attendance write now goes
  through the server-side validation RPC.
- Student history, teacher history, profile editing, and sign-out remain.

---

## 8. Project structure

```text
QR/
├── app/
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── admin/
│   │   ├── _layout.tsx          # admin route guard
│   │   ├── index.tsx            # dashboard + stats + navigation
│   │   ├── users.tsx
│   │   ├── students.tsx
│   │   ├── teachers.tsx
│   │   ├── admins.tsx
│   │   ├── events.tsx
│   │   ├── attendance.tsx
│   │   ├── reports.tsx
│   │   └── qr-codes.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── history.tsx
│       ├── scan.tsx
│       ├── profile.tsx
│       └── teacher.tsx
├── components/
│   ├── AppButton.tsx
│   ├── Header.tsx
│   └── admin/
│       ├── AdminAttendanceBreakdown.tsx
│       ├── AdminAttendanceChart.tsx
│       ├── AdminBadge.tsx
│       ├── AdminDateTimeField.tsx
│       ├── AdminField.tsx
│       ├── AdminFormModal.tsx
│       ├── AdminHero.tsx
│       ├── AdminMenuItem.tsx
│       ├── AdminProfileCard.tsx
│       ├── AdminQuickActions.tsx
│       ├── AdminQuickNavigation.tsx
│       ├── AdminRecentActivity.tsx
│       ├── AdminScreenHeader.tsx
│       ├── AdminSearchBar.tsx
│       ├── AdminSelect.tsx
│       ├── AdminSidebar.tsx
│       ├── AdminStatCard.tsx
│       ├── AdminState.tsx
│       ├── AdminTopBar.tsx
│       ├── AdminUpcomingEvents.tsx
│       └── styles.ts
├── constants/
│   ├── colors.ts
│   └── student.ts
├── lib/
│   ├── admin.ts
│   ├── attendance.ts
│   ├── auth.ts
│   ├── confirm.ts
│   ├── datetime.ts
│   ├── events.ts
│   ├── profiles.ts
│   ├── qr.ts
│   └── supabase.ts
├── supabase/
│   ├── schema.sql
│   ├── admin_setup.sql
│   └── functions/
│       └── admin-create-user/
│           └── index.ts
├── .env.example
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 9. Verification performed

- `npx tsc --noEmit` passes.
- `npx expo export --platform web` completes successfully.
- Expo Router generates all expected routes, including:
  `/admin`, `/admin/users`, `/admin/students`, `/admin/teachers`,
  `/admin/admins`, `/admin/events`, `/admin/attendance`, `/admin/reports`,
  and `/admin/qr-codes`.
- Existing student screens and the teacher event screen still bundle.
- `supabase/admin_setup.sql` was applied against the linked project and the
  resulting functions, policies, triggers, and unique attendance index were
  inspected. Only zero-argument `is_admin()`, `is_active_user()`, and
  `is_teacher()` helpers remain, and `anon` has no execute grant on the
  security-definer RPCs.

---

## 10. Known limitations

- The dashboard follows the supplied reference layout: navy sidebar, top bar,
  mint hero, five pastel metrics, attendance chart, per-event donut, activity
  feed, quick navigation, and right rail. No trend percentages, notification
  text, or attendance statuses are invented.
- There is no dedicated audit-log table. Recent Activity is composed from real
  profile, event, and attendance timestamps, so it reflects records rather
  than every administrator action.
- The attendance chart and donut use the last seven days. Sparse or older
  test data can therefore show a zero-line chart and an empty-state donut.
- Email address changes are not editable in the app because they require an
  Auth admin operation. Use the Supabase dashboard or extend the Edge Function.
- Deactivation bans new logins and blocks data through RLS immediately. An
  already-issued access token remains valid until it refreshes/expires, but the
  app redirects inactive users and their RLS reads return no data.
- Native CSV export uses the system share sheet with CSV text rather than a
  file attachment, to avoid adding a file-system dependency.
- Attendance has no manual admin create form. It is intentionally driven by
  QR scans so the token/time/duplicate validation cannot be bypassed.
- Attendance rate is defined in the report screen as unique attendees divided
  by (eligible active students × events with records in the current filter).
- Event QR tokens are bearer tokens. Anyone who can see the QR can scan it
  during the event window; rotate the code if it is shared outside the event.
- Legacy version-1 QRs continue to work only for events that have not yet been
  issued a token. Once an event has a secure token, regenerate and distribute
  its new QR.
- Administrator account creation requires the `admin-create-user` Edge
  Function to be deployed.
- No recurring events, bulk CSV import, or push notifications are included.

---

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| `function public.is_admin() is not unique` | Re-run the updated `supabase/admin_setup.sql`; it removes legacy `is_admin(...)` overloads, triggers, and policies before creating the zero-argument helper. |
| Dashboard says data unavailable | Run `supabase/admin_setup.sql`, then confirm the account role is `admin` and `is_active = true`. |
| Admin button does not appear | Role is read from `public.profiles`; sign out and back in after promoting the account. |
| Creating an admin/student/teacher fails | Deploy `admin-create-user` and check the Edge Function logs. |
| QR scan says validation not set up | Run `supabase/admin_setup.sql`. |
| QR scan says invalid/replaced | Generate a new QR from **QR Code Management**. |
| Duplicate student/employee number | Use a unique identifier; the database enforces uniqueness. |
| TypeScript errors | Run `npx tsc --noEmit`. |
| Expo build issues | Run `npm install --legacy-peer-deps` and match Expo SDK 54 package versions. |
