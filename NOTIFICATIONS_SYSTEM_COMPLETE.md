# Grade Update Notifications System - Complete Implementation

## Overview

When a lecturer updates a student's grade in the Grade Book, the system automatically:

1. Saves the grade to the `student_grades` table
2. Creates a notification in the `notifications` table
3. Student receives the notification on their Alerts page
4. Student can view updated grades on the Results page

## System Flow

### 1. Lecturer Updates Grade

```
Lecturer → Grade Book Page → Changes Student Grade
     ↓
Input value changes → updateStudentGrade() function
     ↓
State updates immediately (instant UI feedback)
     ↓
Grade marked in changedGrades Set
     ↓
2-second debounce timer starts
```

### 2. Auto-Save (After 2-second debounce)

```
Debounce timeout fires → saveSingleStudentGrade(studentId)
     ↓
Upsert grade to Supabase student_grades table
     ↓
Call sendGradeUpdateNotification(student)
     ↓
Success: Remove from changedGrades, notify user
```

### 3. Notification Created

```
sendGradeUpdateNotification() inserts into notifications table:
{
  user_id: student.auth_id,
  type: "grade_update",
  title: "Grade Update Received",
  message: "Your grades for [Course Code] have been updated. Total: X%, Grade: Y",
  related_id: course_id,
  is_read: false,
  created_at: NOW()
}
```

### 4. Student Views Notifications

```
Student → Click "Alerts" on bottom nav
     ↓
Navigate to /student-notifications page
     ↓
StudentNotifications component loads all notifications
     ↓
Display with grade update icon (green checkmark)
     ↓
Student can: Mark as read, Delete, See timestamp
```

### 5. Student Views Updated Grades

```
Student → Click "Results"
     ↓
Results page loads
     ↓
Priority: student_grades table (new system)
Fallback: exam_results table (legacy)
     ↓
Display: Total %, Grade, GPA, Status
```

## Database Schema

### notifications Table

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',  -- 'grade_update', 'assignment', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,  -- course_id for grade updates
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, type, related_id, created_at)
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
```

## Code Components

### 1. LecturerGradeBook.tsx (src/pages/)

**New State Variable:**

```typescript
const [changedGrades, setChangedGrades] = useState<Set<string>>(new Set());
```

**Key Functions:**

#### updateStudentGrade(studentId, field, value)

- Updates grade immediately in UI
- Recalculates: total (weighted), letter grade, GPA, status
- Marks student in changedGrades set
- Sets 2-second debounce timeout for auto-save

#### saveSingleStudentGrade(studentId) ⭐ NEW

```typescript
// Upserts single student's grades to database
// Calls sendGradeUpdateNotification() automatically
// Removes from changedGrades on success
```

#### sendGradeUpdateNotification(student) ⭐ NEW

```typescript
// Inserts into notifications table with:
// - message: "Your grades for [Course] have been updated. Total: X%, Grade: Y"
// - type: 'grade_update'
// - is_read: false
// - related_id: course_id
```

#### saveAllGrades()

```typescript
// Batch save all changed grades
// Loops through changedGrades and sends notifications
// Clears changedGrades set on success
```

### 2. StudentNotifications.tsx ⭐ NEW (src/pages/)

**Features:**

- Lists all student notifications with timestamps
- Mark individual notifications as read
- Delete notifications
- Mark all as read
- Color-coded notification types (grade updates shown in green)
- Polls every 5 seconds for new notifications
- Mobile responsive with Tailwind breakpoints

**Key Functions:**

- `loadNotifications()` - Fetch from DB, count unread
- `markAsRead(id)` - Update is_read flag
- `deleteNotification(id)` - Remove from DB
- `markAllAsRead()` - Batch update is_read
- `formatTime(dateString)` - Convert to relative time (e.g., "5m ago")

### 3. Results.tsx (Updated)

**Modified loadResults() function:**

```typescript
// Priority: Try student_grades first (new system)
// Fallback: Use exam_results if unavailable (legacy)
// Normalize both data sources to same format
// marks: row.total || row.marks
// grade_point: row.gp || row.grade_point
```

### 4. StudentBottomNav.tsx (Updated)

```typescript
// Changed "Alerts" link from /notifications to /student-notifications
// Points to new StudentNotifications page
```

### 5. App.tsx (Updated)

**New Route:**

```typescript
<Route
  path="/student-notifications"
  element={
    <StudentRoute>
      <StudentNotifications />
    </StudentRoute>
  }
/>
```

## Grade Calculation Formula

Used in updateStudentGrade():

```
A1 Weight: 15%
A2 Weight: 15%
Midterm Weight: 25%
Participation Weight: 10%
Final Exam Weight: 35%

Total = (A1 * 0.15) + (A2 * 0.15) + (Mid * 0.25) + (Part * 0.10) + (Final * 0.35)
```

**Letter Grade Mapping:**

- 80-100: A
- 70-79: B
- 60-69: C
- 50-59: D
- 0-49: F

**GPA Calculation:**

- A: 4.0
- B: 3.0
- C: 2.0
- D: 1.0
- F: 0.0

## Testing Checklist

- [ ] Deploy notifications migration to Supabase
- [ ] Lecturer opens Grade Book, selects course with students
- [ ] Change a student's grade (e.g., assignment1: 85)
- [ ] Wait 2 seconds (debounce)
- [ ] Check Supabase: New row in student_grades table ✓
- [ ] Check Supabase: New row in notifications table ✓
- [ ] Verify message format correct ✓
- [ ] Log in as student
- [ ] Click Alerts → See notification with grade update ✓
- [ ] Click Results → See updated grade from student_grades table ✓
- [ ] Mark notification as read → UI updates ✓
- [ ] Delete notification → Gone from list ✓
- [ ] Mark all as read → All marked ✓
- [ ] Wait 5+ seconds → Notification list refreshes ✓

## Production Deployment Steps

1. **Deploy Notifications Table Migration**

   ```bash
   # In Supabase SQL Editor, run:
   -- From: supabase/migrations/20260106_create_notifications_table.sql
   ```

2. **Update Environment**

   - Ensure StudentNotifications.tsx is deployed
   - Ensure App.tsx routes are updated
   - Ensure StudentBottomNav.tsx links are updated

3. **Verify**
   - Test end-to-end flow as described in Testing Checklist
   - Monitor Supabase for any errors
   - Verify RLS policies allow notifications

## Future Enhancements

- [ ] Email notifications for grade updates (optional)
- [ ] In-app notification bell badge with unread count
- [ ] Notification categories/filtering
- [ ] Bulk notification actions
- [ ] Notification preferences (email, in-app, etc.)
- [ ] Assignment submission notifications
- [ ] Attendance notifications
- [ ] Course enrollment notifications

## Troubleshooting

**Issue: Notifications not appearing**

- Check Supabase notifications table has rows
- Verify user_id matches student's auth.users ID
- Check RLS policies allow SELECT for user

**Issue: Grades not saving**

- Check Supabase student_grades table
- Check lecturer has permission to update
- Check course enrollment exists for student

**Issue: Notification message truncated**

- Check message length (should fit in TEXT field)
- Verify course title is not too long

**Issue: Results page not showing grades**

- Check student_grades table has rows
- If not, check exam_results table (fallback)
- Verify course_id and student_id match
