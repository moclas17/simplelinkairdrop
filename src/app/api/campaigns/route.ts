import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';

export async function GET(req: NextRequest) {
  console.log('[CAMPAIGNS] GET request received');
  
  try {
    // Get wallet address from query parameters
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    console.log('[CAMPAIGNS] Getting campaigns for wallet:', walletAddress);
    
    // Get campaigns for the user
    const campaigns = await (db as any).getUserCampaigns(walletAddress);
    
    console.log('[CAMPAIGNS] Found campaigns:', campaigns?.length || 0);
    
    return NextResponse.json({ campaigns });
    
  } catch (error: any) {
    console.error('[CAMPAIGNS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get campaigns', details: error.message },
      { status: 500 }
    );
  }
}