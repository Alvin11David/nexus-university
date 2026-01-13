-- Enable RLS and create policies for quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY \
Lecturers
can
view
own
quizzes\ ON quizzes FOR SELECT USING (lecturer_id = auth.uid());
CREATE POLICY \
Lecturers
can
create
quizzes\ ON quizzes FOR INSERT WITH CHECK (lecturer_id = auth.uid());
CREATE POLICY \
Lecturers
can
update
own
quizzes\ ON quizzes FOR UPDATE USING (lecturer_id = auth.uid()) WITH CHECK (lecturer_id = auth.uid());
CREATE POLICY \
Lecturers
can
delete
own
quizzes\ ON quizzes FOR DELETE USING (lecturer_id = auth.uid());
CREATE POLICY \
Students
can
view
active
quizzes\ ON quizzes FOR SELECT USING (status = 'active');
