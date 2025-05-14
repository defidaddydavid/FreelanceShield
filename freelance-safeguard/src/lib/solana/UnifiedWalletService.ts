import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NETWORK_CONFIG } from './constants';
import { toast } from 'sonner';

export type WalletType = 'privy-embedded' | 'privy-external' | 'unknown';

export interface WalletInfo {
  address: string;
  publicKey: PublicKey;
  type: WalletType;
  balance: number;
  label?: string;
}

export interface WalletStatus {
  isConnected: boolean;
  isReady: boolean;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * UnifiedWalletService provides a consistent interface for wallet operations
 * regardless of the underlying wallet provider (Privy in this case)
 */
export class UnifiedWalletService {
  private connection: Connection;
  private walletInfo: WalletInfo | null = null;
  private status: WalletStatus = {
    isConnected: false,
    isReady: false,
    hasError: false,
  };

  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(
      NETWORK_CONFIG.endpoint,
      { commitment: NETWORK_CONFIG.connectionConfig.commitment as any }
    );
  }

  /**
   * Initialize wallet from Privy user data
   */
  public async initializeFromPrivyUser(user: any): Promise<boolean> {
    try {
      if (!user || !user.linkedAccounts) {
        this.resetWalletState();
        return false;
      }

      // Find Solana wallet in linked accounts
      const solanaWallet = user.linkedAccounts.find((account: any) => 
        account.type === 'wallet' && account.walletClientType === 'solana'
      );
      
      // If no Solana wallet, check for embedded wallet
      const embeddedWallet = user.linkedAccounts.find((account: any) => 
        account.type === 'wallet' && account.walletType === 'embedded-wallet'
      );
      
      // Use the first available wallet
      let walletAddress: string | null = null;
      let walletType: WalletType = 'unknown';
      
      if (solanaWallet) {
        walletAddress = solanaWallet.address;
        walletType = 'privy-external';
      } else if (embeddedWallet) {
        walletAddress = embeddedWallet.address;
        walletType = 'privy-embedded';
      }
      
      if (!walletAddress) {
        this.resetWalletState();
        return false;
      }
      
      // Create PublicKey from address
      const publicKey = new PublicKey(walletAddress);
      
      // Fetch initial balance
      const balance = await this.fetchBalance(publicKey);
      
      // Set wallet info
      this.walletInfo = {
        address: walletAddress,
        publicKey,
        type: walletType,
        balance,
        label: walletType === 'privy-embedded' ? 'Privy Embedded Wallet' : 'Connected Wallet'
      };
      
      // Update status
      this.status = {
        isConnected: true,
        isReady: true,
        hasError: false
      };
      
      return true;
    } catch (error) {
      console.error('Error initializing wallet from Privy user:', error);
      this.status = {
        isConnected: false,
        isReady: true,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error initializing wallet'
      };
      return false;
    }
  }

  /**
   * Reset wallet state
   */
  private resetWalletState(): void {
    this.walletInfo = null;
    this.status = {
      isConnected: false,
      isReady: true,
      hasError: false
    };
  }

  /**
   * Get wallet information
   */
  public getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  /**
   * Get wallet status
   */
  public getStatus(): WalletStatus {
    return this.status;
  }

  /**
   * Check if wallet is connected
   */
  public isConnected(): boolean {
    return this.status.isConnected && !!this.walletInfo;
  }

  /**
   * Fetch wallet balance
   */
  public async fetchBalance(publicKey?: PublicKey): Promise<number> {
    try {
      const keyToUse = publicKey || (this.walletInfo?.publicKey);
      
      if (!keyToUse) {
        throw new Error('No public key available to fetch balance');
      }
      
      const balance = await this.connection.getBalance(keyToUse);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      // Update wallet info if this is for the current wallet
      if (this.walletInfo && !publicKey) {
        this.walletInfo.balance = solBalance;
      }
      
      return solBalance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      toast.error('Failed to fetch wallet balance');
      throw error;
    }
  }

  /**
   * Request airdrop of SOL to the wallet (devnet only)
   */
  public async requestAirdrop(amount: number = 1): Promise<string> {
    try {
      if (!this.walletInfo?.publicKey) {
        throw new Error('No wallet connected');
      }
      
      const signature = await this.connection.requestAirdrop(
        this.walletInfo.publicKey,
        amount * LAMPORTS_PER_SOL
      );
      
      await this.connection.confirmTransaction(signature);
      
      // Update balance after airdrop
      await this.fetchBalance();
      
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      toast.error('Failed to request airdrop');
      throw error;
    }
  }

  /**
   * Get the Solana connection
   */
  public getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get the wallet address as string
   */
  public getAddress(): string | null {
    return this.walletInfo?.address || null;
  }

  /**
   * Get the wallet public key
   */
  public getPublicKey(): PublicKey | null {
    return this.walletInfo?.publicKey || null;
  }

  /**
   * Format address for display (shortened)
   */
  public formatAddress(address?: string): string {
    const addr = address || this.walletInfo?.address;
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }
}

// Export a singleton instance
export const walletService = new UnifiedWalletService();

export default walletService;
