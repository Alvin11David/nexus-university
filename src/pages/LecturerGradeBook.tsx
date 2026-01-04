import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Download,
  Upload,
  Filter,
  Search,
  TrendingUp,
  Award,
  AlertCircle,
} from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StudentGrade {
  id: string;
  name: string;
  email: string;
  assignment1: number;
  assignment2: number;
  midterm: number;
  participation: number;
  finalExam: number;
  total: number;
  grade: string;
  gp: number;
  status: "excellent" | "good" | "average" | "warning" | "failing";
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

const calculateGrade = (total: number) => {
  if (total >= 90) return { grade: "A", gp: 4.0 };
  if (total >= 80) return { grade: "B+", gp: 3.3 };
  if (total >= 70) return { grade: "B", gp: 3.0 };
  if (total >= 60) return { grade: "C", gp: 2.0 };
  if (total >= 50) return { grade: "D", gp: 1.0 };
  return { grade: "F", gp: 0 };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "excellent":
      return "bg-emerald-500/20 text-emerald-700 border-emerald-300/30";
    case "good":
      return "bg-blue-500/20 text-blue-700 border-blue-300/30";
    case "average":
      return "bg-amber-500/20 text-amber-700 border-amber-300/30";
    case "warning":
      return "bg-orange-500/20 text-orange-700 border-orange-300/30";
    case "failing":
      return "bg-red-500/20 text-red-700 border-red-300/30";
    default:
      return "bg-muted/60";
  }
};

export default function LecturerGradeBook() {
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("CS101");
  const [sortBy, setSortBy] = useState<"name" | "total" | "grade">("name");
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const mockStudents: StudentGrade[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@uni.edu",
      assignment1: 85,
      assignment2: 90,
      midterm: 88,
      participation: 92,
      finalExam: 87,
      total: 88.4,
      grade: "A",
      gp: 4.0,
      status: "excellent",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@uni.edu",
      assignment1: 78,
      assignment2: 82,
      midterm: 79,
      participation: 85,
      finalExam: 81,
      total: 81,
      grade: "B+",
      gp: 3.3,
      status: "good",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@uni.edu",
      assignment1: 72,
      assignment2: 75,
      midterm: 71,
      participation: 78,
      finalExam: 73,
      total: 73.8,
      grade: "B",
      gp: 3.0,
      status: "average",
    },
    {
      id: "4",
      name: "Sarah Williams",
      email: "sarah@uni.edu",
      assignment1: 68,
      assignment2: 65,
      midterm: 62,
      participation: 70,
      finalExam: 64,
      total: 65.8,
      grade: "C",
      gp: 2.0,
      status: "warning",
    },
    {
      id: "5",
      name: "Alex Brown",
      email: "alex@uni.edu",
      assignment1: 92,
      assignment2: 95,
      midterm: 94,
      participation: 96,
      finalExam: 93,
      total: 94,
      grade: "A",
      gp: 4.0,
      status: "excellent",
    },
    {
      id: "6",
      name: "Emma Davis",
      email: "emma@uni.edu",
      assignment1: 55,
      assignment2: 58,
      midterm: 52,
      participation: 60,
      finalExam: 56,
      total: 56.2,
      grade: "D",
      gp: 1.0,
      status: "failing",
    },
  ];

  useEffect(() => {
    setStudents(mockStudents);
  }, []);

  const filteredStudents = students
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "total") return b.total - a.total;
      return b.gp - a.gp;
    });

  const stats = {
    classAverage: (
      students.reduce((acc, s) => acc + s.total, 0) / students.length
    ).toFixed(1),
    highestScore: Math.max(...students.map((s) => s.total)),
    lowestScore: Math.min(...students.map((s) => s.total)),
    excellentCount: students.filter((s) => s.status === "excellent").length,
    failingCount: students.filter((s) => s.status === "failing").length,
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
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Grade Book</h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage all student grades
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button className="bg-gradient-to-r from-primary to-secondary gap-2">
                <Upload className="h-4 w-4" /> Import
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Class Average</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.classAverage}%
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
                  <p className="text-sm text-muted-foreground">Highest Score</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {stats.highestScore}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-red-500/10 border-red-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Lowest Score</p>
                  <p className="text-2xl font-bold text-red-700">
                    {stats.lowestScore}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-emerald-500/10 border-emerald-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Excellent (A)</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {stats.excellentCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-red-500/10 border-red-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Failing (F)</p>
                  <p className="text-2xl font-bold text-red-700">
                    {stats.failingCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-border/60 bg-muted/50 text-foreground focus:outline-none"
              >
                <option value="name">Sort by Name</option>
                <option value="total">Sort by Score</option>
                <option value="grade">Sort by Grade</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Grade Table */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
          <CardHeader>
            <CardTitle>{filteredStudents.length} Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-4 py-3 text-left font-semibold">
                      Student
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">A1</th>
                    <th className="px-3 py-3 text-center font-semibold">A2</th>
                    <th className="px-3 py-3 text-center font-semibold">Mid</th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Part
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Final
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Total
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Grade
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">GP</th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, i) => (
                    <motion.tr
                      key={student.id}
                      variants={rise}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {student.name}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {student.assignment1}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {student.assignment2}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {student.midterm}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {student.participation}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {student.finalExam}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-primary">
                        {student.total.toFixed(1)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge className="bg-primary/20 text-primary">
                          {student.grade}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
                        {student.gp.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card className="border-border/60 bg-card/70 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Grade Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  grade: "A",
                  count: students.filter((s) => s.gp >= 3.7).length,
                  color: "bg-emerald-500",
                },
                {
                  grade: "B+",
                  count: students.filter((s) => s.gp >= 3.0 && s.gp < 3.7)
                    .length,
                  color: "bg-blue-500",
                },
                {
                  grade: "B",
                  count: students.filter((s) => s.gp >= 2.0 && s.gp < 3.0)
                    .length,
                  color: "bg-amber-500",
                },
                {
                  grade: "C",
                  count: students.filter((s) => s.gp >= 1.0 && s.gp < 2.0)
                    .length,
                  color: "bg-orange-500",
                },
                {
                  grade: "F",
                  count: students.filter((s) => s.gp < 1.0).length,
                  color: "bg-red-500",
                },
              ].map((item) => (
                <div key={item.grade} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{item.grade}</span>
                    <span className="text-muted-foreground">
                      {item.count} students
                    </span>
                  </div>
                  <div className="h-3 bg-muted/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(item.count / students.length) * 100}%`,
                      }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <LecturerBottomNav />
    </div>
  );
}
