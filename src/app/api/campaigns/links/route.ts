import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  console.log('[CAMPAIGN-LINKS] Request received');
  
  try {
    const { campaignId, walletAddress } = await req.json();
    
    if (!campaignId || !walletAddress) {
      return NextResponse.json({ 
        error: 'campaignId and walletAddress required' 
      }, { status: 400 });
    }

    console.log('[CAMPAIGN-LINKS] Getting links for:', { campaignId, walletAddress });

    // Get existing links for campaign
    const result = await (db as { getExistingLinksForCampaign: (id: string, wallet: string) => Promise<{
      links?: unknown[];
      campaign?: unknown;
      message?: string;
    }> }).getExistingLinksForCampaign(campaignId, walletAddress);
    
    console.log('[CAMPAIGN-LINKS] Found links:', result.links?.length || 0);
    
    return NextResponse.json({ 
      success: true,
      links: result.links,
      campaign: result.campaign,
      message: result.message
    });
    
  } catch (error: unknown) {
    console.error('[CAMPAIGN-LINKS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get campaign links', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}