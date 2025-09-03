import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  console.log('[CLAIMS] Process claim request received');
  
  try {
    const { wallet, linkId } = await req.json();
    
    if (!wallet || !linkId) {
      return NextResponse.json({ 
        error: 'Missing required fields: wallet and linkId' 
      }, { status: 400 });
    }

    console.log('[CLAIMS] Processing claim:', { wallet, linkId });

    // Process the claim using the database function
    const result = await (db as any).processClaim(linkId, wallet);
    
    console.log('[CLAIMS] Claim result:', result.success ? 'Success' : 'Failed');
    
    if (result.success) {
      return NextResponse.json({ 
        success: true,
        txHash: result.txHash,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          details: result.details 
        },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('[CLAIMS] Process claim error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process claim', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}