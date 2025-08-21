export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_description: string | null
          achievement_type: string | null
          cadet_id: string
          camp_name: string | null
          certificate_no: string | null
          created_at: string
          date_achieved: string | null
          id: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_type?: string | null
          cadet_id: string
          camp_name?: string | null
          certificate_no?: string | null
          created_at?: string
          date_achieved?: string | null
          id?: string
        }
        Update: {
          achievement_description?: string | null
          achievement_type?: string | null
          cadet_id?: string
          camp_name?: string | null
          certificate_no?: string | null
          created_at?: string
          date_achieved?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          absent_dates: string | null
          approval_status: boolean | null
          cadet_id: string
          created_at: string
          excuse_letter_submitted: boolean | null
          id: string
          number_of_days: number | null
          reason: string | null
        }
        Insert: {
          absent_dates?: string | null
          approval_status?: boolean | null
          cadet_id: string
          created_at?: string
          excuse_letter_submitted?: boolean | null
          id?: string
          number_of_days?: number | null
          reason?: string | null
        }
        Update: {
          absent_dates?: string | null
          approval_status?: boolean | null
          cadet_id?: string
          created_at?: string
          excuse_letter_submitted?: boolean | null
          id?: string
          number_of_days?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      cadets: {
        Row: {
          age: number | null
          application_number: string
          battalion_acceptance: boolean | null
          battalion_acceptance_date: string | null
          battalion_informed: boolean | null
          birth_certificate_no: string | null
          blood_group: string | null
          chest_cm: number | null
          created_at: string
          date_joined_practices: string | null
          date_left_practices: string | null
          date_of_birth: string
          date_of_enrollment: string | null
          height_cm: number | null
          id: string
          master_remarks: string | null
          name_full: string
          name_with_initials: string
          national_id: string | null
          permanent_address: string | null
          photograph_url: string | null
          platoon: string | null
          postal_address: string | null
          rank: string | null
          rector_recommendations: string | null
          regiment_no: string | null
          school_admission_no: string | null
          skills_talents: string | null
          updated_at: string
          withdrawal_approved: boolean | null
          withdrawal_date_from: string | null
          withdrawal_date_to: string | null
          withdrawal_letter_type: string | null
          withdrawal_reason: string | null
        }
        Insert: {
          age?: number | null
          application_number: string
          battalion_acceptance?: boolean | null
          battalion_acceptance_date?: string | null
          battalion_informed?: boolean | null
          birth_certificate_no?: string | null
          blood_group?: string | null
          chest_cm?: number | null
          created_at?: string
          date_joined_practices?: string | null
          date_left_practices?: string | null
          date_of_birth: string
          date_of_enrollment?: string | null
          height_cm?: number | null
          id?: string
          master_remarks?: string | null
          name_full: string
          name_with_initials: string
          national_id?: string | null
          permanent_address?: string | null
          photograph_url?: string | null
          platoon?: string | null
          postal_address?: string | null
          rank?: string | null
          rector_recommendations?: string | null
          regiment_no?: string | null
          school_admission_no?: string | null
          skills_talents?: string | null
          updated_at?: string
          withdrawal_approved?: boolean | null
          withdrawal_date_from?: string | null
          withdrawal_date_to?: string | null
          withdrawal_letter_type?: string | null
          withdrawal_reason?: string | null
        }
        Update: {
          age?: number | null
          application_number?: string
          battalion_acceptance?: boolean | null
          battalion_acceptance_date?: string | null
          battalion_informed?: boolean | null
          birth_certificate_no?: string | null
          blood_group?: string | null
          chest_cm?: number | null
          created_at?: string
          date_joined_practices?: string | null
          date_left_practices?: string | null
          date_of_birth?: string
          date_of_enrollment?: string | null
          height_cm?: number | null
          id?: string
          master_remarks?: string | null
          name_full?: string
          name_with_initials?: string
          national_id?: string | null
          permanent_address?: string | null
          photograph_url?: string | null
          platoon?: string | null
          postal_address?: string | null
          rank?: string | null
          rector_recommendations?: string | null
          regiment_no?: string | null
          school_admission_no?: string | null
          skills_talents?: string | null
          updated_at?: string
          withdrawal_approved?: boolean | null
          withdrawal_date_from?: string | null
          withdrawal_date_to?: string | null
          withdrawal_letter_type?: string | null
          withdrawal_reason?: string | null
        }
        Relationships: []
      }
      disciplinary_actions: {
        Row: {
          cadet_id: string
          created_at: string
          date_of_action: string | null
          id: string
          offence: string | null
          punishment: string | null
        }
        Insert: {
          cadet_id: string
          created_at?: string
          date_of_action?: string | null
          id?: string
          offence?: string | null
          punishment?: string | null
        }
        Update: {
          cadet_id?: string
          created_at?: string
          date_of_action?: string | null
          id?: string
          offence?: string | null
          punishment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_qualifications: {
        Row: {
          cadet_id: string
          created_at: string
          exam_type: string | null
          grade: string | null
          id: string
          index_number: string | null
          subject: string | null
          year: number | null
        }
        Insert: {
          cadet_id: string
          created_at?: string
          exam_type?: string | null
          grade?: string | null
          id?: string
          index_number?: string | null
          subject?: string | null
          year?: number | null
        }
        Update: {
          cadet_id?: string
          created_at?: string
          exam_type?: string | null
          grade?: string | null
          id?: string
          index_number?: string | null
          subject?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "educational_qualifications_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      events_participation: {
        Row: {
          cadet_id: string
          created_at: string
          event_date: string | null
          event_name: string | null
          event_type: string | null
          id: string
          role_task: string | null
        }
        Insert: {
          cadet_id: string
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          role_task?: string | null
        }
        Update: {
          cadet_id?: string
          created_at?: string
          event_date?: string | null
          event_name?: string | null
          event_type?: string | null
          id?: string
          role_task?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_participation_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      family_contacts: {
        Row: {
          cadet_id: string
          created_at: string
          father_contact: string | null
          father_name: string | null
          father_occupation: string | null
          father_whatsapp: string | null
          guardian_contact: string | null
          guardian_name: string | null
          id: string
          mother_contact: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_whatsapp: string | null
        }
        Insert: {
          cadet_id: string
          created_at?: string
          father_contact?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_whatsapp?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id?: string
          mother_contact?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_whatsapp?: string | null
        }
        Update: {
          cadet_id?: string
          created_at?: string
          father_contact?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_whatsapp?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id?: string
          mother_contact?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_contacts_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      foreign_visits: {
        Row: {
          cadet_id: string
          country: string | null
          created_at: string
          duration_from: string | null
          duration_to: string | null
          event_name: string | null
          id: string
          remarks: string | null
        }
        Insert: {
          cadet_id: string
          country?: string | null
          created_at?: string
          duration_from?: string | null
          duration_to?: string | null
          event_name?: string | null
          id?: string
          remarks?: string | null
        }
        Update: {
          cadet_id?: string
          country?: string | null
          created_at?: string
          duration_from?: string | null
          duration_to?: string | null
          event_name?: string | null
          id?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foreign_visits_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          cadet_id: string
          created_at: string
          date_of_issue: string | null
          id: string
          issuance_party: string | null
          medical_certificate_url: string | null
          validity_end_date: string | null
        }
        Insert: {
          cadet_id: string
          created_at?: string
          date_of_issue?: string | null
          id?: string
          issuance_party?: string | null
          medical_certificate_url?: string | null
          validity_end_date?: string | null
        }
        Update: {
          cadet_id?: string
          created_at?: string
          date_of_issue?: string | null
          id?: string
          issuance_party?: string | null
          medical_certificate_url?: string | null
          validity_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_evaluations: {
        Row: {
          assual: string | null
          cadet_id: string
          created_at: string
          drama: string | null
          evaluation_date: string | null
          first_aid: string | null
          id: string
          ncc_knowledge: string | null
          physical_training: string | null
          presentation: string | null
          regimental_duties: string | null
          squad_drill: string | null
        }
        Insert: {
          assual?: string | null
          cadet_id: string
          created_at?: string
          drama?: string | null
          evaluation_date?: string | null
          first_aid?: string | null
          id?: string
          ncc_knowledge?: string | null
          physical_training?: string | null
          presentation?: string | null
          regimental_duties?: string | null
          squad_drill?: string | null
        }
        Update: {
          assual?: string | null
          cadet_id?: string
          created_at?: string
          drama?: string | null
          evaluation_date?: string | null
          first_aid?: string | null
          id?: string
          ncc_knowledge?: string | null
          physical_training?: string | null
          presentation?: string | null
          regimental_duties?: string | null
          squad_drill?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          cadet_id: string
          created_at: string
          effective_date: string | null
          from_rank: string | null
          id: string
          promotion_type: string | null
          to_rank: string | null
        }
        Insert: {
          cadet_id: string
          created_at?: string
          effective_date?: string | null
          from_rank?: string | null
          id?: string
          promotion_type?: string | null
          to_rank?: string | null
        }
        Update: {
          cadet_id?: string
          created_at?: string
          effective_date?: string | null
          from_rank?: string | null
          id?: string
          promotion_type?: string | null
          to_rank?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      special_events: {
        Row: {
          cadet_id: string
          created_at: string
          duration_from: string | null
          duration_to: string | null
          event_name: string | null
          id: string
          role_description: string | null
        }
        Insert: {
          cadet_id: string
          created_at?: string
          duration_from?: string | null
          duration_to?: string | null
          event_name?: string | null
          id?: string
          role_description?: string | null
        }
        Update: {
          cadet_id?: string
          created_at?: string
          duration_from?: string | null
          duration_to?: string | null
          event_name?: string | null
          id?: string
          role_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_events_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      term_evaluations: {
        Row: {
          average: number | null
          cadet_id: string
          created_at: string
          id: string
          marks: number | null
          position: number | null
          subject: string | null
          term: string | null
          total: number | null
        }
        Insert: {
          average?: number | null
          cadet_id: string
          created_at?: string
          id?: string
          marks?: number | null
          position?: number | null
          subject?: string | null
          term?: string | null
          total?: number | null
        }
        Update: {
          average?: number | null
          cadet_id?: string
          created_at?: string
          id?: string
          marks?: number | null
          position?: number | null
          subject?: string | null
          term?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "term_evaluations_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      training_camps: {
        Row: {
          cadet_id: string
          camp_level: string | null
          camp_name: string | null
          created_at: string
          duration_from: string | null
          duration_to: string | null
          id: string
          location: string | null
          remarks: string | null
        }
        Insert: {
          cadet_id: string
          camp_level?: string | null
          camp_name?: string | null
          created_at?: string
          duration_from?: string | null
          duration_to?: string | null
          id?: string
          location?: string | null
          remarks?: string | null
        }
        Update: {
          cadet_id?: string
          camp_level?: string | null
          camp_name?: string | null
          created_at?: string
          duration_from?: string | null
          duration_to?: string | null
          id?: string
          location?: string | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_camps_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          cadet_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          cadet_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          cadet_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_student_account: {
        Args: {
          student_cadet_id: string
          student_email: string
          student_name: string
          student_password: string
        }
        Returns: Json
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "student"],
    },
  },
} as const
