import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Search,
  Download,
  Filter,
  MessageCircle,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  status: "active" | "inactive" | "graduated";
  gpa: number;
  enrollmentDate: string;
  track: string;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerRoster() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const mockStudents: Student[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@uni.edu",
      phone: "+1 234-567-8900",
      studentId: "STU001",
      status: "active",
      gpa: 3.8,
      enrollmentDate: "2022-09-01",
      track: "Advanced",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@uni.edu",
      phone: "+1 234-567-8901",
      studentId: "STU002",
      status: "active",
      gpa: 3.6,
      enrollmentDate: "2022-09-01",
      track: "Standard",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@uni.edu",
      phone: "+1 234-567-8902",
      studentId: "STU003",
      status: "active",
      gpa: 3.2,
      enrollmentDate: "2022-09-01",
      track: "Advanced",
    },
    {
      id: "4",
      name: "Sarah Williams",
      email: "sarah@uni.edu",
      phone: "+1 234-567-8903",
      studentId: "STU004",
      status: "active",
      gpa: 3.4,
      enrollmentDate: "2022-09-01",
      track: "Standard",
    },
    {
      id: "5",
      name: "Alex Brown",
      email: "alex@uni.edu",
      phone: "+1 234-567-8904",
      studentId: "STU005",
      status: "inactive",
      gpa: 2.9,
      enrollmentDate: "2023-01-15",
      track: "Advanced",
    },
    {
      id: "6",
      name: "Emma Davis",
      email: "emma@uni.edu",
      phone: "+1 234-567-8905",
      studentId: "STU006",
      status: "active",
      gpa: 3.9,
      enrollmentDate: "2022-09-01",
      track: "Standard",
    },
  ];

  useEffect(() => {
    setStudents(mockStudents);
  }, []);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrack = selectedTrack === "all" || s.track === selectedTrack;
    const matchesStatus =
      selectedStatus === "all" || s.status === selectedStatus;
    return matchesSearch && matchesTrack && matchesStatus;
  });

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    inactive: students.filter((s) => s.status === "inactive").length,
    avgGPA: (
      students.reduce((acc, s) => acc + s.gpa, 0) / students.length
    ).toFixed(2),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-300/30";
      case "inactive":
        return "bg-amber-500/20 text-amber-700 border-amber-300/30";
      case "graduated":
        return "bg-blue-500/20 text-blue-700 border-blue-300/30";
      default:
        return "bg-muted/60";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28">
      <LecturerHeader />

      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Class Roster</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and view all enrolled students
                </p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.total}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-emerald-500/10 border-emerald-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {stats.active}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-amber-500/10 border-amber-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {stats.inactive}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-blue-500/10 border-blue-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Class GPA Avg</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.avgGPA}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-2">
                Search Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border/60 bg-muted/50 text-foreground focus:outline-none"
              >
                <option value="all">All Tracks</option>
                <option value="Advanced">Advanced</option>
                <option value="Standard">Standard</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border/60 bg-muted/50 text-foreground focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Student Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student, i) => (
            <motion.div
              key={student.id}
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <Card className="border-border/60 bg-card/70 backdrop-blur-lg hover:shadow-lg transition-shadow h-full">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {student.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {student.studentId}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${student.email}`}
                          className="text-primary hover:underline"
                        >
                          {student.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {student.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={getStatusColor(student.status)}
                      >
                        {student.status}
                      </Badge>
                      <Badge variant="secondary">{student.track}</Badge>
                      <Badge variant="outline">GPA: {student.gpa}</Badge>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-primary to-secondary"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
