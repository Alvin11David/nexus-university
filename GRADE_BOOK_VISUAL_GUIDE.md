# Grade Book Visual Guide

## User Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Grade Book                                   │
│  Track and manage all student grades                             │
│                                                                   │
│  ┌──────────────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ Select Course ▼  │ │Save  │ │Export│ │Import│ │Choose│      │
│  │ CS101 - Intro    │ │ All  │ │      │ │      │ │ File │      │
│  └──────────────────┘ └──────┘ └──────┘ └──────┘ └──────┘      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Stats:                                                      │ │
│  │ • Class Average: 78.5                                      │ │
│  │ • Highest: 95  • Lowest: 62  • Excellent: 5  • Failing: 2 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Student                    A1  A2  Mid Part Final Tot Grade│ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ John Doe                                                    │ │
│  │ john@school.com           [80][85][88][90][92]  87.1  A-  │ │
│  │                                                              │ │
│  │ Sarah Smith                                                 │ │
│  │ sarah@school.com          [92][95][90][95][93]  92.6  A+  │ │
│  │                                                              │ │
│  │ Bob Johnson                                                 │ │
│  │ bob@school.com            [70][75][72][60][68]  70.0  C   │ │
│  │                                                              │ │
│  │ [Loading more students...]                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

[Brackets] = Editable input field
```

---

## Workflow Diagram

```
┌─────────────────────┐
│  Open Grade Book    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Select Course       │────────────────┐
└──────────┬──────────┘                │
           │                           │
           ▼                           │
┌──────────────────────────────────┐  │
│ Fetch Enrolled Students          │  │
│ + Load Their Grades              │  │
└──────────┬───────────────────────┘  │
           │                          │
           ▼                          │
┌──────────────────────────────────┐  │ No course?
│ Display Students in Table        │  │ (empty state)
└──────────┬───────────────────────┘  │
           │                          │
           ▼                          │
┌──────────────────────────────────┐  │
│ Edit Grade Cells                 │  │
│ (Click → Type → Tab)             │  │
└──────────┬───────────────────────┘  │
           │                          │
           ▼                          │
┌──────────────────────────────────┐  │
│ Auto-Calculate:                  │  │
│ • Total (weighted formula)       │  │
│ • Grade (A+, A, B+, etc)         │  │
│ • GP (0-4.0 scale)               │  │
└──────────┬───────────────────────┘  │
           │                          │
           ▼                          │
┌──────────────────────────────────┐  │
│ Click "Save All" Button          │  │
└──────────┬───────────────────────┘  │
           │                          │
           ▼                          │
┌──────────────────────────────────┐  │
│ Upsert to student_grades Table   │  │
│ (Create or Update Records)       │  │
└──────────┬───────────────────────┘  │
           │                          │
           ▼                          │
┌──────────────────────────────────┐  │
│ Show Success Message             │  │
│ "Grades saved successfully!"     │  │
└──────────┬───────────────────────┘  │
           │                          │
           ▼                          │
┌──────────────────────────────────┐  │
│ Refresh Student List             │  │
│ (Load from database)             │  │
└──────────────────────────────────┘  │
                                      │
                                      └─── Repeat or Export/Import
```

---

## Grade Calculation Example

### Student: John Doe

```
Input Components (out of 100):
  Assignment 1:    85
  Assignment 2:    90
  Midterm:         88
  Participation:   95
  Final Exam:      92

Weighted Calculation:
  85 × 0.15 = 12.75
  90 × 0.15 = 13.50
  88 × 0.25 = 22.00
  95 × 0.10 = 9.50
  92 × 0.35 = 32.20
                    ─────
  TOTAL:           90.45

Grade Conversion:
  90.45 → A- (Letter Grade)
  A- → 3.7 GP (Grade Point)

Database Save:
  INSERT INTO student_grades
  VALUES (student_id, course_id, ..., 85, 90, 88, 95, 92, 90.45, 'A-', 3.7, ...)
```

---

## CSV Import Format

### Input CSV Structure

```
Name,Email,A1,A2,Midterm,Participation,Final,Total,Grade,GP
Alice Johnson,alice@school.com,95,92,88,100,90,90.85,A-,3.7
Bob Smith,bob@school.com,78,82,85,75,80,81.0,B,3.0
Carol White,carol@school.com,88,85,92,90,89,89.0,A-,3.7
```

### Processing Flow

```
User clicks Import
    ↓
Selects CSV file
    ↓
System reads file
    ↓
For each row:
  1. Parse name, email, grades
  2. Find student by email (from current list)
  3. Update their grades in state
  4. Show matching count
    ↓
Show results table with updated grades
    ↓
Click "Save All" to persist to database
```

---

## CSV Export Format

### Output CSV Structure

```csv
Name,Email,Assignment 1,Assignment 2,Midterm,Participation,Final Exam,Total,Grade,GP
Alice Johnson,alice@school.com,95.00,92.00,88.00,100.00,90.00,90.85,A-,3.70
Bob Smith,bob@school.com,78.00,82.00,85.00,75.00,80.00,81.00,B,3.00
Carol White,carol@school.com,88.00,85.00,92.00,90.00,89.00,89.00,A-,3.70
```

---

## Database Schema Diagram

```
┌──────────────────────────────────────┐
│         student_grades               │
├──────────────────────────────────────┤
│ PK: id (UUID)                        │
│ FK: student_id (UUID)                │
│ FK: course_id (UUID)                 │
│ FK: lecturer_id (UUID)               │
│                                      │
│ Grades (0-100):                      │
│ • assignment1 DECIMAL(5,2)           │
│ • assignment2 DECIMAL(5,2)           │
│ • midterm DECIMAL(5,2)               │
│ • participation DECIMAL(5,2)         │
│ • final_exam DECIMAL(5,2)            │
│                                      │
│ Calculated Fields:                   │
│ • total DECIMAL(5,2)                 │
│ • grade VARCHAR(5)                   │
│ • gp DECIMAL(3,2)                    │
│                                      │
│ Metadata:                            │
│ • semester VARCHAR(20)               │
│ • academic_year VARCHAR(20)          │
│ • created_at TIMESTAMP               │
│ • updated_at TIMESTAMP               │
│                                      │
│ UNIQUE: (student_id, course_id,      │
│          semester, academic_year)    │
└──────────────────────────────────────┘
```

---

## State Management

```
Component State:
┌─────────────────────────────────┐
│ students: StudentGrade[]         │  ← All students with grades
├─────────────────────────────────┤
│ courses: Course[]                │  ← Lecturer's courses
├─────────────────────────────────┤
│ selectedCourse: string           │  ← Currently selected
├─────────────────────────────────┤
│ searchQuery: string              │  ← Search/filter
├─────────────────────────────────┤
│ sortBy: "name"|"total"|"grade"   │  ← Sort order
├─────────────────────────────────┤
│ loading: boolean                 │  ← Fetching state
├─────────────────────────────────┤
│ saving: boolean                  │  ← Saving state
└─────────────────────────────────┘

StudentGrade Interface:
┌─────────────────────────────────┐
│ id: string                       │
│ student_id: string               │
│ name: string                     │
│ email: string                    │
│ assignment1: number              │
│ assignment2: number              │
│ midterm: number                  │
│ participation: number            │
│ finalExam: number                │
│ total: number (calculated)       │
│ grade: string (calculated)       │
│ gp: number (calculated)          │
│ status: "excellent"|"good"|...   │
│ grade_id?: string (database ID)  │
└─────────────────────────────────┘
```

---

## Component Lifecycle

```
Mount
  ├─ useEffect([user])
  │   └─ fetchLecturerCourses()
  │
  └─ useEffect([selectedCourse])
      └─ fetchStudentsAndGrades()

User Interaction
  ├─ Select Course
  │   └─ setSelectedCourse()
  │   └─ Triggers useEffect
  │
  ├─ Edit Grade Cell
  │   └─ updateStudentGrade()
  │   └─ Recalculates total/grade/gp
  │   └─ Updates state immediately
  │
  ├─ Click Save All
  │   ├─ saveAllGrades()
  │   ├─ Upsert to database
  │   ├─ Show success/error
  │   └─ fetchStudentsAndGrades()
  │
  ├─ Click Export
  │   └─ handleExportGrades()
  │   └─ Downloads CSV file
  │
  └─ Click Import
      └─ handleImportGrades()
      ├─ Read CSV file
      ├─ Match students by email
      ├─ Update state
      └─ Ready for Save
```

---

## Error Handling Flow

```
Try Operation
    ↓
├─ Success
│   ├─ Update state
│   ├─ Show success message
│   └─ Proceed
│
└─ Error
    ├─ Log to console
    ├─ Show alert to user
    ├─ Describe what went wrong
    └─ User can retry
```

---

## UI State Examples

### Loading State

```
┌────────────────────────────────┐
│ Grade Book                      │
├────────────────────────────────┤
│                                 │
│   Loading students and grades..│
│                                 │
└────────────────────────────────┘
```

### Empty State (No Course Selected)

```
┌────────────────────────────────┐
│ Grade Book                      │
├────────────────────────────────┤
│ [Select Course ▼]              │
│                                 │
│ Please select a course          │
│                                 │
└────────────────────────────────┘
```

### Empty State (No Students)

```
┌────────────────────────────────┐
│ Grade Book                      │
├────────────────────────────────┤
│ [CS101 ▼]                      │
│                                 │
│ No enrolled students found      │
│                                 │
└────────────────────────────────┘
```

### Saving State

```
┌────────────────────────────────┐
│ Grade Book                      │
├────────────────────────────────┤
│ [CS101 ▼] [Saving... (disabled)] │
│                                 │
│ (table shown but Save button    │
│  is disabled while saving)      │
│                                 │
└────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────┐
│  Client (React) │
│   Grade Book    │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Supabase Client    │
│  (Authentication)   │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Database (PostgreSQL)       │
│                              │
│  RLS Policies:               │
│  ├─ Students can view own    │
│  ├─ Lecturers can manage     │
│  │  grades for their courses │
│  └─ Others: Denied           │
│                              │
│  student_grades table        │
└──────────────────────────────┘
```

---

## Performance Considerations

```
Optimizations Implemented:
├─ Indexes on:
│  ├─ student_id
│  ├─ course_id
│  ├─ lecturer_id
│
├─ Unique Constraint:
│  └─ Prevents duplicate records
│
├─ RLS Policies:
│  └─ Database-level security
│
└─ Client-Side:
   ├─ CSV operations (no server)
   ├─ Instant recalculation
   └─ State management for 100+ students

Estimated Limits:
├─ Support: 1000+ students per course
├─ Load Time: <2 seconds for 100 students
└─ Save Time: <1 second for 100 grades
```

---

**This visual guide helps understand the system architecture and user flows. For detailed implementation, see the technical documentation files.**
