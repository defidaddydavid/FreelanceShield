# FreelanceShield Full Stack Setup Guide with Privy Integration

This guide details the steps to set up the FreelanceShield project, including the Dockerized Anchor smart contracts, Next.js frontend with Privy, and Vercel backend API.

## Prerequisites

*   Node.js (v20 or later recommended)
*   `pnpm` (Install via `npm install -g pnpm`)
*   Docker Desktop
*   A Privy account and App ID (Create at [dashboard.privy.io](https://dashboard.privy.io/))
*   (Optional but recommended) Vercel account for backend/frontend deployment.
*   (Optional) Ethos API Key if required by their API.
*   (Optional) Commercial font file for NT Brick Sans.

## 1. Project Setup (Monorepo)

Clone or create the main project directory and set up `pnpm` workspaces.

```bash
mkdir freelance-shield
cd freelance-shield

# Create pnpm-workspace.yaml
echo "packages:\n  - 'packages/*'" > pnpm-workspace.yaml

# Create root package.json (optional, but good practice)
pnpm init

# Create package directories
mkdir -p packages/contracts packages/frontend packages/backend
```

## 2. Smart Contracts (`packages/contracts`)

This package contains the Anchor smart contract and uses Docker for a consistent build environment.

**a. Place Dockerfile:**
   Copy the provided `Dockerfile.latest` (which uses the latest stable Solana/Anchor versions) into `packages/contracts/`.

**b. Build Docker Image:**
   Navigate to the `contracts` directory and build the image using the specific Dockerfile name.

   ```bash
   cd packages/contracts
   docker build -f Dockerfile.latest -t anchor-dev-env-latest .
   ```

**c. Initialize Anchor Project (inside Docker):**
   Run the Anchor init command within the Docker container using the new image. Mount the current directory.

   ```bash
   # Make sure you are in packages/contracts directory on your host machine
   docker run --rm -it -v "$(pwd):/home/user/app" anchor-dev-env-latest bash -c "anchor init freelance_shield"
   ```
   This creates the `freelance_shield` subdirectory with the standard Anchor structure.

**d. Place Contract Code:**
   Copy the `lib_updated.rs` file (provided previously) into the correct location:

   ```bash
   cp /path/to/your/lib_updated.rs packages/contracts/freelance_shield/programs/freelance_shield/src/lib.rs
   ```

**e. Build/Test (inside Docker):**
   Run build and test commands within the Docker container using the new image.

   ```bash
   # Build
   docker run --rm -it -v "$(pwd):/home/user/app" anchor-dev-env-latest bash -c "cd freelance_shield && anchor build"

   # --- Compatibility Check ---
   # The first time you run `anchor build` with the latest tools, it might fail if there are breaking changes
   # between Anchor versions. Check the compiler output for errors.
   # Common areas needing updates include Account macros, Context usage, CPI calls, or Event syntax.
   # Please report any errors encountered during this build step.
   # --------------------------

   # Test (after implementing tests based on tests_outline.ts and ensuring build succeeds)
   # docker run --rm -it -v "$(pwd):/home/user/app" anchor-dev-env-latest bash -c "cd freelance_shield && anchor test"
   ```

## 3. Frontend (`packages/frontend`)

This package contains the Next.js application.

**a. Create Next.js App:**
   Use the provided template command (run from the root `freelance-shield` directory).

   ```bash
   # Run from the root freelance-shield directory
   cd packages # Temporary cd for command context if needed
   create_nextjs_app frontend
   cd .. # Return to root
   ```

**b. Install Dependencies:**
   Navigate to the frontend directory and install Privy and fonts.

   ```bash
   cd packages/frontend
   pnpm install @privy-io/react-auth@latest
   pnpm install @fontsource/open-sans
   # If you have NT Brick Sans font files (e.g., woff2):
   # Place them in a `fonts` directory (e.g., packages/frontend/src/fonts)
   # You might need `next/font/local` to load them (see layout.tsx comments)
   cd ../.. # Return to root
   ```

**c. Configure Privy (`providers.tsx`):**
   Create `packages/frontend/src/app/providers.tsx` with the following content (replace `YOUR_PRIVY_APP_ID`):

   ```typescript
   // Content of packages/frontend/src/app/providers.tsx
   "use client";
   
   import { PrivyProvider } from "@privy-io/react-auth";
   import { solana, solanaDevnet } from "viem/chains";
   import { ReactNode } from "react";
   
   const supportedChains = [solana, solanaDevnet];
   
   export default function Providers({ children }: { children: ReactNode }) {
     return (
       <PrivyProvider
         appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "YOUR_PRIVY_APP_ID"} 
         config={{
           appearance: {
             theme: "light", 
             accentColor: "#676FFF", 
             logo: "/logo.png", // Replace with your logo path
           },
           loginMethods: ["email", "google", "github"],
           embeddedWallets: {
             createOnLogin: "users-without-wallets",
             requireUserPasswordOnCreate: false,
           },
           defaultChain: solana, 
           supportedChains: supportedChains,
         }}
       >
         {children}
       </PrivyProvider>
     );
   }
   ```

**d. Update Root Layout (`layout.tsx`):**
   Modify `packages/frontend/src/app/layout.tsx` to use the `Providers` component and configure fonts:

   ```typescript
   // Content of packages/frontend/src/app/layout.tsx
   "use client";
   
   import type { Metadata } from "next";
   import { Open_Sans } from "next/font/google";
   import "./globals.css";
   import Providers from "./providers";
   import "@fontsource/open-sans";
   // import localFont from 'next/font/local'; // Uncomment if using local font files
   
   const openSans = Open_Sans({
     variable: "--font-open-sans",
     subsets: ["latin"],
     display: "swap",
   });
   
   // TODO: Load NT Brick Sans (commercial font)
   // const ntBrickSans = localFont({ src: '../fonts/NTBrickSans-Regular.woff2', variable: '--font-nt-brick-sans' });
   
   // export const metadata: Metadata = { ... }; // Optional
   
   export default function RootLayout({
     children,
   }: Readonly<{
     children: React.ReactNode;
   }>) {
     return (
       <html lang="en" className="dark" suppressHydrationWarning>
         {/* Add ntBrickSans.variable when available */}
         <body className={`${openSans.variable} font-sans antialiased`}>
           <Providers>{children}</Providers>
         </body>
       </html>
     );
   }
   ```

**e. Update Tailwind Config (`tailwind.config.ts`):**
   Add the font variables to your Tailwind config:

   ```typescript
   // packages/frontend/tailwind.config.ts
   import type { Config } from "tailwindcss";
   
   const config: Config = {
     darkMode: "class", // Ensure dark mode is enabled via class
     content: [
       "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: {
       extend: {
         fontFamily: {
           sans: ["var(--font-open-sans)", "sans-serif"], // Body font
           heading: ["var(--font-nt-brick-sans)", "sans-serif"], // Heading font (add when available)
         },
         // Add other theme customizations (colors, etc.)
       },
     },
     plugins: [],
   };
   export default config;
   ```

**f. Create Example Component (`PolicyForm.tsx`):**
   Create `packages/frontend/src/components/PolicyForm.tsx` with the code provided previously.

**g. Update Main Page (`page.tsx`):**
   Modify `packages/frontend/src/app/page.tsx` to include the login button and the `PolicyForm` component, as shown previously.

**h. Environment Variables:**
   Create a `.env.local` file in `packages/frontend/`:

   ```
   NEXT_PUBLIC_PRIVY_APP_ID=YOUR_PRIVY_APP_ID
   # Optional: Specify Solana RPC URL if not using Privy's default
   # NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com 
   ```

## 4. Backend (`packages/backend`)

This package contains the Vercel Serverless Function for premium calculation.

**a. Initialize and Install Dependencies:**

   ```bash
   cd packages/backend
   pnpm init
   pnpm install axios @vercel/node
   # Install typescript and types if not already present globally or in workspace
   # pnpm add -D typescript @types/node @types/react 
   cd ../.. # Return to root
   ```

**b. Create API Route (`calculate-premium.ts`):**
   Create `packages/backend/api/calculate-premium.ts` with the code provided previously.

**c. Vercel Deployment:**
   This structure is ready for Vercel. Connect your Git repository to Vercel. Vercel should automatically detect the Next.js app (`packages/frontend`) and the API routes (`packages/backend/api`). Configure the root directory in Vercel settings if necessary.

## 5. Running the Project

*   **Frontend:** `cd packages/frontend && pnpm dev`
*   **Backend (Vercel Dev):** `cd packages/backend && vercel dev` (requires Vercel CLI)
*   **Contracts:** Use Docker commands as shown in Step 2.

## 6. Next Steps

*   Replace placeholder values (Privy App ID, logo path, Ethos API Key/URL, contract interaction logic).
*   Implement the actual smart contract interaction logic in `PolicyForm.tsx` using Privy's wallet hooks (`useWallet`, `signTransaction`, `sendTransaction`).
*   Implement comprehensive tests for contracts and frontend components.
*   Refine UI/UX, error handling, and loading states.
*   Secure the backend API (e.g., rate limiting, input validation).
*   Configure production environment variables on Vercel.

