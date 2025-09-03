import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[CAMPAIGNS-DEBUG] GET request received');
  console.log('[CAMPAIGNS-DEBUG] Request URL:', req.url);
  
  try {
    // Get wallet address from query parameters
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');
    
    console.log('[CAMPAIGNS-DEBUG] Parsed wallet address:', walletAddress);
    
    if (!walletAddress) {
      console.log('[CAMPAIGNS-DEBUG] No wallet address provided');
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    console.log('[CAMPAIGNS-DEBUG] Importing database module...');
    const dbModule = await import('@/lib/db');
    const db = dbModule.default;
    console.log('[CAMPAIGNS-DEBUG] Database module imported:', !!db);
    
    console.log('[CAMPAIGNS-DEBUG] Calling getUserCampaigns...');
    const campaigns = await db.getUserCampaigns(walletAddress);
    
    console.log('[CAMPAIGNS-DEBUG] getUserCampaigns result:', campaigns?.length || 0, 'campaigns');
    
    return NextResponse.json({ 
      success: true,
      campaigns: campaigns || [],
      debug: {
        walletAddress,
        campaignCount: campaigns?.length || 0
      }
    });
    
  } catch (error: any) {
    console.error('[CAMPAIGNS-DEBUG] Error:', error);
    console.error('[CAMPAIGNS-DEBUG] Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: 'Failed to get campaigns',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}