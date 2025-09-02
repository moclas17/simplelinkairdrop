import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../../lib/db';

export async function POST(req: NextRequest) {
  console.log('[CAMPAIGN-STATS] Request received');
  
  try {
    const { campaignId, walletAddress } = await req.json();
    
    if (!campaignId || !walletAddress) {
      return NextResponse.json({ 
        error: 'campaignId and walletAddress required' 
      }, { status: 400 });
    }

    console.log('[CAMPAIGN-STATS] Getting stats for:', { campaignId, walletAddress });

    // Get campaign statistics
    const result = await (db as any).getCampaignStats(campaignId, walletAddress);
    
    console.log('[CAMPAIGN-STATS] Stats result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({ 
      success: true,
      stats: result,
      message: 'Campaign statistics retrieved successfully'
    });
    
  } catch (error: any) {
    console.error('[CAMPAIGN-STATS] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get campaign statistics', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}