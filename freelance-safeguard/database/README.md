# FreelanceShield Database Integration

This directory contains database setup scripts for the FreelanceShield project's off-chain components. While the core protocol functionality is implemented as Solana smart contracts, we use Supabase for:

1. Waitlist management
2. Email notifications
3. User feedback collection

## Setup Instructions

### 1. Run the Schema Setup Script

Log in to your Supabase dashboard and run the `schema-setup.sql` script in the SQL Editor. This will:

- Create the waitlist table with proper structure
- Enable Row Level Security (RLS)
- Set up appropriate access policies

### 2. Configure Environment Variables

Make sure these environment variables are set in your Vercel project:

```
SUPABASE_URL=https://ymsimbeqrvupvmujzrrd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.ymsimbeqrvupvmujzrrd:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
ZOHO_USER=get@freelanceshield.xyz
ZOHO_PASS=your-zoho-password
```

### 3. Security Model

The database uses Postgres Row Level Security (RLS) with the following policies:

- **Anonymous users**: Can only insert new waitlist entries
- **Authenticated users**: Can view waitlist entries
- **Service role**: Has full access to manage waitlist entries

## Database Schema

### Waitlist Table

| Column      | Type      | Description                      |
|-------------|-----------|----------------------------------|
| id          | UUID      | Primary key                      |
| email       | TEXT      | User's email (unique)            |
| created_at  | TIMESTAMP | Signup timestamp                 |
| source      | TEXT      | Where the signup came from       |
| is_contacted| BOOLEAN   | Whether user has been contacted  |
| contact_date| TIMESTAMP | When user was last contacted     |
| notes       | TEXT      | Admin notes about the user       |
| tags        | TEXT[]    | Tags for categorizing users      |

## Integration with Solana

This database is designed to complement the on-chain FreelanceShield protocol, not replace it. All core protocol functionality (risk pools, staking, claims processing, etc.) will be handled by Solana smart contracts.

The waitlist system serves as a pre-launch marketing tool and will help build our initial user base before the protocol is fully deployed on Solana mainnet.
