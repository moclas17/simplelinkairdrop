import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  console.log('[GENERATE-LINKS] Request received');
  
  try {
    const { campaignId, walletAddress } = await req.json();
    
    if (!campaignId || !walletAddress) {
      return NextResponse.json({ 
        error: 'campaignId and walletAddress required' 
      }, { status: 400 });
    }

    console.log('[GENERATE-LINKS] Generating links for:', { campaignId, walletAddress });

    // Generate links for campaign
    const result = await (db as { generateLinksForCampaign: (id: string, wallet: string) => Promise<{
      success: boolean;
      message: string;
      linksCount: number;
      links: Array<{ id: string; url: string; type: string; amount: number; maxClaims?: number }>;
      campaign?: unknown;
    }> }).generateLinksForCampaign(campaignId, walletAddress);
    
    console.log('[GENERATE-LINKS] Generated links:', result.linksCount);
    
    return NextResponse.json({ 
      success: true,
      links: result.links.map(link => link.url),
      linksCount: result.linksCount,
      campaign: result.campaign,
      message: result.message
    });
    
  } catch (error: unknown) {
    console.error('[GENERATE-LINKS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate links', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}