import db from '../lib/db.js';

export default async function handler(req, res) {
  const { method } = req;
  
  try {
    switch (method) {
      case 'GET':
        return await getCampaigns(req, res);
      case 'POST':
        return await createCampaign(req, res);
      case 'PUT':
        return await updateCampaign(req, res);
      case 'DELETE':
        return await deleteCampaign(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Campaigns API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCampaigns(req, res) {
  const { walletAddress } = req.query;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  const campaigns = await db.getUserCampaigns(walletAddress);
  return res.status(200).json({ campaigns });
}

async function createCampaign(req, res) {
  const {
    walletAddress,
    title,
    description,
    claimType,
    amountPerClaim,
    totalClaims,
    maxClaimsPerLink,
    tokenAddress,
    tokenSymbol,
    tokenDecimals,
    expiresInHours
  } = req.body;

  // Validation
  if (!walletAddress || !title || !claimType || !amountPerClaim || !totalClaims || !tokenAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const campaignData = {
    walletAddress,
    title,
    description,
    claimType,
    amountPerClaim: Number(amountPerClaim),
    totalClaims: Number(totalClaims),
    maxClaimsPerLink: claimType === 'multi' ? Number(maxClaimsPerLink) : null,
    tokenAddress,
    tokenSymbol,
    tokenDecimals: Number(tokenDecimals) || 18,
    expiresInHours: expiresInHours ? Number(expiresInHours) : null
  };

  const campaign = await db.createCampaign(campaignData);
  return res.status(201).json({ campaign });
}

async function updateCampaign(req, res) {
  const { campaignId, status, ...updateData } = req.body;
  
  if (!campaignId) {
    return res.status(400).json({ error: 'Campaign ID required' });
  }

  const campaign = await db.updateCampaign(campaignId, updateData);
  return res.status(200).json({ campaign });
}

async function deleteCampaign(req, res) {
  const { campaignId } = req.body;
  
  if (!campaignId) {
    return res.status(400).json({ error: 'Campaign ID required' });
  }

  await db.deleteCampaign(campaignId);
  return res.status(200).json({ success: true });
}