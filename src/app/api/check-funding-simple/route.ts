import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  console.log('[FUNDING-SIMPLE] Request received');
  
  try {
    const { campaignId, walletAddress } = await req.json();
    
    if (!campaignId || !walletAddress) {
      return NextResponse.json({ 
        error: 'campaignId and walletAddress required' 
      }, { status: 400 });
    }

    console.log('[FUNDING-SIMPLE] Checking funding for:', { campaignId, walletAddress });

    // Use the database function to check funding
    const result = await (db as any).checkCampaignFunding(campaignId, walletAddress);
    
    console.log('[FUNDING-SIMPLE] Result:', JSON.stringify(result, null, 2));
    
    if (result.funded) {
      return NextResponse.json({ 
        success: true,
        funded: true,
        campaign: result.campaign,
        transaction: result.transaction,
        amount: result.amount,
        message: result.message || 'Campaign has been funded and activated!'
      });
    } else {
      return NextResponse.json({ 
        success: true,
        funded: false,
        error: result.error,
        details: result.details,
        message: 'Campaign funding not found or insufficient'
      });
    }
    
  } catch (error: any) {
    console.error('[FUNDING-SIMPLE] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        funded: false,
        error: 'Failed to check funding', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}