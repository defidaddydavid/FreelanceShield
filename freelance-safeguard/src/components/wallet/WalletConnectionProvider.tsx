import React from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  CoinbaseWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { NETWORK_CONFIG } from "@/lib/solana/constants";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

interface WalletConnectionProviderProps {
  children: React.ReactNode;
}

export const WalletConnectionProvider: React.FC<WalletConnectionProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = NETWORK_CONFIG.network as WalletAdapterNetwork;

  // You can also provide a custom RPC endpoint
  const endpoint = NETWORK_CONFIG.endpoint || clusterApiUrl(network);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint} config={NETWORK_CONFIG.connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletConnectionProvider;
