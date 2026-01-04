import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Download,
  Upload,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AttendanceRecord {
  id: string;
  studentName: string;
  courseCode: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("CS101");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchStudent, setSearchStudent] = useState("");

  // Mock data
  const mockRecords: AttendanceRecord[] = [
    {
      id: "1",
      studentName: "John Doe",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "present",
    },
    {
      id: "2",
      studentName: "Jane Smith",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "present",
    },
    {
      id: "3",
      studentName: "Mike Johnson",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "late",
      remarks: "Traffic",
    },
    {
      id: "4",
      studentName: "Sarah Williams",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "absent",
    },
    {
      id: "5",
      studentName: "Alex Brown",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "excused",
      remarks: "Medical",
    },
    {
      id: "6",
      studentName: "Emma Davis",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "present",
    },
    {
      id: "7",
      studentName: "Chris Miller",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "present",
    },
    {
      id: "8",
      studentName: "Lisa Wilson",
      courseCode: "CS101",
      date: "2025-01-03",
      status: "absent",
    },
  ];

  useEffect(() => {
    setRecords(mockRecords);
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.courseCode === selectedCourse &&
      r.date === selectedDate &&
      r.studentName.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const stats = {
    present: filteredRecords.filter((r) => r.status === "present").length,
    absent: filteredRecords.filter((r) => r.status === "absent").length,
    late: filteredRecords.filter((r) => r.status === "late").length,
    excused: filteredRecords.filter((r) => r.status === "excused").length,
  };

  const attendanceRate =
    Math.round(
      ((stats.present + stats.late + stats.excused) / filteredRecords.length) *
        100
    ) || 0;

  const handleStatusChange = (
    id: string,
    newStatus: "present" | "absent" | "late" | "excused"
  ) => {
    setRecords(
      records.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-emerald-500/20 text-emerald-700 border-emerald-300/30";
      case "absent":
        return "bg-red-500/20 text-red-700 border-red-300/30";
      case "late":
        return "bg-amber-500/20 text-amber-700 border-amber-300/30";
      case "excused":
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
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Attendance Management</h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage student attendance
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Import
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-emerald-500/10 border-emerald-300/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-emerald-700">
                    {stats.present}
                  </p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-red-500/10 border-red-300/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-red-700">
                    {stats.absent}
                  </p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-amber-500/10 border-amber-300/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-amber-700">
                    {stats.late}
                  </p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-blue-500/10 border-blue-300/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-700">
                    {stats.excused}
                  </p>
                  <p className="text-xs text-muted-foreground">Excused</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold text-primary">
                    {attendanceRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-4 items-end"
        >
          <div className="flex-1 min-w-64">
            <label className="text-sm font-medium block mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="CS101">CS101 - Algorithms</option>
              <option value="CS201">CS201 - Systems Design</option>
              <option value="CS301">CS301 - Data Mining</option>
            </select>
          </div>
          <div className="flex-1 min-w-64">
            <label className="text-sm font-medium block mb-2">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-64">
            <label className="text-sm font-medium block mb-2">
              Search Student
            </label>
            <Input
              placeholder="Type student name..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Attendance List */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>{filteredRecords.length} Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No records found
                </div>
              ) : (
                filteredRecords.map((record, i) => (
                  <motion.div
                    key={record.id}
                    variants={rise}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {record.studentName}
                      </p>
                      {record.remarks && (
                        <p className="text-xs text-muted-foreground">
                          Remarks: {record.remarks}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(["present", "absent", "late", "excused"] as const).map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusChange(record.id, status)
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                              record.status === status
                                ? getStatusColor(status)
                                : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted/60"
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-gradient-to-r from-primary to-secondary">
            Save Attendance
          </Button>
        </div>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
