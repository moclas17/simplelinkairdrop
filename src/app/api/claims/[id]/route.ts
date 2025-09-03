import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  const id = params.id;
  
  console.log('[CLAIMS] Getting claim data for ID:', id);

  if (!id) {
    return NextResponse.json({ error: 'Missing claim ID' }, { status: 400 });
  }

  try {
    const claimData = await (db as any).getClaimWithCampaignInfo(id);
    
    console.log('[CLAIMS] Found claim data:', claimData ? 'Yes' : 'No');
    
    if (!claimData) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(claimData);
  } catch (error: any) {
    console.error('[CLAIMS] Get claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}