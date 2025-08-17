import db from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokenAddress } = req.body;

  if (!tokenAddress) {
    return res.status(400).json({ 
      isValid: false, 
      error: 'Token address is required' 
    });
  }

  try {
    console.log('[API] Validating ERC-20 token:', tokenAddress);
    console.log('[API] Current RPC URL:', process.env.RPC_URL);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Validation timeout after 30 seconds')), 30000)
    );
    
    const validation = await Promise.race([
      db.validateERC20Contract(tokenAddress),
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