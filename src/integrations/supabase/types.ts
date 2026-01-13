export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_name: string;
          badge_type: string;
          description: string | null;
          earned_at: string;
          icon: string | null;
          id: string;
          student_id: string;
        };
        Insert: {
          badge_name: string;
          badge_type: string;
          description?: string | null;
          earned_at?: string;
          icon?: string | null;
          id?: string;
          student_id: string;
        };
        Update: {
          badge_name?: string;
          badge_type?: string;
          description?: string | null;
          earned_at?: string;
          icon?: string | null;
          id?: string;
          student_id?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          author_id: string;
          content: string;
          course_id: string | null;
          created_at: string;
          id: string;
          is_global: boolean | null;
          is_pinned: boolean | null;
          title: string;
        };
        Insert: {
          author_id: string;
          content: string;
          course_id?: string | null;
          created_at?: string;
          id?: string;
          is_global?: boolean | null;
          is_pinned?: boolean | null;
          title: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          course_id?: string | null;
          created_at?: string;
          id?: string;
          is_global?: boolean | null;
          is_pinned?: boolean | null;
          title?: string;
        };
        Relationships: [
          {
<<<<<<< HEAD
            foreignKeyName: "announcements_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      assignments: {
        Row: {
          allow_late_submission: boolean | null;
          course_id: string;
          created_at: string;
          description: string | null;
          due_date: string;
          id: string;
          instructions: string | null;
          max_score: number | null;
          title: string;
          weight: number | null;
          lecturer_id: string | null;
          total_points: number | null;
          status: string | null;
          rubric_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          allow_late_submission?: boolean | null;
          course_id: string;
          created_at?: string;
          description?: string | null;
          due_date: string;
          id?: string;
          instructions?: string | null;
          max_score?: number | null;
          title: string;
          weight?: number | null;
          lecturer_id?: string | null;
          total_points?: number | null;
          status?: string | null;
          rubric_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          allow_late_submission?: boolean | null;
          course_id?: string;
          created_at?: string;
          description?: string | null;
          due_date?: string;
          id?: string;
          instructions?: string | null;
          max_score?: number | null;
          title?: string;
          weight?: number | null;
          lecturer_id?: string | null;
          total_points?: number | null;
          status?: string | null;
          rubric_id?: string | null;
          updated_at?: string | null;
        };
=======
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
          instructions: string | null
          lecturer_id: string | null
          max_score: number | null
          status: string | null
          title: string
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
          instructions?: string | null
          lecturer_id?: string | null
          max_score?: number | null
          status?: string | null
          title: string
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
          instructions?: string | null
          lecturer_id?: string | null
          max_score?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          weight?: number | null
        }
>>>>>>> 35f9a4b74903e340db16b3698717b63125482286
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_lecturer_id_fkey";
            columns: ["lecturer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_rubric_id_fkey";
            columns: ["rubric_id"];
            isOneToOne: false;
            referencedRelation: "grading_rubrics";
            referencedColumns: ["id"];
          }
        ];
      };
      colleges: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          code: string;
          created_at: string;
          credits: number | null;
          department_id: string;
          description: string | null;
          id: string;
          instructor_id: string | null;
          max_students: number | null;
          semester: string | null;
          status: Database["public"]["Enums"]["course_status"] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          year: number | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          credits?: number | null;
          department_id: string;
          description?: string | null;
          id?: string;
          instructor_id?: string | null;
          max_students?: number | null;
          semester?: string | null;
          status?: Database["public"]["Enums"]["course_status"] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          year?: number | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          credits?: number | null;
          department_id?: string;
          description?: string | null;
          id?: string;
          instructor_id?: string | null;
          max_students?: number | null;
          semester?: string | null;
          status?: Database["public"]["Enums"]["course_status"] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          }
        ];
      };
      lecturer_courses: {
        Row: {
          id: string;
          lecturer_id: string;
          course_id: string;
          semester: string;
          academic_year: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lecturer_id: string;
          course_id: string;
          semester: string;
          academic_year: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lecturer_id?: string;
          course_id?: string;
          semester?: string;
          academic_year?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lecturer_courses_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lecturer_courses_lecturer_id_fkey";
            columns: ["lecturer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      departments: {
        Row: {
          code: string;
          college_id: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          college_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          college_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          }
        ];
      };
      discussion_replies: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          discussion_id: string;
          id: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          discussion_id: string;
          id?: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          discussion_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey";
            columns: ["discussion_id"];
            isOneToOne: false;
            referencedRelation: "discussions";
            referencedColumns: ["id"];
          }
        ];
      };
      discussions: {
        Row: {
          author_id: string;
          content: string;
          course_id: string;
          created_at: string;
          id: string;
          is_pinned: boolean | null;
          title: string;
        };
        Insert: {
          author_id: string;
          content: string;
          course_id: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean | null;
          title: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          course_id?: string;
          created_at?: string;
          id?: string;
          is_pinned?: boolean | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      enrollments: {
        Row: {
          completed_at: string | null;
          course_id: string;
          enrolled_at: string;
          grade: number | null;
          id: string;
          status: Database["public"]["Enums"]["enrollment_status"] | null;
          student_id: string;
        };
        Insert: {
          completed_at?: string | null;
          course_id: string;
          enrolled_at?: string;
          grade?: number | null;
          id?: string;
          status?: Database["public"]["Enums"]["enrollment_status"] | null;
          student_id: string;
        };
        Update: {
          completed_at?: string | null;
          course_id?: string;
          enrolled_at?: string;
          grade?: number | null;
          id?: string;
          status?: Database["public"]["Enums"]["enrollment_status"] | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      exam_results: {
        Row: {
          academic_year: string;
          course_id: string;
          created_at: string;
          grade: string | null;
          grade_point: number | null;
          id: string;
          marks: number;
          remarks: string | null;
          semester: string;
          student_id: string;
        };
        Insert: {
          academic_year: string;
          course_id: string;
          created_at?: string;
          grade?: string | null;
          grade_point?: number | null;
          id?: string;
          marks: number;
          remarks?: string | null;
          semester: string;
          student_id: string;
        };
        Update: {
          academic_year?: string;
          course_id?: string;
          created_at?: string;
          grade?: string | null;
          grade_point?: number | null;
          id?: string;
          marks?: number;
          remarks?: string | null;
          semester?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_results_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      fees: {
        Row: {
          academic_year: string;
          amount: number;
          created_at: string;
          description: string | null;
          due_date: string;
          id: string;
          paid_amount: number | null;
          semester: string;
          student_id: string;
        };
        Insert: {
          academic_year: string;
          amount: number;
          created_at?: string;
          description?: string | null;
          due_date: string;
          id?: string;
          paid_amount?: number | null;
          semester: string;
          student_id: string;
        };
        Update: {
          academic_year?: string;
          amount?: number;
          created_at?: string;
          description?: string | null;
          due_date?: string;
          id?: string;
          paid_amount?: number | null;
          semester?: string;
          student_id?: string;
        };
        Relationships: [];
      };
      live_sessions: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          instructor_id: string;
          is_recurring: boolean | null;
          meet_link: string | null;
          recording_url: string | null;
          scheduled_at: string;
          title: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instructor_id: string;
          is_recurring?: boolean | null;
          meet_link?: string | null;
          recording_url?: string | null;
          scheduled_at: string;
          title: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instructor_id?: string;
          is_recurring?: boolean | null;
          meet_link?: string | null;
          recording_url?: string | null;
          scheduled_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      materials: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          file_size: number | null;
          file_type: string | null;
          file_url: string | null;
          id: string;
          is_downloadable: boolean | null;
          order_index: number | null;
          title: string;
          week_number: number | null;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          is_downloadable?: boolean | null;
          order_index?: number | null;
          title: string;
          week_number?: number | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          is_downloadable?: boolean | null;
          order_index?: number | null;
          title?: string;
          week_number?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean | null;
          link: string | null;
          message: string;
          title: string;
          type: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          message: string;
          title: string;
          type?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          message?: string;
          title?: string;
          type?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      otp_verifications: {
        Row: {
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          otp_code: string;
          student_record_id: string | null;
          verified: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          otp_code: string;
          student_record_id?: string | null;
          verified?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          otp_code?: string;
          student_record_id?: string | null;
          verified?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "otp_verifications_student_record_id_fkey";
            columns: ["student_record_id"];
            isOneToOne: false;
            referencedRelation: "student_records";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          amount: number;
          fee_id: string;
          id: string;
          paid_at: string;
          payment_method: string | null;
          status: string | null;
          student_id: string;
          transaction_ref: string | null;
        };
        Insert: {
          amount: number;
          fee_id: string;
          id?: string;
          paid_at?: string;
          payment_method?: string | null;
          status?: string | null;
          student_id: string;
          transaction_ref?: string | null;
        };
        Update: {
          amount?: number;
          fee_id?: string;
          id?: string;
          paid_at?: string;
          payment_method?: string | null;
          status?: string | null;
          student_id?: string;
          transaction_ref?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_fee_id_fkey";
            columns: ["fee_id"];
            isOneToOne: false;
            referencedRelation: "fees";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          college: string | null;
          created_at: string;
          department: string | null;
          email: string;
          full_name: string;
          id: string;
          phone: string | null;
          registration_number: string | null;
          student_number: string | null;
          student_record_id: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          college?: string | null;
          created_at?: string;
          department?: string | null;
          email: string;
          full_name: string;
          id: string;
          phone?: string | null;
          registration_number?: string | null;
          student_number?: string | null;
          student_record_id?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          college?: string | null;
          created_at?: string;
          department?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          registration_number?: string | null;
          student_number?: string | null;
          student_record_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_student_record_id_fkey";
            columns: ["student_record_id"];
            isOneToOne: false;
            referencedRelation: "student_records";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_attempts: {
        Row: {
          answers: Json | null;
          attempt_number: number | null;
          completed_at: string | null;
          id: string;
          quiz_id: string;
          score: number | null;
          started_at: string;
          student_id: string;
        };
        Insert: {
          answers?: Json | null;
          attempt_number?: number | null;
          completed_at?: string | null;
          id?: string;
          quiz_id: string;
          score?: number | null;
          started_at?: string;
          student_id: string;
        };
        Update: {
          answers?: Json | null;
          attempt_number?: number | null;
          completed_at?: string | null;
          id?: string;
          quiz_id?: string;
          score?: number | null;
          started_at?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          }
        ];
      };
      quiz_questions: {
        Row: {
          correct_answer: number;
          id: string;
          options: Json;
          order_index: number | null;
          points: number | null;
          question: string;
          quiz_id: string;
        };
        Insert: {
          correct_answer: number;
          id?: string;
          options: Json;
          order_index?: number | null;
          points?: number | null;
          question: string;
          quiz_id: string;
        };
        Update: {
          correct_answer?: number;
          id?: string;
          options?: Json;
          order_index?: number | null;
          points?: number | null;
          question?: string;
          quiz_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          }
        ];
      };
      quizzes: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          end_date: string | null;
          id: string;
          is_published: boolean | null;
          max_attempts: number | null;
          passing_score: number | null;
          start_date: string | null;
          time_limit_minutes: number | null;
          title: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_published?: boolean | null;
          max_attempts?: number | null;
          passing_score?: number | null;
          start_date?: string | null;
          time_limit_minutes?: number | null;
          title: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_published?: boolean | null;
          max_attempts?: number | null;
          passing_score?: number | null;
          start_date?: string | null;
          time_limit_minutes?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      schedules: {
        Row: {
          building: string | null;
          course_id: string;
          day_of_week: number;
          end_time: string;
          id: string;
          room: string | null;
          start_time: string;
        };
        Insert: {
          building?: string | null;
          course_id: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          room?: string | null;
          start_time: string;
        };
        Update: {
          building?: string | null;
          course_id?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          room?: string | null;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      student_records: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string;
          id: string;
          is_registered: boolean | null;
          registration_number: string;
          student_number: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          is_registered?: boolean | null;
          registration_number: string;
          student_number: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_registered?: boolean | null;
          registration_number?: string;
          student_number?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          assignment_id: string;
          content: string | null;
          feedback: string | null;
          file_url: string | null;
          graded_at: string | null;
          id: string;
          score: number | null;
          status: Database["public"]["Enums"]["assignment_status"] | null;
          student_id: string;
          submitted_at: string;
        };
        Insert: {
          assignment_id: string;
          content?: string | null;
          feedback?: string | null;
          file_url?: string | null;
          graded_at?: string | null;
          id?: string;
          score?: number | null;
          status?: Database["public"]["Enums"]["assignment_status"] | null;
          student_id: string;
          submitted_at?: string;
        };
        Update: {
          assignment_id?: string;
          content?: string | null;
          feedback?: string | null;
          file_url?: string | null;
          graded_at?: string | null;
          id?: string;
          score?: number | null;
          status?: Database["public"]["Enums"]["assignment_status"] | null;
          student_id?: string;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_enrolled: {
        Args: { _course_id: string; _user_id: string };
        Returns: boolean;
      };
      is_instructor: {
        Args: { _course_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      assignment_status: "pending" | "submitted" | "graded" | "late";
      course_status: "draft" | "published" | "archived";
      enrollment_status: "pending" | "approved" | "rejected" | "completed";
      user_role: "student" | "lecturer" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      assignment_status: ["pending", "submitted", "graded", "late"],
      course_status: ["draft", "published", "archived"],
      enrollment_status: ["pending", "approved", "rejected", "completed"],
      user_role: ["student", "lecturer", "admin"],
    },
  },
} as const;
