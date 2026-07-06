# Setup guide

This guide covers every step that needs a human in the loop: creating accounts,
running the database migration, adding your first admin login, connecting
WordPress, and deploying. Follow it in order the first time you set this up.

## 1. Create your accounts (you do this manually)

You will need, all free to start:

- A **Supabase** account at https://supabase.com
- A **GitHub** account at https://github.com (if you do not already have one)
- A **Vercel** account at https://vercel.com, signed up using your GitHub account

## 2. Create the Supabase project

1. In the Supabase dashboard, click **New project**.
2. Choose an organisation, name it (e.g. `kunokhanya-training-academy`), set a
   database password (save it somewhere safe, e.g. a password manager), and
   pick a region close to South Africa (e.g. an EU or Africa region if
   offered, otherwise the closest available).
3. Wait for the project to finish provisioning (a couple of minutes).

## 3. Run the database migration

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Open the file `supabase/migrations/0001_init.sql` from this project in a
   text editor, copy all of it, and paste it into a new SQL Editor query.
3. Click **Run**. You should see "Success. No rows returned." This creates
   all the tables, security rules, and two example courses.

## 4. Get your API keys

1. In Supabase, go to **Project Settings > API**.
2. Copy the **Project URL** and the **anon / public key**.
3. Also copy the **service_role key** (click "Reveal" first). Treat this key
   like a master password: it bypasses all security rules. Never share it or
   commit it to GitHub.

## 5. Configure environment variables

1. Copy `.env.example` to a new file named `.env.local` in the project root.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` with your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` with your anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` with your service role key
   - `LEADS_WEBHOOK_SECRET` with any long random password you make up
     (for example, generate one at https://1password.com/password-generator)

## 6. Install and run locally

You will need Node.js 20 or newer installed (https://nodejs.org).

```bash
npm install
npm run dev
```

Visit http://localhost:3000. It will redirect you to the login page, which
will not work yet because there is no admin account. That is expected, see
the next step.

## 7. Create your first admin login

Since there is no public sign-up page (only admins create accounts), the very
first admin account has to be created by hand, once:

1. In Supabase, go to **Authentication > Users**, click **Add user**, and
   create a user with your own email and a password you choose. Leave "Auto
   Confirm User" turned on.
2. Copy the new user's **User UID** (shown in the users list).
3. Go back to the **SQL Editor** and run, replacing the placeholders:

```sql
insert into public.profiles (id, role, full_name, email)
values ('paste-the-user-uid-here', 'admin', 'Your Name', 'your@email.com');
```

4. You can now sign in at `/login` with that email and password. You will
   land on the admin dashboard.

To create more admin accounts later, repeat this process (there is no admin
UI for this in v1, since it should only happen rarely).

## 8. Add real courses

The migration adds two example courses so the app is not empty. Edit or
delete them and add your real programmes from **Course Management** in the
app, once you are signed in as admin.

## 9. Connect your WordPress site (optional, do this whenever you are ready)

The app exposes a webhook endpoint that accepts new enquiries from WordPress:

```
POST https://your-deployed-url/api/leads/webhook
Header: x-webhook-secret: <the LEADS_WEBHOOK_SECRET you chose above>
Body (JSON):
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "contact_number": "0821234567",
  "course_interested": "Home-Based Care (HBC)"
}
```

How you trigger this from WordPress depends on your form plugin:

- **WPForms / Gravity Forms / Ninja Forms**: most have a "webhook" or "Zapier
  style" add-on that can POST form data to a URL on submit. Point it at the
  URL above and map your form fields to the JSON keys shown.
- **Contact Form 7**: needs a small add-on plugin (e.g. "CF7 to Webhook") or a
  short custom snippet, since CF7 does not support webhooks natively.
- If your web developer manages the WordPress site, you can send them this
  section directly.

New leads will appear under **Import Leads** in the admin dashboard, ready to
review and convert into full student records.

## 10. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new empty repository on GitHub (do not initialise it with a
README) and follow GitHub's instructions to push an existing repository,
something like:

```bash
git remote add origin https://github.com/your-username/kunokhanya-academy.git
git branch -M main
git push -u origin main
```

## 11. Deploy to Vercel

1. In Vercel, click **Add New > Project**, and import the GitHub repository
   you just pushed.
2. Vercel will detect it as a Next.js project automatically.
3. Before deploying, open **Environment Variables** and add the same four
   variables from your `.env.local` file (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `LEADS_WEBHOOK_SECRET`).
4. Click **Deploy**. After a minute or two you will get a live URL such as
   `https://kunokhanya-academy.vercel.app`.
5. Once you are happy with it, you can connect your own domain under the
   project's **Domains** setting in Vercel.

## 12. Ongoing maintenance notes

- **Adding a course**: Course Management > Add course, in the app itself.
- **Registering a student**: Register Student, in the app itself.
- **Giving a student portal access**: open their record in Student Lookup and
  click "Invite to portal". This sends them a Supabase login-setup email, so
  make sure the email address on their record is correct first. This uses
  Supabase's built-in email sending, which has a low sending rate on the free
  tier, fine for occasional invites but worth knowing about if you ever need
  to invite hundreds of students at once (Supabase's docs cover connecting
  your own email provider for higher volume).
- **Regenerating database types**: if you change the database schema, you can
  regenerate `lib/database.types.ts` for perfect accuracy with the Supabase
  CLI: `npx supabase gen types typescript --project-id <your-project-id> >
  lib/database.types.ts`.
- **A known low-risk dependency advisory**: `npm audit` may report a moderate
  advisory in a build-time tool bundled inside Next.js itself (not your own
  code, and not reachable at runtime). Keep an eye out for a Next.js patch
  release and run `npm update next` when one appears.

## 13. Importing your historical spreadsheet data

This first version does not import your existing spreadsheet data
automatically, since your real data needs some cleanup and decisions first
(for example: how to turn 18 separate "Month" columns per student into
individual payment entries, and what to do with records missing an ID
number). Come back to this as a follow-up step once you are comfortable with
how the app works. A reasonable approach when you are ready:

1. Export the relevant columns from `Contacts` and `Fees Records` to CSV.
2. We write a one-off import script that reads the CSV, creates one student
   row per person, and one payment row per non-empty "Month" column, then run
   it against your Supabase project.

This is best done as a separate, focused piece of work so we can check the
data carefully rather than rushing it.
