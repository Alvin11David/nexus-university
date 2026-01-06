-- Announcement views tracking
CREATE TABLE public.announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(announcement_id, student_id)
);

-- Announcement likes/reactions
CREATE TABLE public.announcement_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(announcement_id, student_id)
);

-- Announcement comments
CREATE TABLE public.announcement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS Policies for announcement_views
CREATE POLICY "Students can view their own views"
  ON public.announcement_views FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can insert views"
  ON public.announcement_views FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- RLS Policies for announcement_likes
CREATE POLICY "Users can view announcement likes"
  ON public.announcement_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can insert likes"
  ON public.announcement_likes FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete their own likes"
  ON public.announcement_likes FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- RLS Policies for announcement_comments
CREATE POLICY "Users can view comments"
  ON public.announcement_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can insert comments"
  ON public.announcement_comments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete their own comments"
  ON public.announcement_comments FOR DELETE
  TO authenticated
  USING (student_id = auth.uid());

-- Enable RLS
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;
