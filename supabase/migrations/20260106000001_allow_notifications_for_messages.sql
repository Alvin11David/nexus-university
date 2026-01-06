-- Allow users to send notifications to others (for messaging system)
DROP POLICY IF EXISTS "Users can insert their notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users can create notifications for anyone (needed for messaging system)
    -- The application logic controls who can notify whom
    true
  );
