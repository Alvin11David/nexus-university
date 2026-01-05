-- Archive student-related data before deletion so it can be recovered later.
-- This captures full row JSON for the main student-linked tables.

-- Archive tables -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.archived_profiles (
  archived_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  data JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT now(),
  deleted_by UUID
);
CREATE INDEX IF NOT EXISTS idx_archived_profiles_original ON public.archived_profiles(original_id);

CREATE TABLE IF NOT EXISTS public.archived_enrollments (
  archived_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  data JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT now(),
  deleted_by UUID
);
CREATE INDEX IF NOT EXISTS idx_archived_enrollments_original ON public.archived_enrollments(original_id);

CREATE TABLE IF NOT EXISTS public.archived_assignment_submissions (
  archived_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  data JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT now(),
  deleted_by UUID
);
CREATE INDEX IF NOT EXISTS idx_archived_assignment_submissions_original ON public.archived_assignment_submissions(original_id);

CREATE TABLE IF NOT EXISTS public.archived_messages (
  archived_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  data JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT now(),
  deleted_by UUID
);
CREATE INDEX IF NOT EXISTS idx_archived_messages_original ON public.archived_messages(original_id);

-- Helper to safely capture the acting user id (may be null in system deletes)
CREATE OR REPLACE FUNCTION public.archive_deleted_by()
RETURNS UUID LANGUAGE sql AS $$
  SELECT COALESCE(auth.uid(), NULL);
$$;

-- Archive functions and triggers -----------------------------------------
CREATE OR REPLACE FUNCTION public.archive_profiles_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.archived_profiles(original_id, data, deleted_by)
  VALUES (OLD.id, to_jsonb(OLD), public.archive_deleted_by());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.archive_enrollments_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.archived_enrollments(original_id, data, deleted_by)
  VALUES (OLD.id, to_jsonb(OLD), public.archive_deleted_by());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.archive_assignment_submissions_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.archived_assignment_submissions(original_id, data, deleted_by)
  VALUES (OLD.id, to_jsonb(OLD), public.archive_deleted_by());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.archive_messages_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.archived_messages(original_id, data, deleted_by)
  VALUES (OLD.id, to_jsonb(OLD), public.archive_deleted_by());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers (idempotent)
DROP TRIGGER IF EXISTS trg_archive_profiles_before_delete ON public.profiles;
CREATE TRIGGER trg_archive_profiles_before_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.archive_profiles_before_delete();

DROP TRIGGER IF EXISTS trg_archive_enrollments_before_delete ON public.enrollments;
CREATE TRIGGER trg_archive_enrollments_before_delete
  BEFORE DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.archive_enrollments_before_delete();

DROP TRIGGER IF EXISTS trg_archive_assignment_submissions_before_delete ON public.assignment_submissions;
CREATE TRIGGER trg_archive_assignment_submissions_before_delete
  BEFORE DELETE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.archive_assignment_submissions_before_delete();

DROP TRIGGER IF EXISTS trg_archive_messages_before_delete ON public.messages;
CREATE TRIGGER trg_archive_messages_before_delete
  BEFORE DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.archive_messages_before_delete();
