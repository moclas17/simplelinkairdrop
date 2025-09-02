import { NextRequest, NextResponse } from 'next/server';
import db from '../../lib/db';

export default async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { pathname } = new URL(req.url);
  const id = pathname.split('/').pop();

  if (!id) {
    return NextResponse.json({ error: 'Missing claim ID' }, { status: 400 });
  }

  try {
    const claimData = await (db as any).getClaimWithCampaignInfo(id);
    
    if (!claimData) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(claimData);
  } catch (error: any) {
    console.error('[API] Get claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}