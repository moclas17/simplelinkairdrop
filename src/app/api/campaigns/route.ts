import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  console.log('[CAMPAIGNS] GET request received');
  console.log('[CAMPAIGNS] Request URL:', req.url);
  
  try {
    // Get wallet address from query parameters
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');
    
    console.log('[CAMPAIGNS] Parsed wallet address:', walletAddress);
    
    if (!walletAddress) {
      console.log('[CAMPAIGNS] No wallet address provided');
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    console.log('[CAMPAIGNS] Getting campaigns for wallet:', walletAddress);
    
    // Get campaigns for the user
    const campaigns = await (db as { getUserCampaigns: (wallet: string) => Promise<unknown[]> }).getUserCampaigns(walletAddress);
    
    console.log('[CAMPAIGNS] Raw campaigns result:', campaigns);
    console.log('[CAMPAIGNS] Found campaigns count:', campaigns?.length || 0);
    
    if (campaigns && campaigns.length > 0) {
      console.log('[CAMPAIGNS] Sample campaign:', JSON.stringify(campaigns[0], null, 2));
    }
    
    return NextResponse.json({ campaigns: campaigns || [] });
    
  } catch (error: unknown) {
    console.error('[CAMPAIGNS] Error getting campaigns:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    if (errorStack) console.error('[CAMPAIGNS] Error stack:', errorStack);
    return NextResponse.json(
      { error: 'Failed to get campaigns', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('[CAMPAIGNS] POST request received');
  
  try {
    const body = await req.json();
    console.log('[CAMPAIGNS] Campaign data:', body);
    
    const {
      walletAddress,
      title,
      description,
      tokenAddress,
      chainId,
      claimType,
      amountPerClaim,
      totalClaims,
      maxClaimsPerLink,
      expiresInHours
    } = body;

    // Validate required fields
    if (!walletAddress || !title || !tokenAddress || !chainId || !claimType || !amountPerClaim || !totalClaims) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['walletAddress', 'title', 'tokenAddress', 'chainId', 'claimType', 'amountPerClaim', 'totalClaims']
      }, { status: 400 });
    }

    // Validate claim type
    if (!['single', 'multi'].includes(claimType)) {
      return NextResponse.json({ 
        error: 'Invalid claim type. Must be "single" or "multi"' 
      }, { status: 400 });
    }

    // For multi-claim, validate maxClaimsPerLink
    if (claimType === 'multi' && (!maxClaimsPerLink || maxClaimsPerLink < 1)) {
      return NextResponse.json({ 
        error: 'For multi-claim campaigns, maxClaimsPerLink is required and must be > 0' 
      }, { status: 400 });
    }

    // Prepare campaign data
    const campaignData = {
      walletAddress,
      title: title.trim(),
      description: description?.trim() || '',
      tokenAddress: tokenAddress.trim(),
      chainId: parseInt(chainId),
      claimType,
      amountPerClaim: parseFloat(amountPerClaim),
      totalClaims: parseInt(totalClaims),
      maxClaimsPerLink: claimType === 'multi' ? parseInt(maxClaimsPerLink) : 1,
      expiresInHours: expiresInHours ? parseFloat(expiresInHours) : null
    };

    console.log('[CAMPAIGNS] Creating campaign with data:', campaignData);

    // Create campaign using the database function
    const campaign = await (db as { createCampaign: (data: unknown) => Promise<{ id: string }> }).createCampaign(campaignData);
    
    console.log('[CAMPAIGNS] Campaign created successfully:', campaign.id);
    
    return NextResponse.json({ 
      success: true,
      campaign,
      message: 'Campaign created successfully'
    });
    
  } catch (error: unknown) {
    console.error('[CAMPAIGNS] Error creating campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to create campaign', 
        details: errorMessage,
        ...(errorMessage.includes('Invalid token') && { 
          type: 'token_validation_error'
        })
      },
      { status: 500 }
    );
  }
}