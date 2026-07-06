# Kunokhanya Training Academy - Student Management

A student registration, records lookup, and fee management web app for
Kunokhanya Training Academy.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend / database**: Supabase (Postgres, Auth, Row Level Security)
- **Hosting**: Vercel
- **Source control**: GitHub

## Getting started

See [SETUP.md](./SETUP.md) for the full step by step guide, including the
manual steps (creating a Supabase project, adding your first admin login,
connecting WordPress, and deploying to Vercel).

Quick reference once your `.env.local` is filled in:

```bash
npm install
npm run dev
```

## Project structure

```
app/
  admin/            Admin-only pages (role checked in admin/layout.tsx)
    students/        Register, look up, and edit students; fee statements
    courses/         Course / programme management
    staff/           Staff records
    reports/         Enrollment and revenue summary
    leads/           Review and convert WordPress leads
  portal/            Student-only pages (role checked in portal/layout.tsx)
    profile/         Edit own contact details
    fees/            Read-only fee statement
  statement/[id]/    Shared print-friendly fee statement (admin or the
                     student themselves)
  api/leads/webhook/ Receives new leads from WordPress
  login/             Sign in page

components/
  ui/                Small reusable building blocks (buttons, inputs, etc)
  admin/, portal/, shared/   App-specific components

lib/
  supabase/          Supabase client setup (browser, server, admin)
  validations.ts     Form validation rules
  sa-id.ts           South African ID number validation
  currency.ts         Rand formatting

supabase/migrations/0001_init.sql   Database schema, run once in Supabase
```

## Roles

- **Admin**: registers students, manages courses and staff, records
  payments, reviews reports, imports leads.
- **Student**: signs in to view and update their own contact details, and to
  view (but not edit) their own fee statement.

## Notes on what is intentionally not built yet

- Historical spreadsheet data is not imported automatically. See the last
  section of SETUP.md.
- There is no self-service sign-up. Admin accounts are created once by hand
  (see SETUP.md), and student accounts are created by an admin clicking
  "Invite to portal" on a student's record.
- Uniforms, tablets/equipment tracking, workplace placements, and the mailing
  list from the original spreadsheet are not part of this first version.
