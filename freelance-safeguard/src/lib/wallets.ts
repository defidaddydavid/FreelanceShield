import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  GlowWalletAdapter,
  BackpackWalletAdapter,
  WalletAdapter
} from '@solana/wallet-adapter-wallets';

export const wallets: WalletAdapter[] = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new GlowWalletAdapter(),
  new BackpackWalletAdapter()
];
