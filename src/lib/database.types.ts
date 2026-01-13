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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_calendar_events: {
        Row: {
          academic_year: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          location: string | null
          semester: string | null
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          academic_year?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          location?: string | null
          semester?: string | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          academic_year?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          location?: string | null
          semester?: string | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          badge_name: string
          badge_type: string
          description: string | null
          earned_at: string
          icon: string | null
          id: string
          student_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          student_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          description?: string | null
          earned_at?: string
          icon?: string | null
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      announcement_comments: {
        Row: {
          announcement_id: string
          content: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_likes: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_likes_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_views: {
        Row: {
          announcement_id: string
          id: string
          student_id: string
          viewed_at: string
        }
        Insert: {
          announcement_id: string
          id?: string
          student_id: string
          viewed_at?: string
        }
        Update: {
          announcement_id?: string
          id?: string
          student_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          course_id: string | null
          created_at: string
          id: string
          is_global: boolean | null
          is_pinned: boolean | null
          title: string
        }
        Insert: {
          author_id: string
          content: string
          course_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_pinned?: boolean | null
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_pinned?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          created_at: string | null
          feedback: string | null
          file_url: string | null
          id: string
          score: number | null
          student_id: string
          submission_date: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          score?: number | null
          student_id: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submission: boolean | null
          course_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          instruction_document_name: string | null
          instruction_document_url: string | null
          instructions: string | null
          lecturer_id: string | null
          max_score: number | null
          rubric_id: string | null
          status: string | null
          title: string
          total_points: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          allow_late_submission?: boolean | null
          course_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          instruction_document_name?: string | null
          instruction_document_url?: string | null
          instructions?: string | null
          lecturer_id?: string | null
          max_score?: number | null
          rubric_id?: string | null
          status?: string | null
          title: string
          total_points?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          allow_late_submission?: boolean | null
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          instruction_document_name?: string | null
          instruction_document_url?: string | null
          instructions?: string | null
          lecturer_id?: string | null
          max_score?: number | null
          rubric_id?: string | null
          status?: string | null
          title?: string
          total_points?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "grading_rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          course_id: string
          created_at: string | null
          id: string
          lecturer_id: string
          remarks: string | null
          session_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          attendance_date: string
          course_id: string
          created_at?: string | null
          id?: string
          lecturer_id: string
          remarks?: string | null
          session_id?: string | null
          status: string
          student_id: string
        }
        Update: {
          attendance_date?: string
          course_id?: string
          created_at?: string | null
          id?: string
          lecturer_id?: string
          remarks?: string | null
          session_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      course_marks: {
        Row: {
          academic_year: string
          assignment_marks: number | null
          assignment_total: number | null
          continuous_assessment_marks: number | null
          continuous_assessment_total: number | null
          course_id: string
          coursework_marks: number | null
          coursework_total: number | null
          created_at: string | null
          final_exam_marks: number | null
          final_exam_total: number | null
          grade: string | null
          grade_point: number | null
          id: string
          last_updated_by: string | null
          lecturer_id: string
          mid_exam_marks: number | null
          mid_exam_total: number | null
          quiz_marks: number | null
          quiz_total: number | null
          semester: string
          student_id: string
          test_marks: number | null
          test_total: number | null
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          assignment_marks?: number | null
          assignment_total?: number | null
          continuous_assessment_marks?: number | null
          continuous_assessment_total?: number | null
          course_id: string
          coursework_marks?: number | null
          coursework_total?: number | null
          created_at?: string | null
          final_exam_marks?: number | null
          final_exam_total?: number | null
          grade?: string | null
          grade_point?: number | null
          id?: string
          last_updated_by?: string | null
          lecturer_id: string
          mid_exam_marks?: number | null
          mid_exam_total?: number | null
          quiz_marks?: number | null
          quiz_total?: number | null
          semester: string
          student_id: string
          test_marks?: number | null
          test_total?: number | null
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          assignment_marks?: number | null
          assignment_total?: number | null
          continuous_assessment_marks?: number | null
          continuous_assessment_total?: number | null
          course_id?: string
          coursework_marks?: number | null
          coursework_total?: number | null
          created_at?: string | null
          final_exam_marks?: number | null
          final_exam_total?: number | null
          grade?: string | null
          grade_point?: number | null
          id?: string
          last_updated_by?: string | null
          lecturer_id?: string
          mid_exam_marks?: number | null
          mid_exam_total?: number | null
          quiz_marks?: number | null
          quiz_total?: number | null
          semester?: string
          student_id?: string
          test_marks?: number | null
          test_total?: number | null
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_marks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          credits: number | null
          department_id: string
          description: string | null
          id: string
          instructor_id: string | null
          max_students: number | null
          semester: string | null
          status: Database["public"]["Enums"]["course_status"] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number | null
          department_id: string
          description?: string | null
          id?: string
          instructor_id?: string | null
          max_students?: number | null
          semester?: string | null
          status?: Database["public"]["Enums"]["course_status"] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number | null
          department_id?: string
          description?: string | null
          id?: string
          instructor_id?: string | null
          max_students?: number | null
          semester?: string | null
          status?: Database["public"]["Enums"]["course_status"] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          college_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          college_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          college_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          discussion_id: string
          id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          discussion_id: string
          id?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          author_id: string
          content: string
          course_id: string
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string
        }
        Insert: {
          author_id: string
          content: string
          course_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          grade: number | null
          id: string
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          grade?: number | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          grade?: number | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          academic_year: string
          course_id: string
          created_at: string
          grade: string | null
          grade_point: number | null
          id: string
          marks: number
          remarks: string | null
          semester: string
          student_id: string
        }
        Insert: {
          academic_year: string
          course_id: string
          created_at?: string
          grade?: string | null
          grade_point?: number | null
          id?: string
          marks: number
          remarks?: string | null
          semester: string
          student_id: string
        }
        Update: {
          academic_year?: string
          course_id?: string
          created_at?: string
          grade?: string | null
          grade_point?: number | null
          id?: string
          marks?: number
          remarks?: string | null
          semester?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          academic_year: string
          amount: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          paid_amount: number | null
          semester: string
          student_id: string
        }
        Insert: {
          academic_year: string
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          paid_amount?: number | null
          semester: string
          student_id: string
        }
        Update: {
          academic_year?: string
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          paid_amount?: number | null
          semester?: string
          student_id?: string
        }
        Relationships: []
      }
      google_classroom_sessions: {
        Row: {
          attendance_marked: boolean | null
          classroom_code: string | null
          classroom_id: string | null
          classroom_name: string
          course_id: string
          created_at: string | null
          description: string | null
          end_time: string | null
          id: string
          lecturer_id: string
          meeting_link: string | null
          recording_link: string | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_marked?: boolean | null
          classroom_code?: string | null
          classroom_id?: string | null
          classroom_name: string
          course_id: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          lecturer_id: string
          meeting_link?: string | null
          recording_link?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_marked?: boolean | null
          classroom_code?: string | null
          classroom_id?: string | null
          classroom_name?: string
          course_id?: string
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          lecturer_id?: string
          meeting_link?: string | null
          recording_link?: string | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_classroom_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_rubrics: {
        Row: {
          assessment_type: string
          course_id: string
          created_at: string | null
          criteria: Json | null
          description: string | null
          id: string
          lecturer_id: string
          name: string
          total_marks: number
          updated_at: string | null
        }
        Insert: {
          assessment_type: string
          course_id: string
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          lecturer_id: string
          name: string
          total_marks: number
          updated_at?: string | null
        }
        Update: {
          assessment_type?: string
          course_id?: string
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          lecturer_id?: string
          name?: string
          total_marks?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grading_rubrics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lecturer_courses: {
        Row: {
          academic_year: string
          course_id: string
          created_at: string | null
          id: string
          lecturer_id: string
          semester: string
        }
        Insert: {
          academic_year: string
          course_id: string
          created_at?: string | null
          id?: string
          lecturer_id: string
          semester: string
        }
        Update: {
          academic_year?: string
          course_id?: string
          created_at?: string | null
          id?: string
          lecturer_id?: string
          semester?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecturer_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string
          is_recurring: boolean | null
          meet_link: string | null
          recording_url: string | null
          scheduled_at: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id: string
          is_recurring?: boolean | null
          meet_link?: string | null
          recording_url?: string | null
          scheduled_at: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string
          is_recurring?: boolean | null
          meet_link?: string | null
          recording_url?: string | null
          scheduled_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_downloadable: boolean | null
          order_index: number | null
          title: string
          week_number: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean | null
          order_index?: number | null
          title: string
          week_number?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean | null
          order_index?: number | null
          title?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      message_drafts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          subject: string | null
          to_user_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          subject?: string | null
          to_user_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          subject?: string | null
          to_user_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          body: string
          created_at: string
          from_user_id: string
          id: string
          is_archived: boolean | null
          is_deleted_by_recipient: boolean | null
          is_deleted_by_sender: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          parent_message_id: string | null
          subject: string
          thread_id: string | null
          to_user_id: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          body: string
          created_at?: string
          from_user_id: string
          id?: string
          is_archived?: boolean | null
          is_deleted_by_recipient?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          parent_message_id?: string | null
          subject: string
          thread_id?: string | null
          to_user_id: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          body?: string
          created_at?: string
          from_user_id?: string
          id?: string
          is_archived?: boolean | null
          is_deleted_by_recipient?: boolean | null
          is_deleted_by_sender?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          parent_message_id?: string | null
          subject?: string
          thread_id?: string | null
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          student_record_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_code: string
          student_record_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          student_record_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_verifications_student_record_id_fkey"
            columns: ["student_record_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          fee_id: string
          id: string
          paid_at: string
          payment_method: string | null
          status: string | null
          student_id: string
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          fee_id: string
          id?: string
          paid_at?: string
          payment_method?: string | null
          status?: string | null
          student_id: string
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          fee_id?: string
          id?: string
          paid_at?: string
          payment_method?: string | null
          status?: string | null
          student_id?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          animate_transitions: boolean | null
          avatar_url: string | null
          bio: string | null
          college: string | null
          color_theme: string | null
          compact_mode: boolean | null
          created_at: string
          dashboard_layout: string | null
          department: string | null
          email: string
          font_size: string | null
          full_name: string
          id: string
          language: string | null
          office_hours: string | null
          office_location: string | null
          office_phone: string | null
          phone: string | null
          phone_number: string | null
          registration_number: string | null
          role: string
          show_sidebar: boolean | null
          show_tooltips: boolean | null
          specialization: string | null
          student_number: string | null
          student_record_id: string | null
          updated_at: string
        }
        Insert: {
          animate_transitions?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          color_theme?: string | null
          compact_mode?: boolean | null
          created_at?: string
          dashboard_layout?: string | null
          department?: string | null
          email: string
          font_size?: string | null
          full_name: string
          id: string
          language?: string | null
          office_hours?: string | null
          office_location?: string | null
          office_phone?: string | null
          phone?: string | null
          phone_number?: string | null
          registration_number?: string | null
          role?: string
          show_sidebar?: boolean | null
          show_tooltips?: boolean | null
          specialization?: string | null
          student_number?: string | null
          student_record_id?: string | null
          updated_at?: string
        }
        Update: {
          animate_transitions?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          color_theme?: string | null
          compact_mode?: boolean | null
          created_at?: string
          dashboard_layout?: string | null
          department?: string | null
          email?: string
          font_size?: string | null
          full_name?: string
          id?: string
          language?: string | null
          office_hours?: string | null
          office_location?: string | null
          office_phone?: string | null
          phone?: string | null
          phone_number?: string | null
          registration_number?: string | null
          role?: string
          show_sidebar?: boolean | null
          show_tooltips?: boolean | null
          specialization?: string | null
          student_number?: string | null
          student_record_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_student_record_id_fkey"
            columns: ["student_record_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          credits_required: number | null
          department: string | null
          description: string | null
          duration_years: number | null
          id: string
          level: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          credits_required?: number | null
          department?: string | null
          description?: string | null
          duration_years?: number | null
          id?: string
          level?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          credits_required?: number | null
          department?: string | null
          description?: string | null
          duration_years?: number | null
          id?: string
          level?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number | null
          completed_at: string | null
          id: string
          quiz_id: string
          score: number | null
          started_at: string
          student_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          id?: string
          quiz_id: string
          score?: number | null
          started_at?: string
          student_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number | null
          started_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          id: string
          options: Json
          order_index: number | null
          points: number | null
          question: string
          quiz_id: string
        }
        Insert: {
          correct_answer: number
          id?: string
          options: Json
          order_index?: number | null
          points?: number | null
          question: string
          quiz_id: string
        }
        Update: {
          correct_answer?: number
          id?: string
          options?: Json
          order_index?: number | null
          points?: number | null
          question?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          attempts_allowed: number | null
          average_score: number | null
          completion_rate: number | null
          course_code: string | null
          course_id: string
          course_title: string | null
          created_at: string
          description: string | null
          end_date: string | null
          highest_score: number | null
          id: string
          is_published: boolean | null
          lecturer_id: string
          lowest_score: number | null
          max_attempts: number | null
          passing_score: number | null
          show_answers: boolean | null
          shuffle_questions: boolean | null
          start_date: string | null
          status: string | null
          time_limit: number | null
          time_limit_minutes: number | null
          title: string
          total_attempts: number | null
          total_points: number | null
          total_questions: number | null
        }
        Insert: {
          attempts_allowed?: number | null
          average_score?: number | null
          completion_rate?: number | null
          course_code?: string | null
          course_id: string
          course_title?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          highest_score?: number | null
          id?: string
          is_published?: boolean | null
          lecturer_id: string
          lowest_score?: number | null
          max_attempts?: number | null
          passing_score?: number | null
          show_answers?: boolean | null
          shuffle_questions?: boolean | null
          start_date?: string | null
          status?: string | null
          time_limit?: number | null
          time_limit_minutes?: number | null
          title: string
          total_attempts?: number | null
          total_points?: number | null
          total_questions?: number | null
        }
        Update: {
          attempts_allowed?: number | null
          average_score?: number | null
          completion_rate?: number | null
          course_code?: string | null
          course_id?: string
          course_title?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          highest_score?: number | null
          id?: string
          is_published?: boolean | null
          lecturer_id?: string
          lowest_score?: number | null
          max_attempts?: number | null
          passing_score?: number | null
          show_answers?: boolean | null
          shuffle_questions?: boolean | null
          start_date?: string | null
          status?: string | null
          time_limit?: number | null
          time_limit_minutes?: number | null
          title?: string
          total_attempts?: number | null
          total_points?: number | null
          total_questions?: number | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          building: string | null
          course_id: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          start_time: string
        }
        Insert: {
          building?: string | null
          course_id: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          start_time: string
        }
        Update: {
          building?: string | null
          course_id?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          academic_year: string | null
          assignment1: number | null
          assignment2: number | null
          course_id: string
          created_at: string
          final_exam: number | null
          gp: number | null
          grade: string | null
          id: string
          lecturer_id: string
          midterm: number | null
          participation: number | null
          semester: string | null
          student_id: string
          total: number | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          assignment1?: number | null
          assignment2?: number | null
          course_id: string
          created_at?: string
          final_exam?: number | null
          gp?: number | null
          grade?: string | null
          id?: string
          lecturer_id: string
          midterm?: number | null
          participation?: number | null
          semester?: string | null
          student_id: string
          total?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          assignment1?: number | null
          assignment2?: number | null
          course_id?: string
          created_at?: string
          final_exam?: number | null
          gp?: number | null
          grade?: string | null
          id?: string
          lecturer_id?: string
          midterm?: number | null
          participation?: number | null
          semester?: string | null
          student_id?: string
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_records: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_registered: boolean | null
          registration_number: string
          student_number: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_registered?: boolean | null
          registration_number: string
          student_number: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_registered?: boolean | null
          registration_number?: string
          student_number?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          id: string
          score: number | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_requests: {
        Row: {
          copies_issued: number | null
          created_at: string | null
          cumulative_gpa: number | null
          delivery_address: string | null
          delivery_method: string | null
          fee_amount: number | null
          fees_paid: boolean | null
          graduation_date: string | null
          id: string
          issued_date: string | null
          notes: string | null
          payment_reference: string | null
          processed_by: string | null
          processed_date: string | null
          program: string | null
          purpose: string | null
          rejection_reason: string | null
          request_type: string
          requested_date: string | null
          status: string
          student_email: string | null
          student_id: string
          student_name: string
          student_number: string
          total_credits: number | null
          updated_at: string | null
          verification_code: string | null
        }
        Insert: {
          copies_issued?: number | null
          created_at?: string | null
          cumulative_gpa?: number | null
          delivery_address?: string | null
          delivery_method?: string | null
          fee_amount?: number | null
          fees_paid?: boolean | null
          graduation_date?: string | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          payment_reference?: string | null
          processed_by?: string | null
          processed_date?: string | null
          program?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          request_type: string
          requested_date?: string | null
          status?: string
          student_email?: string | null
          student_id: string
          student_name: string
          student_number: string
          total_credits?: number | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Update: {
          copies_issued?: number | null
          created_at?: string | null
          cumulative_gpa?: number | null
          delivery_address?: string | null
          delivery_method?: string | null
          fee_amount?: number | null
          fees_paid?: boolean | null
          graduation_date?: string | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          payment_reference?: string | null
          processed_by?: string | null
          processed_date?: string | null
          program?: string | null
          purpose?: string | null
          rejection_reason?: string | null
          request_type?: string
          requested_date?: string | null
          status?: string
          student_email?: string | null
          student_id?: string
          student_name?: string
          student_number?: string
          total_credits?: number | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcript_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_records"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_course_grade: {
        Args: { marks: number }
        Returns: {
          grade: string
          grade_point: number
        }[]
      }
      generate_thread_id: { Args: never; Returns: string }
      generate_verification_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_enrolled: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      is_instructor: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      is_registrar: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      assignment_status: "pending" | "submitted" | "graded" | "late"
      course_status: "draft" | "published" | "archived"
      enrollment_status: "pending" | "approved" | "rejected" | "completed"
      user_role: "student" | "lecturer" | "admin" | "registrar"
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
      assignment_status: ["pending", "submitted", "graded", "late"],
      course_status: ["draft", "published", "archived"],
      enrollment_status: ["pending", "approved", "rejected", "completed"],
      user_role: ["student", "lecturer", "admin", "registrar"],
    },
  },
} as const
