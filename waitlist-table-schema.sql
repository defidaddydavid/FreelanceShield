-- SQL for creating the waitlist table in Supabase
CREATE TABLE public.waitlist (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  is_email_confirmed BOOLEAN DEFAULT false,
  confirmation_token TEXT,
  user_agent TEXT,
  ip_address TEXT
);

-- Add Row Level Security Policies
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all entries
CREATE POLICY "Authenticated users can view waitlist" 
ON public.waitlist
FOR SELECT 
TO authenticated
USING (true);

-- Allow anonymous users to insert entries
CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist
FOR INSERT 
TO anon
WITH CHECK (true);

-- Service roles have full access
CREATE POLICY "Service roles have full access" 
ON public.waitlist
USING (true)
WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX waitlist_email_idx ON public.waitlist (email);

-- Add comment for clarity
COMMENT ON TABLE public.waitlist IS 'Table to store waitlist signup information for FreelanceShield';
