-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their received messages" ON public.messages;

-- Create new, corrected RLS policies for messages
CREATE POLICY "Users can view their sent messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid());

CREATE POLICY "Users can view their received messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (to_user_id = auth.uid());
