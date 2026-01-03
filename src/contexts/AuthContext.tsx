import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  student_number: string | null;
  registration_number?: string | null;
  department: string | null;
  college: string | null;
  phone: string | null;
  bio: string | null;
}

interface StudentRecord {
  id: string;
  full_name: string;
  registration_number: string;
  student_number: string;
  email: string | null;
  is_registered: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    registrationNumber?: string,
    studentNumber?: string,
    role?: "student" | "lecturer"
  ) => Promise<{ error: Error | null }>;
  signIn: (
    identifier: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signInWithStudentId: (
    identifier: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  validateStudent: (
    registrationNumber: string,
    studentNumber: string,
    email: string
  ) => Promise<{ data: StudentRecord | null; error: Error | null }>;
  generateOTP: (
    email: string,
    studentRecordId: string
  ) => Promise<{ otp: string; error: Error | null }>;
  verifyOTP: (
    email: string,
    otp: string
  ) => Promise<{ valid: boolean; error: Error | null }>;
  resetPassword: (
    identifier: string,
    newPassword: string
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setProfile(data);

      // If student_number is missing, try to get it from student_records
      if (!data.student_number) {
        const { data: studentRecord } = await supabase
          .from("student_records")
          .select("student_number, registration_number")
          .eq("email", data.email)
          .maybeSingle();

        if (studentRecord) {
          // Update the profile with student_number and registration_number
          await supabase
            .from("profiles")
            .update({
              student_number: studentRecord.student_number,
              registration_number: studentRecord.registration_number,
            })
            .eq("id", userId);

          // Update local state
          setProfile({
            ...data,
            student_number: studentRecord.student_number,
            registration_number: studentRecord.registration_number,
          });
        }
      }
    }
  };

  // Validate if student exists in the system, create if not
  const validateStudent = async (
    registrationNumber: string,
    studentNumber: string,
    email: string
  ): Promise<{ data: StudentRecord | null; error: Error | null }> => {
    // First, try to find existing record
    const { data: existingData, error: selectError } = await supabase
      .from("student_records")
      .select("*")
      .eq("registration_number", registrationNumber)
      .eq("student_number", studentNumber)
      .maybeSingle();

    if (selectError) {
      return { data: null, error: new Error(selectError.message) };
    }

    // If record exists, check if already registered
    if (existingData) {
      if (existingData.is_registered) {
        return {
          data: null,
          error: new Error(
            "This student account is already registered. Please sign in instead."
          ),
        };
      }
      return { data: existingData as StudentRecord, error: null };
    }

    // Record doesn't exist, create a new one
    // Extract name from email (part before @) and capitalize
    const emailName = email.split("@")[0];
    const fullName =
      emailName
        .split(/[._-]/)
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join(" ") || "New Student";

    const { data: newData, error: insertError } = await supabase
      .from("student_records")
      .insert({
        registration_number: registrationNumber,
        student_number: studentNumber,
        email: email,
        full_name: fullName,
        is_registered: false,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation (duplicate)
      if (insertError.code === "23505") {
        return {
          data: null,
          error: new Error(
            "This registration or student number is already in use. Please sign in instead."
          ),
        };
      }
      return { data: null, error: new Error(insertError.message) };
    }

    return { data: newData as StudentRecord, error: null };
  };

  // Generate a 4-digit OTP
  const generateOTP = async (
    email: string,
    studentRecordId: string | null
  ): Promise<{ otp: string; error: Error | null }> => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error } = await supabase.from("otp_verifications").insert({
      email,
      otp_code: otp,
      student_record_id: studentRecordId,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      return { otp: "", error: new Error(error.message) };
    }

    return { otp, error: null };
  };

  // Verify OTP
  const verifyOTP = async (
    email: string,
    otp: string
  ): Promise<{ valid: boolean; error: Error | null }> => {
    const { data, error } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("otp_code", otp)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { valid: false, error: new Error(error.message) };
    }

    if (!data) {
      return {
        valid: false,
        error: new Error("Invalid or expired OTP. Please request a new one."),
      };
    }

    // Mark OTP as verified
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", data.id);

    return { valid: true, error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    registrationNumber?: string,
    studentNumber?: string,
    role: "student" | "lecturer" = "student"
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          registration_number: registrationNumber,
          student_number: studentNumber,
        },
      },
    });

    // Handle "user already exists" error - this can happen if signup was incomplete
    if (error) {
      // If user already exists, they might need to sign in or reset password
      if (
        error.message.includes("already registered") ||
        error.message.includes("User already registered")
      ) {
        return {
          error: new Error(
            'An account with this email already exists. Please sign in or use "Forgot Password" to reset your password.'
          ),
        };
      }
      return { error };
    }

    // Update profile with student_number and registration_number (for students)
    if (data.user) {
      if (role === "student") {
        await supabase
          .from("profiles")
          .update({
            student_number: studentNumber,
            registration_number: registrationNumber,
          })
          .eq("id", data.user.id);
      }

      // Assign role to user in user_roles table
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: role,
      });
    }

    // Update student record with full name and mark as registered (for students only)
    if (role === "student" && registrationNumber && studentNumber) {
      await supabase
        .from("student_records")
        .update({
          is_registered: true,
          full_name: fullName,
          email: email,
        })
        .eq("registration_number", registrationNumber)
        .eq("student_number", studentNumber);
    }

    return { error: null };
  };

  // Sign in with email and password (legacy method)
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Sign in with student number or registration number
  const signInWithStudentId = async (identifier: string, password: string) => {
    // Check if identifier is an email (for lecturers)
    if (identifier.includes("@")) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      return { error };
    }

    // First, find the student by registration number or student number
    const { data: studentRecord, error: findError } = await supabase
      .from("student_records")
      .select("*")
      .or(
        `registration_number.eq.${identifier},student_number.eq.${identifier}`
      )
      .maybeSingle();

    if (findError || !studentRecord) {
      return {
        error: new Error(
          "Student not found. Please check your registration or student number."
        ),
      };
    }

    // Check if email exists in student record
    if (!studentRecord.email) {
      // Try to find the email from profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("email")
        .or(
          `student_number.eq.${studentRecord.student_number},registration_number.eq.${studentRecord.registration_number}`
        )
        .maybeSingle();

      if (profileData?.email) {
        const { error } = await supabase.auth.signInWithPassword({
          email: profileData.email,
          password,
        });
        return { error };
      }

      return {
        error: new Error(
          "No email associated with this student. Please contact support."
        ),
      };
    }

    // Sign in with the email
    const { error } = await supabase.auth.signInWithPassword({
      email: studentRecord.email,
      password,
    });
    return { error };
  };

  const resetPassword = async (
    identifier: string,
    newPassword: string
  ): Promise<{ error: Error | null }> => {
    try {
      // Get the current user's session (after OTP verification)
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        return {
          error: new Error(
            "You must verify your identity first before resetting password"
          ),
        };
      }

      // Update the password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err : new Error("Failed to reset password"),
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signInWithStudentId,
        signOut,
        validateStudent,
        generateOTP,
        verifyOTP,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
