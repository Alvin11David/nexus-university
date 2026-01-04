import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Grid3x3, Plus, Edit2, Trash2, Eye, Copy } from "lucide-react";
import { LecturerHeader } from "@/components/layout/LecturerHeader";
import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RubricCriterion {
  id: string;
  name: string;
  maxPoints: number;
  levels: Array<{ name: string; points: number; description: string }>;
}

interface Rubric {
  id: string;
  name: string;
  course: string;
  assignment: string;
  totalPoints: number;
  criteria: RubricCriterion[];
  usedCount: number;
}

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

export default function LecturerRubrics() {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);

  const mockRubrics: Rubric[] = [
    {
      id: "1",
      name: "Essay Rubric",
      course: "CS101",
      assignment: "Research Paper",
      totalPoints: 100,
      criteria: [
        {
          id: "c1",
          name: "Content & Analysis",
          maxPoints: 40,
          levels: [
            {
              name: "Excellent",
              points: 40,
              description: "Comprehensive analysis with original insights",
            },
            {
              name: "Good",
              points: 32,
              description: "Solid analysis with some original thoughts",
            },
            {
              name: "Fair",
              points: 24,
              description: "Adequate coverage but lacks depth",
            },
            {
              name: "Poor",
              points: 12,
              description: "Minimal analysis, mostly summary",
            },
          ],
        },
        {
          id: "c2",
          name: "Organization & Structure",
          maxPoints: 30,
          levels: [
            {
              name: "Excellent",
              points: 30,
              description: "Logical flow, clear transitions",
            },
            {
              name: "Good",
              points: 24,
              description: "Generally well-organized",
            },
            {
              name: "Fair",
              points: 18,
              description: "Some organizational issues",
            },
            {
              name: "Poor",
              points: 9,
              description: "Disorganized, hard to follow",
            },
          ],
        },
        {
          id: "c3",
          name: "Writing Quality",
          maxPoints: 30,
          levels: [
            {
              name: "Excellent",
              points: 30,
              description: "Clear, concise, few errors",
            },
            {
              name: "Good",
              points: 24,
              description: "Generally clear with minor errors",
            },
            {
              name: "Fair",
              points: 18,
              description: "Multiple errors, some clarity issues",
            },
            {
              name: "Poor",
              points: 9,
              description: "Poor writing quality, many errors",
            },
          ],
        },
      ],
      usedCount: 24,
    },
    {
      id: "2",
      name: "Project Rubric",
      course: "CS101",
      assignment: "Capstone Project",
      totalPoints: 200,
      criteria: [
        {
          id: "c1",
          name: "Functionality",
          maxPoints: 80,
          levels: [
            {
              name: "Excellent",
              points: 80,
              description: "All requirements met perfectly",
            },
            { name: "Good", points: 64, description: "Most requirements met" },
            { name: "Fair", points: 48, description: "Basic requirements met" },
            {
              name: "Poor",
              points: 24,
              description: "Many requirements missing",
            },
          ],
        },
      ],
      usedCount: 8,
    },
  ];

  useEffect(() => {
    setRubrics(mockRubrics);
  }, []);

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
                <Grid3x3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Grading Rubrics</h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage assessment rubrics
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-primary to-secondary gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" /> New Rubric
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Rubrics</p>
                  <p className="text-2xl font-bold text-primary">
                    {rubrics.length}
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
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {rubrics.reduce((acc, r) => acc + r.usedCount, 0)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-blue-500/10 border-blue-300/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Avg Criteria</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {(
                      rubrics.reduce((acc, r) => acc + r.criteria.length, 0) /
                      rubrics.length
                    ).toFixed(1)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Rubrics List */}
        <div className="space-y-3">
          {rubrics.map((rubric, i) => (
            <motion.div
              key={rubric.id}
              variants={rise}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <Card className="border-border/60 bg-card/70 backdrop-blur-lg hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {rubric.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {rubric.assignment} • {rubric.course}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="gap-1">
                            {rubric.criteria.length} Criteria
                          </Badge>
                          <Badge variant="secondary">
                            {rubric.totalPoints} points
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/20 text-emerald-700 border-emerald-300/30"
                          >
                            Used {rubric.usedCount} times
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRubric(rubric)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Rubric Details */}
                    <div className="space-y-3 border-t border-border/60 pt-4">
                      {rubric.criteria.map((criterion) => (
                        <div
                          key={criterion.id}
                          className="rounded-lg bg-muted/20 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground">
                              {criterion.name}
                            </p>
                            <Badge variant="secondary">
                              {criterion.maxPoints} pts
                            </Badge>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 text-xs">
                            {criterion.levels.map((level) => (
                              <div
                                key={level.name}
                                className="flex items-center gap-2 p-2 rounded bg-muted/40"
                              >
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {level.name}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {level.points} pts
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Rubric Detail Modal */}
        {selectedRubric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRubric(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-2xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4">{selectedRubric.name}</h2>

              <div className="space-y-4">
                {selectedRubric.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="rounded-lg border border-border/60 p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{criterion.name}</h3>
                      <Badge>{criterion.maxPoints} pts</Badge>
                    </div>
                    <div className="space-y-2">
                      {criterion.levels.map((level) => (
                        <div
                          key={level.name}
                          className="flex justify-between items-start p-2 rounded bg-muted/30"
                        >
                          <div>
                            <p className="font-semibold">{level.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {level.description}
                            </p>
                          </div>
                          <span className="font-bold text-primary">
                            {level.points} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRubric(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      <LecturerBottomNav />
    </div>
  );
}
