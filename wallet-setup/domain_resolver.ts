/**
 * FreelanceShield Domain Resolver
 * This helper utility resolves the freelanceshield.xyz Unstoppable Domain to Solana addresses
 */

import { Connection } from '@solana/web3.js';
import fetch from 'node-fetch';

// Unstoppable Domains Resolution API
const UD_API_ENDPOINT = 'https://resolve.unstoppabledomains.com/domains/';
const UD_API_KEY = process.env.UNSTOPPABLE_DOMAINS_API_KEY || '';

// Cache domain resolutions to reduce API calls
const resolutionCache: Record<string, {
  address: string,
  timestamp: number
}> = {};

// Cache expiration time (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;

/**
 * Resolves an Unstoppable Domain to a Solana address
 * @param domain The Unstoppable Domain (e.g., 'freelanceshield.xyz')
 * @param ticker The crypto ticker symbol (e.g., 'SOL', 'USDC')
 * @param connection Solana connection instance
 * @returns The resolved Solana address
 */
export async function resolveDomainToSolanaAddress(
  domain: string,
  ticker: string = 'SOL',
  connection?: Connection
): Promise<string> {
  const cacheKey = `${domain}:${ticker}`;
  
  // Check cache first
  if (
    resolutionCache[cacheKey] && 
    Date.now() - resolutionCache[cacheKey].timestamp < CACHE_EXPIRATION
  ) {
    return resolutionCache[cacheKey].address;
  }

  try {
    // API request headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (UD_API_KEY) {
      headers['Authorization'] = `Bearer ${UD_API_KEY}`;
    }

    // Fetch domain resolution from Unstoppable Domains API
    const response = await fetch(`${UD_API_ENDPOINT}${domain}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to resolve domain: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // For SPL tokens, we use the SOL address
    const cryptoKey = ticker === 'USDC' ? 'SOL' : ticker;
    
    // Get the crypto address from the response
    const address = data.records?.[`crypto.${cryptoKey.toLowerCase()}.address`];
    
    if (!address) {
      throw new Error(`No ${ticker} address found for ${domain}`);
    }
    
    // Validate the address if we have a Solana connection
    if (connection) {
      try {
        await connection.getAccountInfo(address);
      } catch (e) {
        console.warn(`Warning: Domain resolved to an invalid Solana address: ${address}`);
      }
    }
    
    // Cache the resolution
    resolutionCache[cacheKey] = {
      address,
      timestamp: Date.now()
    };
    
    return address;
  } catch (error) {
    console.error('Domain resolution error:', error);
    throw new Error(`Failed to resolve domain ${domain} to ${ticker} address`);
  }
}

/**
 * Gets the protocol treasury address
 * @param connection Solana connection instance
 * @returns The protocol treasury Solana address
 */
export async function getProtocolTreasuryAddress(connection?: Connection): Promise<string> {
  return resolveDomainToSolanaAddress('freelanceshield.xyz', 'SOL', connection);
}

/**
 * Gets the USDC payment address for the protocol
 * @param connection Solana connection instance
 * @returns The protocol USDC payment address
 */
export async function getProtocolUsdcAddress(connection?: Connection): Promise<string> {
  return resolveDomainToSolanaAddress('freelanceshield.xyz', 'USDC', connection);
}
