-- Add instruction_document_url and instruction_document_name columns to assignments table
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS instruction_document_url TEXT,
ADD COLUMN IF NOT EXISTS instruction_document_name TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN public.assignments.instruction_document_url IS 'URL to the instruction document (e.g., Word doc) stored in Supabase Storage';
COMMENT ON COLUMN public.assignments.instruction_document_name IS 'Original filename of the uploaded instruction document';
