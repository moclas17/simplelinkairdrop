import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../../../lib/db';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, context: RouteContext) {
  console.log('[FUNDING] Check funding request received for campaign:', context.params.id);
  
  try {
    const { walletAddress } = await req.json();
    
    if (!walletAddress) {
      return NextResponse.json({ 
        error: 'Wallet address required' 
      }, { status: 400 });
    }

    const campaignId = context.params.id;
    console.log('[FUNDING] Checking funding for campaign:', campaignId, 'wallet:', walletAddress);

    // Use the database function to check funding
    const result = await (db as any).checkCampaignFunding(campaignId, walletAddress);
    
    console.log('[FUNDING] Check result:', result);
    
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
    console.error('[FUNDING] Error checking funding:', error);
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