import { ethers } from 'ethers';
import db from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress, signature, message } = req.body;

  try {
    // Verify wallet signature (simple implementation)
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // For now, we'll do a simple wallet check
    // In production, you'd verify a signed message
    const user = await db.getOrCreateUser(walletAddress);
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}