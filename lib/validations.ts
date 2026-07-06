import { z } from "zod";
import { validateSAId } from "./sa-id";

export const studentFormSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  id_number: z
    .string()
    .min(1, "ID / passport number is required")
    .refine(
      (val) => {
        // Allow passport numbers (non-13-digit, alphanumeric) for non-SA nationals,
        // but if it looks like it's meant to be an SA ID (13 digits), validate it properly.
        if (/^\d{13}$/.test(val)) {
          return validateSAId(val).valid;
        }
        return val.trim().length >= 4;
      },
      { message: "Enter a valid 13-digit SA ID number, or a passport number" }
    ),
  date_of_birth: z.string().optional().nullable(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
  contact_number: z.string().min(1, "Contact number is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  physical_address: z.string().optional().or(z.literal("")),
  emergency_contact_name: z.string().optional().or(z.literal("")),
  emergency_contact_number: z.string().optional().or(z.literal("")),
  course_id: z.string().min(1, "Please select a course"),
  study_mode: z.enum(["full-time", "part-time"]),
  enrollment_date: z.string().min(1, "Enrollment date is required"),
  status: z.enum(["active", "completed", "withdrawn"]).default("active"),
  source: z.enum(["walk-in", "website", "referral", "wordpress"]).default("walk-in"),
  registration_fee_paid: z.boolean().default(false),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

export const studentContactFormSchema = z.object({
  contact_number: z.string().min(1, "Contact number is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  physical_address: z.string().optional().or(z.literal("")),
  emergency_contact_name: z.string().optional().or(z.literal("")),
  emergency_contact_number: z.string().optional().or(z.literal("")),
});

export type StudentContactFormValues = z.infer<typeof studentContactFormSchema>;

export const courseFormSchema = z.object({
  course_name: z.string().min(2, "Course name is required"),
  duration_months: z.coerce.number().int().positive().optional().nullable(),
  registration_fee: z.coerce.number().min(0, "Must be 0 or more"),
  monthly_fee: z.coerce.number().min(0, "Must be 0 or more"),
  total_fee: z.coerce.number().min(0, "Must be 0 or more"),
  study_mode: z.enum(["full-time", "part-time"]).optional().nullable(),
  is_active: z.boolean().default(true),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const paymentFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.string().optional().or(z.literal("")),
  receipt_number: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const staffFormSchema = z.object({
  title: z.string().optional().or(z.literal("")),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  position: z.string().optional().or(z.literal("")),
  phone_number: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  id_number: z
    .string()
    .optional()
    .refine((val) => !val || !/^\d{13}$/.test(val) || validateSAId(val).valid, {
      message: "This looks like an SA ID number but the checksum is invalid",
    }),
  nationality: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  next_of_kin_name: z.string().optional().or(z.literal("")),
  next_of_kin_number: z.string().optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
  home_language: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().min(1, "Enter your email or student number"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
