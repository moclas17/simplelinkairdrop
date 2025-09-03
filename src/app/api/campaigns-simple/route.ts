import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[CAMPAIGNS-SIMPLE] GET request received');
  
  try {
    // Get wallet address from query parameters
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    console.log('[CAMPAIGNS-SIMPLE] Testing Supabase connection only...');
    const { createClient } = await import('@supabase/supabase-js');
    
    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Simple test query - just try to get campaigns without any complex logic
    console.log('[CAMPAIGNS-SIMPLE] Attempting simple query...');
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, status')
      .limit(5);

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Simple query worked',
      campaignCount: data?.length || 0,
      sampleCampaigns: data || []
    });
    
  } catch (error: any) {
    console.error('[CAMPAIGNS-SIMPLE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}