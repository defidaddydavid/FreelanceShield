import { PrivyProvider } from '@privy-io/react-auth';
import { FC, ReactNode } from 'react';

interface PrivyConfigProps {
  children: ReactNode;
}

export const PrivyConfig: FC<PrivyConfigProps> = ({ children }) => {
  // Get Privy app ID from environment variables
  // Default to the known app ID if environment variable is not available
  const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cm9cvzk6c0006k40mcm6layou';
  
  console.log('Initializing Privy with App ID:', PRIVY_APP_ID);

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github'],
        appearance: {
          theme: 'light',
          accentColor: '#7C3AED', // Purple color for FreelanceShield
          logo: '/logo.svg', // Use the app logo
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Automatically create a wallet for new users
        },
        // Note: Solana chain configuration is handled separately in our wallet components
      }}
    >
      {children}
    </PrivyProvider>
  );
};
