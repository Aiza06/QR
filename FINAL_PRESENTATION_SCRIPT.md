# Final Presentation Script — QR Attendance System

**Flow (from the rubric):** 0:30 Introduction → 0:30 Original app → **4:00 Improvements (live demo of at least 3 features)** → 1:00 Challenges & Learnings → 0:30 Closing → 3:00 Q&A.

**Demo format:** Present from a laptop browser (`npm run web`). The admin dashboard is designed for a wide screen and every feature is clickable. Keep the phone with the APK nearby as a backup, not as the main demo device.

**The one-sentence story:** The base app could scan a QR code, but it trusted the phone and stored attendance locally. I turned it into a shared, server-validated system with role-based administration, rotating QR codes, and attendance reports.

---

## 1. Before the presentation (do this 30–60 minutes early)

### Run and sign in

```powershell
npm install
npm run web
```

Open the app, sign in with the administrator account, and confirm the dashboard loads real numbers. Do not start the demo from a cold server; run it once before the panel enters.

### Prepare the demo data

- [ ] One administrator account: `[ADMIN_EMAIL]` / `[ADMIN_PASSWORD]`.
- [ ] At least **2 events** with real attendance, e.g. `Demo Event A` and `Demo Event B`.
- [ ] At least **8–10 attendance records** across those events, so the reports page has meaningful metrics.
- [ ] One disposable account for the role-change demo, e.g. `demo.student@school.edu`. Do **not** change a real classmate's role.
- [ ] Optional: a second admin account, to show that “last active admin” protection is real.
- [ ] Know which event you will use for the QR rotation. Rotating the code invalidates the old one; use `Demo Event A`, not a live class event.

> The admin “Add Student”, “Add Teacher”, and “Create Event” buttons were intentionally removed. Students register through the public registration flow; teachers create events from the Teacher tab. Do not try to demo those buttons.

### Pre-open these browser tabs (left to right)

1. `http://localhost:8081/admin`
2. `http://localhost:8081/admin/users`
3. `http://localhost:8081/admin/qr-codes`
4. `http://localhost:8081/admin/attendance`
5. `http://localhost:8081/admin/reports`

Reports and QR Code Management are currently reachable by direct URL, not from the sidebar. Pre-open them so you never type a URL on stage.

### Stage setup

- [ ] Browser zoom around 110%; hide the bookmarks bar; close chat and email notifications.
- [ ] Have a folder of 4 backup screenshots: dashboard, role change, QR page, reports CSV. If the network drops, switch to screenshots and keep talking.
- [ ] Have the exported CSV already downloaded once, so you know where it lands.
- [ ] Print the **Cue Card** at the bottom of this file.
- [ ] Rehearse the 4-minute demo twice with a timer. If you run long, cut the CSV file-opening, not the security explanation.

---

## 2. Run sheet

| Time | Segment | On screen / action | Rubric requirement |
|---|---|---|---|
| 0:00–0:30 | Introduction | Title slide or login screen | Name, section, app title |
| 0:30–1:00 | Original app | One slide, then dashboard | What the base code could and lacked |
| 1:00–1:45 | Improvement 1: Admin dashboard | Dashboard | Live feature 1 |
| 1:45–2:55 | Improvement 2: Account management | Manage Users | Live feature 2 |
| 2:55–3:55 | Improvement 3: Secure QR + rotation | QR Code Management | Live feature 3 |
| 3:55–4:45 | Improvement 4: Attendance + reports | Attendance Records → Reports | Live feature 4 |
| 4:45–5:00 | Transition | Return to dashboard/slide | Close the 4-minute demo |
| 5:00–6:00 | Challenges & Learnings | Slide or talk only | One problem + solution |
| 6:00–6:30 | Closing | Slide | Summarize and thank panel |
| 6:30–9:30 | Q&A | Code/Supabase if asked | Explain how code works |

Times are cumulative from the start of the presentation. The 4-minute demo runs from **1:00 to 5:00**.

---

## 3. Word-for-word script

### 0:00–0:30 — Introduction

> Good morning, panel. I’m **[NAME]** from **[SECTION]**. My project is the **QR Attendance System**, a mobile and web application built with React Native, Expo, and Supabase. It replaces manual attendance with a QR scan and gives administrators one place to manage users, events, attendance, and reports. In the next few minutes I’ll show you what the original app could do, demonstrate four improvements live, and explain the main problem I had to solve.

### 0:30–1:00 — Original app

> The base code already had login and registration, a teacher screen that generated an event QR, a student scan screen, and an attendance history. But it had three major limits. First, events and attendance were stored in a **local SQLite database on each phone**, so records did not sync between devices. Second, the app trusted the QR payload and validated the event on the client. Third, there was **no administrator role, no shared dashboard, and no reports**. So a teacher on another phone could not see the attendance, and a modified client could fake a record.

> Those three limits are what I focused on.

### 1:00–1:45 — Improvement 1: Admin dashboard and route guard

**Click:** `Dashboard` in the sidebar. Point to the four live cards and Recent Activity.

> This is the administrator dashboard, using the same app students use. The totals — users, students, teachers, and attendance records — are queried from Supabase, not hard-coded. Recent Activity is assembled from real profile, event, and attendance timestamps.

> The important part is underneath. In `app/admin/_layout.tsx`, every admin navigation re-reads my profile from the database and requires `role = 'admin'` and `is_active = true`. If a student types `/admin` in the address bar, the guard redirects them. Hiding a button is not security; the database row-level security policies enforce the same rule on the data itself.

**Do not** spend time logging in as a student here. Say the line and move on.

### 1:45–2:55 — Improvement 2: Account management with safeguards

**Click:** `Manage Users`. Search for `Demo`. Click the disposable student. Change role to **Teacher** → confirm.

> Manage Users is one searchable list for students, teachers, and admins. I can search by name, email, student number, employee number, department, or section.

> I’ll change this demo account from student to teacher. The request goes to the `admin_set_user_role` database function, which checks again that the caller is an active administrator. The UI cannot simply write the role itself.

> There are three safeguards. A user cannot change their own role or status. The database blocks self-escalation even if someone calls the API directly. And the last active administrator cannot be demoted or deactivated, which prevents locking the school out of the system.

**Click your own account** (shows “You”). Point to the disabled role and status controls.

> On my own account, role and status changes are disabled on purpose. Deactivating an account also bans its login and blocks its data reads through RLS, so “inactive” is not just a label.

**Close the modal.** If you changed the demo account, you can leave it as Teacher for the rest of the demo; revert it after the presentation.

### 2:55–3:55 — Improvement 3: Secure, rotating QR code

**Switch to the pre-opened** `/admin/qr-codes` tab. Select `Demo Event A`.

> This is the QR management screen. The app does not generate the security token on the phone. `get_event_qr_token` asks the database for a random token tied to this event. The QR payload contains the event code, that token, and optional display metadata — no student data, no passwords, and no service key.

> When a student scans, the app calls `register_attendance_qr`. The database verifies five things: the event exists, the token matches, the scan is not before the start and not more than 24 hours after the end, the student’s account is active, and this student has not already been recorded for this event. Students have no direct insert permission on the attendance table, so the client cannot skip those checks.

**Click `Replace QR Code` → `Replace QR`.** Wait for the new QR and the success notice.

> If a QR leaks — for example, someone posts it in a group chat — I can replace it. The old token stops working immediately. That is something the original local-only app could not do.

### 3:55–4:45 — Improvement 4: Attendance records and reports

**Click the pre-opened** `/admin/attendance` tab. Point to a record’s Present status, scan date/time, and student.

> Attendance Records joins the scan record with the event and the student profile. I can search by student, event, or creator, and filter by scan date. Deleting a record is admin-only and asks for confirmation.

**Switch to** `/admin/reports`. Point to the four metrics and the formula note. Click `Export CSV`.

> Reports computes totals, unique students, events with records, and the attendance rate. The rate is unique attendees divided by eligible students multiplied by events with records; the formula is shown on the page so the number is auditable. Export CSV respects the current filters — on web it downloads a file, and on mobile it opens the share sheet.

**Close the 4-minute demo:**

> Those are four improvements: shared cloud data, database-enforced administration, secure rotating QR codes, and attendance reporting.

### 5:00–6:00 — Challenges and Learnings

Use one story. The strongest one is **trusting the client**.

> The biggest challenge was making attendance trustworthy. In the original app, the phone decided whether a scan was valid and stored the result locally. A student could share the QR, change the device clock, or edit the local database, and the teacher would never know. My first attempt was to hide the teacher and admin buttons, but that only hides the UI — anyone can still call the API.

> I moved the rules into PostgreSQL. Attendance writes go through a `SECURITY DEFINER` function with a token check, a time window, an active-account check, and a unique `(student, event)` constraint. RLS policies stop students from inserting attendance directly. Admin changes also re-check the caller’s role inside the database, and the service-role key exists only in the Edge Function, never in the app.

> My biggest learning is: **never trust the client for authorization or attendance rules.** Enforce them where the data lives, then make the UI reflect those rules. I tested the failure cases too: wrong token, duplicate scan, scan outside the window, inactive account, and non-admin access.

**If asked about deployment:** “I also hit a build-only bug where the APK closed on launch because the Supabase environment variables were not included in the EAS build. I moved them into the EAS `preview` environment and verified the rebuilt bundle contained the URL and key.”

### 6:00–6:30 — Closing

> To summarize: the system moved from a local-only QR scanner to a shared attendance platform. Records now sync through Supabase, administrators can manage accounts safely, QR codes can be rotated, and attendance can be audited and exported. This reduces manual checking and gives the school a reliable record. Thank you — I’m ready for your questions.

---

## 4. Optional slide outline

| Slide | Content |
|---|---|
| 1. Title | **QR Attendance System** — QR-based attendance for students and teachers. Your name, section, React Native · Expo · Supabase. |
| 2. Original app | **Could:** register/login, teacher creates an event QR, student scans, local history. **Lacked:** shared data, server validation, admin role, reports. Add two small screenshots. |
| 3. Improvements | Four boxes: cloud-synced records · database-enforced admin roles · secure rotating QR · attendance reports + CSV. |
| 4. Architecture (backup) | Expo app → Supabase Auth + Postgres/RLS + RPC functions; admin account creation → Edge Function with service role. |
| 5. Challenge | **Problem:** the phone decided whether attendance was valid. **Attempt:** hide buttons. **Fix:** RLS + `SECURITY DEFINER` RPC + token + unique index. **Learning:** never trust the client. |
| 6. Closing | From a local QR scanner to a shared, auditable attendance platform. Next: offline queue, geofencing, scheduled reports, automated tests. |

Do not put your whole script on the slides. The slides hold the headings and screenshots; you hold the explanation.

---

## 5. Q&A cheat sheet (3 minutes)

Answer in three beats: **direct answer → where it is in the code → why it matters.** Keep each answer under 30 seconds.

| Likely question | Answer |
|---|---|
| How is admin access protected? | `app/admin/_layout.tsx` reads the profile on entry and on every admin navigation, requiring `role = 'admin'` and `is_active = true`. The same rule is enforced by RLS, so a direct API call still fails. |
| How do you prevent fake attendance? | The QR contains a random token. `register_attendance_qr` checks the token, event time window, active account, and duplicates before inserting. Students have no direct `INSERT` grant on `attendance`. |
| What if a student shares the QR? | Rotate it in QR Code Management. The old token is replaced and immediately rejected by the server. The 24-hour post-event grace also limits how long a leaked code works. |
| How are duplicates stopped? | A unique index on `(student_id, event_id)` plus the server function. The app also prevents double submission. |
| Why is the service-role key not in the app? | It is only inside the `admin-create-user` Edge Function. The mobile app uses the public anon/publishable key; the service role can bypass RLS and must never ship to users. |
| How is attendance rate computed? | Unique attendees divided by eligible students × events with records. The Reports page displays the denominator and formula. |
| Can an admin demote themselves? | No. The UI disables it and the SQL functions block it. The last active administrator also cannot be demoted or deactivated. |
| What happens when an account is deactivated? | `auth.users.banned_until` is set and RLS blocks reads, so the account cannot sign in or fetch data. |
| How did you build the UI? | React Native + Expo Router, shared admin components, and a responsive layout. The dashboard uses a persistent sidebar on desktop and an overlay on mobile. |
| What was the hardest bug? | The EAS APK closed on launch because `.env` was gitignored and the cloud build had no `EXPO_PUBLIC_*` variables. I set them in the EAS `preview` environment, rebuilt, and verified the bundle contained both values. |
| What would you add next? | Offline scan queueing, geofencing or room verification, scheduled reports, automated tests, and a notification when attendance drops. Be honest; this shows you know the limits. |

If you do not know an answer:

> I haven’t implemented that yet, but the place I would start is **[the database / the auth layer / the reports query]**, because that is where the rule belongs. I can walk you through the current implementation instead.

Do not improvise a feature that is not in the app.

---

## 6. Contingency plan

| Problem | What to do |
|---|---|
| Login is slow | Keep talking through the original-app slide. If it passes 20 seconds, switch to the dashboard screenshot. |
| Role change fails | Show the self-protection note instead, and explain the database check. Do not debug live for more than 10 seconds. |
| QR token does not load | Switch to the QR screenshot; explain token creation and rotation from the slide. |
| CSV download is blocked | Show the already-downloaded CSV and the success notice; do not open browser settings. |
| Network drops | Use the four screenshots, keep the same narration, and move to Challenges. |
| Panel asks to see Add Student / Create Event | “I moved those creation flows out of the admin panel by design. Students self-register; teachers create events from the Teacher tab. The admin’s job is review, correction, and oversight.” |

---

## 7. Cue card (print this)

```text
0:00  INTRO        Name, section, QR Attendance System.
0:30  BASE APP     Local SQLite + client-trusted QR. No admin, no shared data, no reports.
1:00  DASHBOARD    Live counts. Guard in app/admin/_layout.tsx. role=admin, is_active.
1:45  USERS        Search Demo → change role → confirm. Self-change disabled. Last admin safe.
2:55  QR           /admin/qr-codes → select Demo Event A → Replace QR.
                   Token + time window + active account + duplicates checked in DB.
3:55  RECORDS      /admin/attendance. Present, time, filters, admin-only delete.
      REPORTS      /admin/reports → 4 metrics → Export CSV.
4:45  WRAP         Cloud data · DB-enforced admin · rotating QR · reports.
5:00  CHALLENGE    Client trust → server rules. RLS + RPC + unique index + token.
                   Learning: never trust the client.
6:00  CLOSE        From local scanner to shared attendance platform. Thank you.
6:30  Q&A           Answer → file/function → why it matters.
```

---

## 8. Rubric self-check

- [ ] **0:30 Introduction** — name, section, app title.
- [ ] **0:30 Original app** — says what the base code could do and what it lacked.
- [ ] **4:00 Improvements** — four live features, at least three required, with one security explanation.
- [ ] **1:00 Challenges** — one concrete problem, the failed/simple attempt, the solution, and the learning.
- [ ] **0:30 Closing** — summarizes the work and thanks the panel.
- [ ] **3:00 Q&A** — at least one answer points to a real file or database function.
- [ ] Demo stays inside 4 minutes and does not end on an error screen.
