import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const AUTH_TOKEN_STORAGE_KEY = "nexus-auth-token";

interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

type Session = { user: User } | null;

interface Profile {
  course_id?: string | null;
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  student_number: string | null;
  registration_number?: string | null;
  department: string | null;
  college: string | null;
  programme?: string | null;
  phone: string | null;
  phone_number?: string | null;
  bio: string | null;
  role?: "student" | "lecturer" | "admin" | "registrar";
  updated_at?: any;
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
    role?: "student" | "lecturer" | "admin" | "registrar",
    department?: string,
    college?: string,
    programme?: string,
  ) => Promise<{ error: Error | null; user?: User; profile?: Profile | null }>;
  signIn: (
    identifier: string,
    password: string,
  ) => Promise<{ error: Error | null; user?: User; profile?: Profile | null }>;
  signInWithStudentId: (
    identifier: string,
    password: string,
  ) => Promise<{ error: Error | null; user?: User; profile?: Profile | null }>;
  signOut: () => Promise<void>;
  validateStudent: (
    registrationNumber: string,
    studentNumber: string,
    email: string,
  ) => Promise<{ data: StudentRecord | null; error: Error | null }>;
  generateOTP: (
    email: string,
    studentRecordId: string | null,
  ) => Promise<{ otp: string; error: Error | null }>;
  verifyOTP: (
    email: string,
    otp: string,
  ) => Promise<{ valid: boolean; error: Error | null }>;
  resetPassword: (
    identifier: string,
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function saveToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail || data?.error || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

async function getJson<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail || data?.error || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getJson<{ user: User; profile: Profile | null }>(
          "/api/auth/me/",
        );

        setUser(response.user);
        setSession({ user: response.user });
        setProfile(response.profile);
      } catch (error) {
        clearToken();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Validate if student exists in the system, create if not
  const validateStudent = async (
    registrationNumber: string,
    studentNumber: string,
    email: string,
  ): Promise<{ data: StudentRecord | null; error: Error | null }> => {
    try {
      const response = await postJson<StudentRecord>(
        "/api/auth/validate-student-record/",
        {
          registrationNumber,
          studentNumber,
          email,
        },
      );

      return { data: response, error: null };
    } catch (error: any) {
      return { data: null, error: new Error(error.message) };
    }
  };

  // Generate a 4-digit OTP
  const generateOTP = async (
    email: string,
    studentRecordId: string | null,
  ): Promise<{ otp: string; error: Error | null }> => {
    try {
      const response = await postJson<{
        success: boolean;
        deliveryChannel: string;
        otp?: string;
        verificationId?: string;
      }>("/api/auth/send-signup-otp/", {
        email,
        studentRecordId,
      });

      return {
        otp: import.meta.env.DEV ? response.otp || "" : "",
        error: null,
      };
    } catch (error: any) {
      return { otp: "", error: new Error(error.message) };
    }
  };

  // Verify OTP
  const verifyOTP = async (
    email: string,
    otp: string,
  ): Promise<{ valid: boolean; error: Error | null }> => {
    try {
      const response = await postJson<{ valid: boolean; reason?: string }>(
        "/api/auth/verify-signup-otp/",
        { email, otp },
      );

      if (!response.valid) {
        return {
          valid: false,
          error: new Error("Invalid or expired OTP. Please request a new one."),
        };
      }

      return { valid: true, error: null };
    } catch (error: any) {
      return { valid: false, error: new Error(error.message) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    registrationNumber?: string,
    studentNumber?: string,
    role: "student" | "lecturer" | "admin" | "registrar" = "student",
    department?: string,
    college?: string,
    programme?: string,
  ): Promise<{ error: Error | null; user?: User; profile?: Profile | null }> => {
    try {
      const response = await postJson<{
        token: string;
        user: User;
        profile: Profile | null;
      }>("/api/auth/signup/", {
        email,
        password,
        fullName,
        registrationNumber,
        studentNumber,
        role,
        department,
        college,
        programme,
      });

      saveToken(response.token);
      setUser(response.user);
      setSession({ user: response.user });
      setProfile(response.profile);

      return { error: null, user: response.user, profile: response.profile };
    } catch (error: any) {
      return { error: new Error(error.message) };
    }
  };

  // Sign in with email or identifier and password
  const signIn = async (
    identifier: string,
    password: string,
  ): Promise<{ error: Error | null; user?: User; profile?: Profile | null }> => {
    try {
      const response = await postJson<{
        token: string;
        user: User;
        profile: Profile | null;
      }>("/api/auth/login/", {
        identifier,
        password,
      });

      saveToken(response.token);
      setUser(response.user);
      setSession({ user: response.user });
      setProfile(response.profile);

      return { error: null, user: response.user, profile: response.profile };
    } catch (error: any) {
      return { error: new Error(error.message) };
    }
  };

  const signInWithStudentId = async (
    identifier: string,
    password: string,
  ): Promise<{ error: Error | null; user?: User; profile?: Profile | null }> => {
    return signIn(identifier, password);
  };

  const resetPassword = async (
    identifier: string,
    newPassword: string,
  ): Promise<{ error: Error | null }> => {
    try {
      await postJson<{ success: boolean }>("/api/auth/reset-password/", {
        identifier,
        newPassword,
      });
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message) };
    }
  };

  const signOut = async () => {
    try {
      await postJson<{ success: boolean }>("/api/auth/logout/", {});
    } catch {
      // ignore logout errors - still clear local token
    }
    clearToken();
    setUser(null);
    setSession(null);
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
