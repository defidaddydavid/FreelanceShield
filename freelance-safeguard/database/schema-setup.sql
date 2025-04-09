-- FreelanceShield Database Schema Setup
-- This script creates the waitlist table and security policies for the FreelanceShield application

-- Create waitlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    source TEXT DEFAULT 'website',
    is_contacted BOOLEAN DEFAULT FALSE,
    contact_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tags TEXT[]
);

-- Create a unique index on email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique_idx ON waitlist(email);

-- Add a comment to the table for documentation
COMMENT ON TABLE waitlist IS 'Waitlist entries for FreelanceShield - blockchain-based freelance insurance protocol';

-- Enable Row Level Security on the waitlist table
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users to insert new waitlist entries (for public signup form)
CREATE POLICY "Anonymous users can insert waitlist entries"
ON waitlist
FOR INSERT
TO anon
WITH CHECK (true);

-- Create a policy that allows authenticated users to view waitlist entries
CREATE POLICY "Authenticated users can view waitlist entries"
ON waitlist
FOR SELECT
TO authenticated
USING (true);

-- Create a policy that allows only authenticated service role to update waitlist entries
CREATE POLICY "Service role can update waitlist entries"
ON waitlist
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Create a policy that allows only authenticated service role to delete waitlist entries
CREATE POLICY "Service role can delete waitlist entries"
ON waitlist
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT auth.jwt() ->> 'role' = 'service_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy that allows admins to view all waitlist entries
CREATE POLICY "Admins can view all waitlist entries"
ON waitlist
FOR ALL
TO authenticated
USING (is_admin());
