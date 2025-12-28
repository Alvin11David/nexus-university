import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Search, Check, Plus, X, Loader2, GraduationCap, Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  department_id: string;
  description: string | null;
  instructor_id: string | null;
  semester: string | null;
  status: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function Registration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        supabase.from('courses').select('*').eq('status', 'published'),
        supabase.from('departments').select('*'),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data);
      if (deptsRes.data) setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async () => {
    if (!user || selectedCourses.length === 0) return;
    
    setSubmitting(true);
    try {
      const enrollments = selectedCourses.map(courseId => ({
        course_id: courseId,
        student_id: user.id,
        status: 'pending' as const,
      }));

      const { error } = await supabase.from('enrollments').insert(enrollments);
      
      if (error) throw error;
      
      toast({ 
        title: 'Registration Submitted!', 
        description: `You've registered for ${selectedCourses.length} course(s). Awaiting approval.` 
      });
      navigate('/enrollment');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || course.department_id === selectedDept;
    return matchesSearch && matchesDept;
  });

  const totalCredits = selectedCourses.reduce((acc, id) => {
    const course = courses.find(c => c.id === id);
    return acc + (course?.credits || 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      
      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <GraduationCap className="h-4 w-4" />
              <span>Academic Registration</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Course Selection</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Register for Courses
            </h1>
            <p className="text-muted-foreground">
              Select the courses you want to enroll in for the upcoming semester
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedDept} onValueChange={setSelectedDept}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Courses Grid */}
              <div className="grid gap-4">
                {filteredCourses.length === 0 ? (
                  <Card className="p-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No courses found</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                  </Card>
                ) : (
                  filteredCourses.map((course, i) => {
                    const isSelected = selectedCourses.includes(course.id);
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected ? 'ring-2 ring-secondary bg-secondary/5' : ''
                          }`}
                          onClick={() => toggleCourse(course.id)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {course.code}
                                  </Badge>
                                  <Badge className="bg-accent/10 text-accent hover:bg-accent/20 text-xs">
                                    {course.credits} Credits
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {course.description || 'No description available'}
                                </p>
                              </div>
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-secondary text-secondary-foreground' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {isSelected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Courses Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Selected Courses</span>
                      <Badge variant="secondary">{selectedCourses.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedCourses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No courses selected</p>
                        <p className="text-xs mt-1">Click on courses to add them</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {selectedCourses.map(id => {
                            const course = courses.find(c => c.id === id);
                            if (!course) return null;
                            return (
                              <motion.div
                                key={id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{course.title}</p>
                                  <p className="text-xs text-muted-foreground">{course.code} • {course.credits} cr</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCourse(id);
                                  }}
                                  className="h-7 w-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </motion.div>
                            );
                          })}
                        </div>

                        <div className="border-t pt-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Credits</span>
                            <span className="font-semibold">{totalCredits}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Courses</span>
                            <span className="font-semibold">{selectedCourses.length}</span>
                          </div>
                        </div>

                        <Button 
                          onClick={handleSubmit} 
                          disabled={submitting}
                          className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>Submit Registration</>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      
      <BottomNav />
    </div>
  );
}
