-- Test inserting a record into the waitlist table
-- This simulates what happens when a user signs up through your form

INSERT INTO waitlist (email, source, tags)
VALUES ('test@example.com', 'sql_test', ARRAY['test', 'development'])
RETURNING *;

-- View all records in the waitlist table
SELECT * FROM waitlist;
