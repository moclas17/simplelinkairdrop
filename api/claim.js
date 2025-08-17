import { ethers } from 'ethers';
import db from '../lib/db.js';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const TOKEN_DECIMALS = Number(process.env.TOKEN_DECIMALS || 18);

console.log('[CLAIM] Module loaded - Environment check:', {
  PRIVATE_KEY: !!PRIVATE_KEY,
  TOKEN_ADDRESS: !!TOKEN_ADDRESS,
  RPC_URL: !!RPC_URL,
  TOKEN_DECIMALS
});

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const token = new ethers.Contract(TOKEN_ADDRESS, ['function transfer(address,uint256)'], wallet);

export default async function handler(req, res) {
  console.log('[CLAIM] Request received:', {
    method: req.method,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type']
    }
  });

  if (req.method !== 'POST') {
    console.log('[CLAIM] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wallet: userWallet, linkId } = req.body || {};
  console.log('[CLAIM] Parsed request:', { userWallet, linkId });
  
  if (!userWallet || !linkId) {
    console.log('[CLAIM] Missing data');
    return res.status(400).json({ error: 'Missing data' });
  }
  
  if (!ethers.isAddress(userWallet)) {
    console.log('[CLAIM] Invalid wallet address:', userWallet);
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  // Check if this is a multi-claim or single-claim link
  console.log('[CLAIM] Checking link validity for:', linkId);
  const current = await db.get(linkId);
  console.log('[CLAIM] Current link data:', current);
  
  if (!current) {
    console.log('[CLAIM] Link not found');
    return res.status(400).json({ error: 'Invalid link' });
  }
  
  if (current.expires_at && new Date(current.expires_at).getTime() <= Date.now()) {
    console.log('[CLAIM] Link expired:', current.expires_at);
    return res.status(400).json({ error: 'Link expired' });
  }

  let reserved;
  
  if (current.is_multi_claim) {
    console.log('[CLAIM] Processing multi-claim link');
    
    // Check if wallet already claimed from this multi-claim link
    const alreadyClaimed = await db.checkWalletAlreadyClaimed(linkId, userWallet);
    if (alreadyClaimed) {
      console.log('[CLAIM] Wallet already claimed from this multi-claim link');
      return res.status(400).json({ error: 'Wallet already claimed from this link' });
    }
    
    // Check if multi-claim still has slots available
    if (current.current_claims >= current.max_claims) {
      console.log('[CLAIM] Multi-claim limit reached');
      return res.status(400).json({ error: 'All claims have been used' });
    }
    
    reserved = await db.reserveMultiClaim(linkId, userWallet);
  } else {
    console.log('[CLAIM] Processing single-use claim link');
    
    if (current.claimed) {
      console.log('[CLAIM] Single-use link already claimed');
      return res.status(400).json({ error: 'Invalid or already claimed' });
    }
    
    reserved = await db.reserve(linkId);
  }
  
  console.log('[CLAIM] Reserved result:', reserved);
  
  if (!reserved) {
    console.log('[CLAIM] Failed to reserve link');
    return res.status(400).json({ error: 'Failed to reserve claim' });
  }

  const amount = reserved.amount;
  console.log('[CLAIM] Processing transfer:', { userWallet, amount, TOKEN_DECIMALS });
  
  try {
    const tx = await token.transfer(userWallet, ethers.parseUnits(amount.toString(), TOKEN_DECIMALS));
    console.log('[CLAIM] Transfer successful:', tx.hash);
    
    if (current.is_multi_claim) {
      await db.markMultiClaimed(linkId, userWallet, tx.hash, amount);
    } else {
      await db.markClaimed(linkId, tx.hash);
    }
    
    return res.status(200).json({ success: true, txHash: tx.hash });
  } catch (e) {
    console.error('[CLAIM] Transfer failed:', e);
    
    // Only rollback for single-use claims (multi-claims don't use processing status)
    if (!current.is_multi_claim) {
      try { 
        await db.rollback(linkId); 
        console.log('[CLAIM] Rollback successful');
      } catch (rollbackError) {
        console.error('[CLAIM] Rollback failed:', rollbackError);
      }
    }
    
    return res.status(500).json({ error: 'Transfer failed', details: e.message });
  }
}
