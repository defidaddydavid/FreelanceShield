# FreelanceShield Frontend

The frontend application for FreelanceShield, a decentralized insurance protocol for the freelance economy.

## Overview

This React application provides the user interface for FreelanceShield, allowing users to:

- Browse and purchase insurance policies
- Submit and track claims
- Manage their freelance profile
- Participate in DAO governance

## Technology Stack

- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Privy**: Authentication integration (replacing Solana wallet adapter)
- **Vite**: Build tool
- **shadcn/ui**: Component library

## Deployment Strategy

The application uses a Git-based deployment strategy with Vercel:

- **Production (landing-page branch)**: Contains the "coming soon" page with waitlist signup
- **Preview (main branch)**: Contains the full app with Privy authentication

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev
```

### Environment Variables

The following environment variables are required:

```
# Supabase for waitlist storage
STORAGE_SUPABASE_URL=
STORAGE_SUPABASE_SERVICE_ROLE_KEY=

# Zoho for email notifications
ZOHO_USER=
ZOHO_PASSWORD=
ZOHO_PORT=465
ZOHO_SMTP_HOST=smtp.zoho.com

# Privy for authentication
NEXT_PUBLIC_PRIVY_APP_ID=
```

## Project Structure

```
src/
├── components/     # UI components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and libraries
├── pages/          # Page components
├── styles/         # Global styles
└── types/          # TypeScript type definitions
```

## Solana Integration

The application integrates with Solana through custom hooks:

- `useWallet`: Replacement for @solana/wallet-adapter-react's useWallet
- `useConnection`: Custom connection provider and hooks
- `useAnchorWallet`: Compatibility layer for Anchor integration

## Build and Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Waitlist API

The application includes a waitlist API that connects to Supabase to store email addresses from users signing up on the landing page. The implementation includes:

- Supabase connection for storing emails in a 'waitlist' table
- Email notifications using Zoho SMTP
