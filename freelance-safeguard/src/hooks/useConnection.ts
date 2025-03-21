import { useEffect, useState } from 'react';
import { Connection } from '@solana/web3.js';
import { useWallet, useConnection as useSolanaConnection } from '@solana/wallet-adapter-react';
import { NETWORK_CONFIG } from '@/lib/solana/constants';

export const useConnection = () => {
  const { publicKey } = useWallet();
  const { connection: solanaConnection } = useSolanaConnection();
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    // Use the connection from Solana wallet adapter if available,
    // otherwise create a new connection to the Solana network
    if (solanaConnection) {
      setConnection(solanaConnection);
    } else {
      const newConnection = new Connection(NETWORK_CONFIG.endpoint, 'confirmed');
      setConnection(newConnection);
    }
  }, [solanaConnection]);

  return {
    connection: connection || solanaConnection,
    publicKey,
    networkConfig: NETWORK_CONFIG
  };
};
