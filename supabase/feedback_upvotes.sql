-- Table to track who upvoted which feedback (one vote per user per feedback)
CREATE TABLE IF NOT EXISTS feedback_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- Enable RLS
ALTER TABLE feedback_upvotes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own upvotes
CREATE POLICY "Users can insert own upvotes"
  ON feedback_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to see all upvotes
CREATE POLICY "Anyone can view upvotes"
  ON feedback_upvotes FOR SELECT
  USING (true);

-- Allow users to remove own upvotes
CREATE POLICY "Users can delete own upvotes"
  ON feedback_upvotes FOR DELETE
  USING (auth.uid() = user_id);
