import db from '../lib/db.js';
import { getRpcUrl, isNetworkSupported } from '../lib/networks.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenAddress, chainId } = req.body;

  if (!tokenAddress) {
    return res.status(400).json({ 
      isValid: false, 
      error: 'Token address is required' 
    });
  }
  
  // Check if network is supported
  if (chainId && !isNetworkSupported(chainId)) {
    return res.status(400).json({
      isValid: false,
      error: 'Unsupported network. Please switch to Optimism, Arbitrum, Base, Scroll, Mantle, or Monad Testnet.'
    });
  }

  try {
    console.log('[API] Validating token:', tokenAddress);
    console.log('[API] Chain ID:', chainId);
    
    // Use dynamic RPC based on chain ID, fallback to env RPC
    const rpcUrl = chainId ? getRpcUrl(chainId) : process.env.RPC_URL;
    console.log('[API] Using RPC URL:', rpcUrl);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Validation timeout after 30 seconds')), 30000)
    );
    
    const validation = await Promise.race([
      db.validateTokenContract(tokenAddress, chainId, rpcUrl),
      timeoutPromise
    ]);
    
    if (validation.isValid) {
      console.log('[API] Token validation successful:', validation.tokenInfo);
      return res.status(200).json({
        isValid: true,
        tokenInfo: validation.tokenInfo
      });
    } else {
      console.log('[API] Token validation failed:', validation.error);
      return res.status(200).json({ // Change to 200 to avoid frontend errors
        isValid: false,
        error: validation.error
      });
    }
  } catch (error) {
    console.error('[API] Token validation error:', error);
    return res.status(200).json({ // Change to 200 to avoid frontend errors
      isValid: false,
      error: `Validation failed: ${error.message}`
    });
  }
}