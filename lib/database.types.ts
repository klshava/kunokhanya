/**
 * Hand-written to match supabase/migrations/0001_init.sql.
 * Once your Supabase project is live you can regenerate this file for perfect
 * accuracy with:
 *   npx supabase gen types typescript --project-id <your-project-id> > lib/database.types.ts
 */

export type UserRole = "admin" | "student" | "registrar" | "facilitator";
export type StudyMode = "full-time" | "part-time";
export type StudentStatus = "active" | "completed" | "withdrawn";
export type StudentSource = "walk-in" | "website" | "referral" | "wordpress";
export type LeadStatus = "new" | "contacted" | "converted" | "rejected";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type ResultOutcome = "competent" | "not_yet_competent";

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          course_id: string;
          course_name: string;
          duration_months: number | null;
          registration_fee: number;
          monthly_fee: number;
          total_fee: number;
          study_mode: StudyMode | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          course_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Relationships: [];
      };
      students: {
        Row: {
          student_id: string;
          student_number: string | null;
          full_name: string;
          id_number: string | null;
          date_of_birth: string | null;
          gender: Gender | null;
          contact_number: string | null;
          email: string | null;
          physical_address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_number: string | null;
          course_id: string | null;
          study_mode: StudyMode;
          enrollment_date: string;
          status: StudentStatus;
          source: StudentSource;
          registration_fee_paid: boolean;
          total_fee_override: number | null;
          registration_fee_override: number | null;
          intake_month: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "students_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["course_id"];
          }
        ];
      };
      staff: {
        Row: {
          staff_id: string;
          title: string | null;
          first_name: string;
          last_name: string;
          position: string | null;
          phone_number: string | null;
          email: string | null;
          id_number: string | null;
          nationality: string | null;
          address: string | null;
          next_of_kin_name: string | null;
          next_of_kin_number: string | null;
          date_of_birth: string | null;
          gender: Gender | null;
          home_language: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & {
          first_name: string;
          last_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          payment_id: string;
          student_id: string;
          amount: number;
          payment_date: string;
          payment_method: string | null;
          receipt_number: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          student_id: string;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["student_id"];
          }
        ];
      };
      website_leads: {
        Row: {
          lead_id: string;
          full_name: string;
          email: string | null;
          contact_number: string | null;
          course_interested: string | null;
          submitted_at: string;
          status: LeadStatus;
          source: string;
          converted_student_id: string | null;
          id_number: string | null;
          date_of_birth: string | null;
          gender: Gender | null;
          physical_address: string | null;
          study_mode: StudyMode | null;
          intake_month: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["website_leads"]["Row"]> & {
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["website_leads"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          linked_student_id: string | null;
          linked_staff_id: string | null;
          full_name: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      attendance: {
        Row: {
          attendance_id: string;
          student_id: string;
          attendance_date: string;
          present: boolean;
          marked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance"]["Row"]> & {
          student_id: string;
          attendance_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["student_id"];
          }
        ];
      };
      results: {
        Row: {
          result_id: string;
          student_id: string;
          course_id: string | null;
          module_name: string;
          outcome: ResultOutcome;
          notes: string | null;
          assessed_date: string;
          marked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["results"]["Row"]> & {
          student_id: string;
          module_name: string;
          outcome: ResultOutcome;
        };
        Update: Partial<Database["public"]["Tables"]["results"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "results_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["student_id"];
          },
          {
            foreignKeyName: "results_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["course_id"];
          }
        ];
      };
    };
    Views: {
      student_balances: {
        Row: {
          student_id: string;
          status: StudentStatus;
          course_id: string | null;
          total_fee: number;
          total_paid: number;
          balance: number;
        };
        Relationships: [];
      };
      students_directory: {
        Row: {
          student_id: string;
          student_number: string | null;
          full_name: string;
          id_number: string | null;
          date_of_birth: string | null;
          gender: Gender | null;
          contact_number: string | null;
          email: string | null;
          physical_address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_number: string | null;
          course_id: string | null;
          course_name: string | null;
          study_mode: StudyMode;
          enrollment_date: string;
          status: StudentStatus;
          source: StudentSource;
          intake_month: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      update_my_student_contact: {
        Args: {
          p_contact_number?: string | null;
          p_email?: string | null;
          p_physical_address?: string | null;
          p_emergency_contact_name?: string | null;
          p_emergency_contact_number?: string | null;
        };
        Returns: Database["public"]["Tables"]["students"]["Row"];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_registrar: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_facilitator: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin_or_registrar: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      my_linked_student_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}

export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Staff = Database["public"]["Tables"]["staff"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type WebsiteLead = Database["public"]["Tables"]["website_leads"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type Result = Database["public"]["Tables"]["results"]["Row"];
export type StudentBalance = Database["public"]["Views"]["student_balances"]["Row"];
export type StudentDirectoryRow = Database["public"]["Views"]["students_directory"]["Row"];
