import { useMemo, useState } from "react";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Flag, Layers, List } from "lucide-react";

const calendarData = {
  academicYear: "2025/2026",
  semesters: [
    {
      name: "Semester I",
      status: "Completed",
      events: [
        {
          title: "Change of Programme",
          start: "8 Jul 2025",
          end: "16 Aug 2025",
          status: "Close",
        },
        {
          title: "Administrative Change of Programme",
          start: "2 Aug 2025",
          end: "29 Nov 2025",
          status: "Close",
        },
        {
          title: "Enrollment",
          start: "3 Aug 2025",
          end: "5 Dec 2025",
          status: "Close",
        },
        {
          title: "Registration",
          start: "3 Aug 2025",
          end: "5 Dec 2025",
          status: "Close",
        },
        {
          title: "Graduation",
          start: "18 Aug 2025",
          end: "1 Jan 2026",
          status: "Close",
        },
        {
          title: "Course Evaluation",
          start: "4 Nov 2025",
          end: "12 Nov 2025",
          status: "Close",
        },
      ],
    },
    {
      name: "Semester II",
      status: "Current",
      events: [
        {
          title: "Registration",
          start: "5 Jan 2026",
          end: "23 May 2026",
          status: "Open",
        },
        {
          title: "Enrollment",
          start: "5 Jan 2026",
          end: "23 May 2026",
          status: "Open",
        },
      ],
    },
  ],
};

const statusStyles: Record<string, string> = {
  Open: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Close: "bg-amber-50 text-amber-800 border border-amber-200",
  Current:
    "bg-secondary/15 text-secondary-foreground border border-secondary/30",
  Completed: "bg-muted text-muted-foreground border border-border",
};

type StatusFilter = "All" | "Open" | "Close" | "Current" | "Completed";

export default function AcademicCalendar() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  const matchesFilter = (semesterStatus: string, eventStatus: string) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Current") return semesterStatus === "Current";
    if (statusFilter === "Completed") return semesterStatus === "Completed";
    return eventStatus === statusFilter;
  };

  const filteredSemesters = useMemo(
    () =>
      calendarData.semesters
        .map((semester) => ({
          ...semester,
          events: semester.events.filter((event) =>
            matchesFilter(semester.status, event.status)
          ),
        }))
        .filter((semester) => semester.events.length > 0),
    [statusFilter]
  );

  const timelineEvents = useMemo(() => {
    const parseDate = (value: string) => new Date(value);
    return calendarData.semesters
      .flatMap((semester) =>
        semester.events
          .filter((event) => matchesFilter(semester.status, event.status))
          .map((event) => ({
            ...event,
            semester: semester.name,
            semesterStatus: semester.status,
            startDate: parseDate(event.start),
            endDate: parseDate(event.end),
          }))
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24 md:pb-12">
      <StudentHeader />

      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="text-xs uppercase tracking-wide"
              >
                Academic Calendar
              </Badge>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">
                Academic Year {calendarData.academicYear}
              </h1>
              <p className="text-sm text-muted-foreground">
                Key academic activities and their windows for the current year.
              </p>
            </div>
            <Badge className="text-sm" variant="secondary">
              Updated Jan 2026
            </Badge>
          </header>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["All", "Open", "Close", "Current", "Completed"] as const).map(
                (status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={statusFilter === status ? "secondary" : "outline"}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "secondary" : "outline"}
                onClick={() => setViewMode("grid")}
              >
                <Layers className="h-4 w-4 mr-2" /> Cards
              </Button>
              <Button
                size="sm"
                variant={viewMode === "timeline" ? "secondary" : "outline"}
                onClick={() => setViewMode("timeline")}
              >
                <List className="h-4 w-4 mr-2" /> Timeline
              </Button>
            </div>
          </div>

          {viewMode === "timeline" ? (
            <Card className="border-border/70 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Timeline view</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chronological list of activities across semesters.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="p-6">
                <div className="relative pl-6 space-y-6">
                  <div
                    className="absolute left-2 top-0 bottom-0 w-px bg-border"
                    aria-hidden
                  />
                  {timelineEvents.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No events match this filter.
                    </p>
                  )}
                  {timelineEvents.map((event) => (
                    <div
                      key={`${event.semester}-${event.title}-${event.start}`}
                      className="relative rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm"
                    >
                      <div
                        className="absolute -left-[18px] top-4 h-3 w-3 rounded-full bg-secondary border-2 border-background"
                        aria-hidden
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5" />
                            <span>{event.semester}</span>
                          </p>
                          <p className="text-base font-semibold leading-tight">
                            {event.title}
                          </p>
                        </div>
                        <Badge className={statusStyles[event.status] || ""}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          <span>{event.start}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          to
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{event.end}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Semester status: {event.semesterStatus}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredSemesters.map((semester) => (
                <Card
                  key={semester.name}
                  className="border-border/70 shadow-lg backdrop-blur"
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-xl sm:text-2xl">
                          {semester.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Academic activities for {semester.name.toLowerCase()}.
                        </p>
                      </div>
                    </div>
                    <Badge className={statusStyles[semester.status] || ""}>
                      {semester.status}
                    </Badge>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-6 pt-5 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {semester.events.map((event) => (
                        <div
                          key={`${semester.name}-${event.title}-${event.start}`}
                          className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                                <Flag className="h-3.5 w-3.5" />
                                <span>{semester.name}</span>
                              </div>
                              <p className="text-base font-semibold leading-tight">
                                {event.title}
                              </p>
                            </div>
                            <Badge className={statusStyles[event.status] || ""}>
                              {event.status}
                            </Badge>
                          </div>

                          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4" />
                              <span>{event.start}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              to
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span>{event.end}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredSemesters.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    No events match this filter.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            (c) 2026 ACMIS. All rights reserved.
          </div>
        </div>
      </main>

      <StudentBottomNav />
    </div>
  );
}
