import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

// Map Firebase User to a compatible interface if needed, or just use FirebaseUser
type User = FirebaseUser;
type Session = { user: User } | null;

interface Profile {
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
  ) => Promise<{ error: Error | null }>;
  signIn: (
    identifier: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signInWithStudentId: (
    identifier: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  validateStudent: (
    registrationNumber: string,
    studentNumber: string,
    email: string,
  ) => Promise<{ data: StudentRecord | null; error: Error | null }>;
  generateOTP: (
    email: string,
    studentRecordId: string,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setSession(currentUser ? { user: currentUser } : null);

      if (currentUser) {
        fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "profiles", userId));

      if (profileDoc.exists()) {
        const data = profileDoc.data() as Profile;
        setProfile({ ...data, id: userId });
        console.log("Profile loaded:", { id: userId, role: data.role });

        // Subscribe to real-time profile updates
        const unsubscribe = onSnapshot(doc(db, "profiles", userId), (doc) => {
          if (doc.exists()) {
            setProfile({ ...(doc.data() as Profile), id: userId });
          }
        });

        // If student_number is missing, try to get it from student_records
        if (!data.student_number) {
          const recordsRef = collection(db, "student_records");
          const q = query(
            recordsRef,
            where("email", "==", data.email),
            limit(1),
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const studentRecord = querySnapshot.docs[0].data();

            // Update the profile with student_number and registration_number
            await updateDoc(doc(db, "profiles", userId), {
              student_number: studentRecord.student_number,
              registration_number: studentRecord.registration_number,
            });

            // Update local state
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    student_number: studentRecord.student_number,
                    registration_number: studentRecord.registration_number,
                  }
                : null,
            );
          }
        }

        return () => unsubscribe();
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Validate if student exists in the system, create if not
  const validateStudent = async (
    registrationNumber: string,
    studentNumber: string,
    email: string,
  ): Promise<{ data: StudentRecord | null; error: Error | null }> => {
    try {
      // First, try to find existing record
      const recordsRef = collection(db, "student_records");
      const q = query(
        recordsRef,
        where("registration_number", "==", registrationNumber),
        where("student_number", "==", studentNumber),
        limit(1),
      );
      const querySnapshot = await getDocs(q);

      // If record exists, check if already registered
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const existingData = studentDoc.data() as StudentRecord;
        if (existingData.is_registered) {
          return {
            data: null,
            error: new Error(
              "This student account is already registered. Please sign in instead.",
            ),
          };
        }
        return { data: { ...existingData, id: studentDoc.id }, error: null };
      }

      // Record doesn't exist, create a new one
      const emailName = email.split("@")[0];
      const fullName =
        emailName
          .split(/[._-]/)
          .map(
            (part) =>
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
          )
          .join(" ") || "New Student";

      const newData = {
        registration_number: registrationNumber,
        student_number: studentNumber,
        email: email,
        full_name: fullName,
        is_registered: false,
        created_at: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "student_records"), newData);

      return {
        data: {
          ...newData,
          id: docRef.id,
          created_at: new Date().toISOString(),
        } as unknown as StudentRecord,
        error: null,
      };
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
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await addDoc(collection(db, "otp_verifications"), {
        email,
        otp_code: otp,
        student_record_id: studentRecordId,
        expires_at: expiresAt.toISOString(),
        verified: false,
        created_at: serverTimestamp(),
      });

      return { otp, error: null };
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
      const otpRef = collection(db, "otp_verifications");
      const q = query(
        otpRef,
        where("email", "==", email),
        where("otp_code", "==", otp),
        where("verified", "==", false),
        limit(1),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          valid: false,
          error: new Error("Invalid or expired OTP. Please request a new one."),
        };
      }

      const otpDoc = querySnapshot.docs[0];
      const data = otpDoc.data();

      if (new Date(data.expires_at) < new Date()) {
        return {
          valid: false,
          error: new Error("OTP has expired. Please request a new one."),
        };
      }

      // Mark OTP as verified
      await updateDoc(doc(db, "otp_verifications", otpDoc.id), {
        verified: true,
      });

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
  ) => {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      if (user) {
        const profileData: any = {
          full_name: fullName,
          email: email,
          role: role,
          college: college || null,
          programme: programme || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (role === "student") {
          profileData.student_number = studentNumber;
          profileData.registration_number = registrationNumber;
        } else if (role === "lecturer") {
          profileData.department = department;
        }

        await setDoc(doc(db, "profiles", user.uid), profileData);

        // Update student record (if student)
        if (role === "student" && registrationNumber && studentNumber) {
          const recordsRef = collection(db, "student_records");
          const q = query(
            recordsRef,
            where("registration_number", "==", registrationNumber),
            where("student_number", "==", studentNumber),
            limit(1),
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            await updateDoc(
              doc(db, "student_records", querySnapshot.docs[0].id),
              {
                is_registered: true,
                full_name: fullName,
                email: email,
              },
            );
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        return {
          error: new Error(
            'An account with this email already exists. Please sign in or use "Forgot Password" to reset your password.',
          ),
        };
      }
      return { error };
    }
  };

  // Sign in with email and password (legacy method)
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  // Sign in with student number or registration number
  const signInWithStudentId = async (identifier: string, password: string) => {
    try {
      // Check if identifier is an email (for lecturers)
      if (identifier.includes("@")) {
        await signInWithEmailAndPassword(auth, identifier, password);
        return { error: null };
      }

      // First, find the student by registration number or student number in student_records
      const recordsRef = collection(db, "student_records");
      const qReg = query(
        recordsRef,
        where("registration_number", "==", identifier),
        limit(1),
      );
      const qStu = query(
        recordsRef,
        where("student_number", "==", identifier),
        limit(1),
      );

      let querySnapshot = await getDocs(qReg);
      if (querySnapshot.empty) {
        querySnapshot = await getDocs(qStu);
      }

      if (querySnapshot.empty) {
        return {
          error: new Error(
            "Student not found. Please check your registration or student number.",
          ),
        };
      }

      const studentData = querySnapshot.docs[0].data();

      // Check if email exists in student record
      if (!studentData.email) {
        // Try to find the email from profiles collection
        const profilesRef = collection(db, "profiles");
        const qProfReg = query(
          profilesRef,
          where("registration_number", "==", identifier),
          limit(1),
        );
        const qProfStu = query(
          profilesRef,
          where("student_number", "==", identifier),
          limit(1),
        );

        let profSnapshot = await getDocs(qProfReg);
        if (profSnapshot.empty) {
          profSnapshot = await getDocs(qProfStu);
        }

        if (profSnapshot.empty || !profSnapshot.docs[0].data().email) {
          return {
            error: new Error(
              "No email associated with this student. Please contact support.",
            ),
          };
        }

        await signInWithEmailAndPassword(
          auth,
          profSnapshot.docs[0].data().email,
          password,
        );
        return { error: null };
      }

      // Sign in with the email
      await signInWithEmailAndPassword(auth, studentData.email, password);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const resetPassword = async (
    identifier: string,
    newPassword: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return {
          error: new Error(
            "You must verify your identity first before resetting password",
          ),
        };
      }

      // Update the password using Firebase
      await updatePassword(currentUser, newPassword);
      return { error: null };
    } catch (error: any) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error("Failed to reset password"),
      };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
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
