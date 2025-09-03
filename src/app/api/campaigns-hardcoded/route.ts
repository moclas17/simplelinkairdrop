import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[CAMPAIGNS-HARDCODED] GET request received');
  console.log('[CAMPAIGNS-HARDCODED] Request URL:', req.url);
  
  try {
    // Get wallet address from query parameters
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');
    
    console.log('[CAMPAIGNS-HARDCODED] Parsed wallet address:', walletAddress);
    
    if (!walletAddress) {
      console.log('[CAMPAIGNS-HARDCODED] No wallet address provided');
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Return hardcoded data - no database calls at all
    const mockCampaigns = [
      {
        id: '1',
        title: 'Test Campaign',
        status: 'active',
        token_address: '0x1234567890123456789012345678901234567890',
        chain_id: 41,
        amount_per_claim: 100,
        total_claims: 1000,
        created_at: new Date().toISOString()
      }
    ];

    console.log('[CAMPAIGNS-HARDCODED] Returning mock data');
    
    return NextResponse.json({ 
      campaigns: mockCampaigns,
      debug: {
        message: 'Hardcoded response - no database calls',
        walletAddress,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[CAMPAIGNS-HARDCODED] Error:', error);
    console.error('[CAMPAIGNS-HARDCODED] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to get campaigns', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}