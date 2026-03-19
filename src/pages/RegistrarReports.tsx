import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  ArrowLeft,
  Users,
  GraduationCap,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const reportCards = [
  {
    title: "Enrollment Trends",
    description: "Track enrollment volume by semester and program.",
    icon: Users,
  },
  {
    title: "Program Health",
    description: "Monitor active and paused programs at a glance.",
    icon: GraduationCap,
  },
  {
    title: "Transcript Throughput",
    description: "Review issuance and pending request turnaround.",
    icon: FileText,
  },
];

export default function RegistrarReports() {
  const navigate = useNavigate();
  const generatedAt = useMemo(() => new Date().toLocaleString(), []);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Registrar Module
            </p>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-secondary" />
              Reports
            </h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/registrar")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <p className="text-sm text-muted-foreground">
            This route is now wired and ready for analytics integrations.
            Generated placeholder snapshot at {generatedAt}.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {reportCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <card.icon className="h-5 w-5 text-secondary mb-3" />
              <h2 className="font-semibold mb-1">{card.title}</h2>
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
