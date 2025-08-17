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

  // Optional: check expiry before reserving
  console.log('[CLAIM] Checking link validity for:', linkId);
  const current = await db.get(linkId);
  console.log('[CLAIM] Current link data:', current);
  
  if (!current || current.claimed) {
    console.log('[CLAIM] Link invalid or already claimed');
    return res.status(400).json({ error: 'Invalid or already claimed' });
  }
  
  if (current.expires_at && new Date(current.expires_at).getTime() <= Date.now()) {
    console.log('[CLAIM] Link expired:', current.expires_at);
    return res.status(400).json({ error: 'Link expired' });
  }

  // Reserve this claim atomically
  console.log('[CLAIM] Attempting to reserve link:', linkId);
  const reserved = await db.reserve(linkId);
  console.log('[CLAIM] Reserved result:', reserved);
  
  if (!reserved) {
    console.log('[CLAIM] Failed to reserve link');
    return res.status(400).json({ error: 'Invalid or already claimed' });
  }

  const amount = reserved.amount;
  console.log('[CLAIM] Processing transfer:', { userWallet, amount, TOKEN_DECIMALS });
  
  try {
    const tx = await token.transfer(userWallet, ethers.parseUnits(amount.toString(), TOKEN_DECIMALS));
    console.log('[CLAIM] Transfer successful:', tx.hash);
    await db.markClaimed(linkId, tx.hash);
    return res.status(200).json({ success: true, txHash: tx.hash });
  } catch (e) {
    console.error('[CLAIM] Transfer failed:', e);
    try { 
      await db.rollback(linkId); 
      console.log('[CLAIM] Rollback successful');
    } catch (rollbackError) {
      console.error('[CLAIM] Rollback failed:', rollbackError);
    }
    return res.status(500).json({ error: 'Transfer failed', details: e.message });
  }
}
