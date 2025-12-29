import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, BookOpen, GraduationCap, Clock, Bell,
  ChevronLeft, ChevronRight, Flag, Star, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'academic' | 'exam' | 'holiday' | 'deadline' | 'event';
  description?: string;
  important?: boolean;
}

const academicEvents: CalendarEvent[] = [
  { id: '1', title: 'Semester 1 Begins', date: '2025-01-06', type: 'academic', important: true },
  { id: '2', title: 'Late Registration Deadline', date: '2025-01-20', type: 'deadline' },
  { id: '3', title: 'Course Add/Drop Period Ends', date: '2025-01-27', type: 'deadline' },
  { id: '4', title: 'Martyrs Day', date: '2025-06-03', type: 'holiday' },
  { id: '5', title: 'Independence Day', date: '2025-10-09', type: 'holiday' },
  { id: '6', title: 'Mid-Semester Examinations', date: '2025-03-10', endDate: '2025-03-21', type: 'exam', important: true },
  { id: '7', title: 'Easter Break', date: '2025-04-18', endDate: '2025-04-21', type: 'holiday' },
  { id: '8', title: 'End of Semester Examinations', date: '2025-05-19', endDate: '2025-06-06', type: 'exam', important: true },
  { id: '9', title: 'Semester 1 Ends', date: '2025-06-06', type: 'academic', important: true },
  { id: '10', title: 'Semester Break', date: '2025-06-07', endDate: '2025-08-03', type: 'holiday' },
  { id: '11', title: 'Semester 2 Begins', date: '2025-08-04', type: 'academic', important: true },
  { id: '12', title: 'Graduation Ceremony', date: '2025-02-28', type: 'event', important: true },
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function AcademicCalendarTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(2025);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-primary/10 text-primary border-primary/20';
      case 'exam': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'holiday': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'deadline': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'event': return 'bg-secondary/10 text-secondary border-secondary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEventTypeDot = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-primary';
      case 'exam': return 'bg-destructive';
      case 'holiday': return 'bg-emerald-500';
      case 'deadline': return 'bg-amber-500';
      case 'event': return 'bg-secondary';
      default: return 'bg-muted-foreground';
    }
  };

  const monthEvents = academicEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
  });

  const upcomingEvents = academicEvents
    .filter(event => new Date(event.date) >= new Date())
    .slice(0, 5);

  const importantDates = academicEvents.filter(event => event.important);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Calendar className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Academic Calendar 2024/2025</h3>
                <p className="text-sm text-muted-foreground">Key dates and academic events</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-32 text-center font-semibold">
                {months[selectedMonth]} {selectedYear}
              </div>
              <Button variant="outline" size="icon" onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { type: 'academic', label: 'Academic' },
          { type: 'exam', label: 'Examinations' },
          { type: 'holiday', label: 'Holidays' },
          { type: 'deadline', label: 'Deadlines' },
          { type: 'event', label: 'Events' },
        ].map(item => (
          <div key={item.type} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getEventTypeDot(item.type)}`} />
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Events in {months[selectedMonth]}</CardTitle>
              <CardDescription>{monthEvents.length} events this month</CardDescription>
            </CardHeader>
            <CardContent>
              {monthEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No events this month</h3>
                  <p className="text-muted-foreground">Check other months for academic events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {monthEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-start gap-4 p-4 rounded-xl border ${getEventTypeColor(event.type)}`}
                    >
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        event.type === 'exam' ? 'bg-destructive/20' :
                        event.type === 'holiday' ? 'bg-emerald-500/20' :
                        event.type === 'deadline' ? 'bg-amber-500/20' :
                        'bg-primary/20'
                      }`}>
                        <span className="text-lg font-bold">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{event.title}</h4>
                          {event.important && (
                            <Star className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm opacity-80">
                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </p>
                        {event.description && (
                          <p className="text-sm mt-1 opacity-70">{event.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-secondary" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`h-2 w-2 rounded-full ${getEventTypeDot(event.type)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Flag className="h-4 w-4 text-amber-500" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {importantDates.slice(0, 6).map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{event.title}</span>
                    <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Academic Year</h4>
                  <p className="text-xs text-muted-foreground">
                    The current academic year runs from August 2024 to July 2025. Check important deadlines to avoid penalties.
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
