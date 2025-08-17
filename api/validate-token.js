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
    
    const validation = await db.validateERC20Contract(tokenAddress);
    
    if (validation.isValid) {
      console.log('[API] Token validation successful:', validation.tokenInfo);
      return res.status(200).json({
        isValid: true,
        tokenInfo: validation.tokenInfo
      });
    } else {
      console.log('[API] Token validation failed:', validation.error);
      return res.status(400).json({
        isValid: false,
        error: validation.error
      });
    }
  } catch (error) {
    console.error('[API] Token validation error:', error);
    return res.status(500).json({
      isValid: false,
      error: 'Internal server error during token validation'
    });
  }
}