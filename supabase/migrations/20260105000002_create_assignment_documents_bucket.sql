-- Create storage bucket for assignment instruction documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-documents',
  'assignment-documents',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (lecturers) to upload files
CREATE POLICY "Lecturers can upload assignment documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users (lecturers) to update their own files
CREATE POLICY "Lecturers can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users (lecturers) to delete their own files
CREATE POLICY "Lecturers can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access (students can download)
CREATE POLICY "Anyone can view assignment documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assignment-documents');
