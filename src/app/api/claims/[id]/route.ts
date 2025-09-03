import { NextRequest, NextResponse } from 'next/server';
import db from "@/lib/db";

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
    const claimData = await (db as { getClaimWithCampaignInfo: (id: string) => Promise<unknown> }).getClaimWithCampaignInfo(id);
    
    console.log('[CLAIMS] Found claim data:', claimData ? 'Yes' : 'No');
    
    if (!claimData) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(claimData);
  } catch (error: unknown) {
    console.error('[CLAIMS] Get claim error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}