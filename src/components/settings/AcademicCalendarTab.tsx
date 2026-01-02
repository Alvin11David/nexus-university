import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  Bell,
  ChevronLeft,
  ChevronRight,
  Flag,
  Star,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: "academic" | "exam" | "holiday" | "deadline" | "event";
  description?: string;
  important?: boolean;
}

const academicEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Semester 1 Begins",
    date: "2025-01-06",
    type: "academic",
    important: true,
  },
  {
    id: "2",
    title: "Late Registration Deadline",
    date: "2025-01-20",
    type: "deadline",
  },
  {
    id: "3",
    title: "Course Add/Drop Period Ends",
    date: "2025-01-27",
    type: "deadline",
  },
  { id: "4", title: "Martyrs Day", date: "2025-06-03", type: "holiday" },
  { id: "5", title: "Independence Day", date: "2025-10-09", type: "holiday" },
  {
    id: "6",
    title: "Mid-Semester Examinations",
    date: "2025-03-10",
    endDate: "2025-03-21",
    type: "exam",
    important: true,
  },
  {
    id: "7",
    title: "Easter Break",
    date: "2025-04-18",
    endDate: "2025-04-21",
    type: "holiday",
  },
  {
    id: "8",
    title: "End of Semester Examinations",
    date: "2025-05-19",
    endDate: "2025-06-06",
    type: "exam",
    important: true,
  },
  {
    id: "9",
    title: "Semester 1 Ends",
    date: "2025-06-06",
    type: "academic",
    important: true,
  },
  {
    id: "10",
    title: "Semester Break",
    date: "2025-06-07",
    endDate: "2025-08-03",
    type: "holiday",
  },
  {
    id: "11",
    title: "Semester 2 Begins",
    date: "2025-08-04",
    type: "academic",
    important: true,
  },
  {
    id: "12",
    title: "Graduation Ceremony",
    date: "2025-02-28",
    type: "event",
    important: true,
  },
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AcademicCalendarTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "academic":
        return "bg-primary/10 text-primary border-primary/20";
      case "exam":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "holiday":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "deadline":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "event":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getEventTypeDot = (type: string) => {
    switch (type) {
      case "academic":
        return "bg-primary";
      case "exam":
        return "bg-destructive";
      case "holiday":
        return "bg-emerald-500";
      case "deadline":
        return "bg-amber-500";
      case "event":
        return "bg-secondary";
      default:
        return "bg-muted-foreground";
    }
  };

  // Generate calendar grid
  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const getEventsForDate = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return academicEvents.filter((event) => {
      const eventStart = new Date(event.date);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      const currentDate = new Date(dateStr);
      return currentDate >= eventStart && currentDate <= eventEnd;
    });
  };

  const monthEvents = academicEvents.filter((event) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getMonth() === selectedMonth &&
      eventDate.getFullYear() === selectedYear
    );
  });

  const upcomingEvents = academicEvents
    .filter((event) => new Date(event.date) >= new Date())
    .slice(0, 5);

  const importantDates = academicEvents.filter((event) => event.important);

  const selectedDateEvents = selectedDate
    ? academicEvents.filter((event) => {
        const eventDate = new Date(event.date).toDateString();
        return eventDate === new Date(selectedDate).toDateString();
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-transparent to-accent/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Calendar className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Academic Calendar 2024/2025
                </h3>
                <p className="text-sm text-muted-foreground">
                  Key dates and academic events
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedMonth((m) => (m === 0 ? 11 : m - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-32 text-center font-semibold">
                {months[selectedMonth]} {selectedYear}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedMonth((m) => (m === 11 ? 0 : m + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { type: "academic", label: "Academic" },
          { type: "exam", label: "Examinations" },
          { type: "holiday", label: "Holidays" },
          { type: "deadline", label: "Deadlines" },
          { type: "event", label: "Events" },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${getEventTypeDot(item.type)}`}
            />
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-2 border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
                {months[selectedMonth]} {selectedYear}
              </CardTitle>
              <CardDescription>Click on dates to view events</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-sm text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const dayEvents = day ? getEventsForDate(day) : [];
                  const isSelected =
                    selectedDate ===
                    `${selectedYear}-${String(selectedMonth + 1).padStart(
                      2,
                      "0"
                    )}-${String(day).padStart(2, "0")}`;
                  const today = new Date();
                  const isToday =
                    day &&
                    today.getDate() === day &&
                    today.getMonth() === selectedMonth &&
                    today.getFullYear() === selectedYear;
                  const hasImportant = dayEvents.some((e) => e.important);

                  return (
                    <motion.button
                      key={idx}
                      whileHover={day ? { scale: 1.05 } : {}}
                      whileTap={day ? { scale: 0.95 } : {}}
                      onClick={() => {
                        if (day)
                          setSelectedDate(
                            `${selectedYear}-${String(
                              selectedMonth + 1
                            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                          );
                      }}
                      className={`aspect-square rounded-xl p-2 text-sm font-medium transition-all relative group ${
                        !day
                          ? "cursor-default"
                          : isToday
                          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg ring-2 ring-primary/50"
                          : isSelected
                          ? "bg-primary/20 border-2 border-primary text-primary"
                          : dayEvents.length > 0
                          ? "bg-gradient-to-br from-secondary/30 to-accent/20 border-2 border-secondary/40 text-foreground hover:border-secondary/60"
                          : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        <span className="text-base font-bold">{day}</span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-auto justify-center flex-wrap">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full ${getEventTypeDot(
                                  event.type
                                )} shadow-sm`}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs opacity-70 w-full">
                                +{dayEvents.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        {hasImportant && (
                          <Star className="h-3 w-3 absolute top-1 right-1 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected Date Details */}
              {selectedDateEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-border"
                >
                  <h4 className="font-semibold mb-3">
                    Events on{" "}
                    {new Date(selectedDate!).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h4>
                  <div className="space-y-2">
                    {selectedDateEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 rounded-lg border ${getEventTypeColor(
                          event.type
                        )}`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${getEventTypeDot(
                              event.type
                            )}`}
                          />
                          <span className="font-medium text-sm">
                            {event.title}
                          </span>
                          {event.important && (
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs mt-1 opacity-70">
                            {event.description}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card className="overflow-hidden border-2 border-secondary/20">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-secondary animate-bounce" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {upcomingEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all border border-transparent hover:border-primary/20"
                  >
                    <div
                      className={`h-3 w-3 rounded-full flex-shrink-0 ${getEventTypeDot(
                        event.type
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1">
                        {event.title}
                        {event.important && (
                          <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500/20 to-orange-500/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="h-4 w-4 text-amber-500" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {importantDates.slice(0, 6).map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <span className="truncate font-medium">{event.title}</span>
                    <Badge
                      variant="outline"
                      className="text-xs ml-2 flex-shrink-0 bg-white/50"
                    >
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Academic Year</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The current academic year runs from August 2024 to July
                    2025. Check important deadlines to avoid penalties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
