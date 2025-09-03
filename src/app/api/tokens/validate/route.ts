import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getRpcUrl } from '../../../../../lib/networks.js';

export async function POST(req: NextRequest) {
  console.log('[TOKENS] Validation request received');
  
  try {
    const body = await req.json();
    const { tokenAddress, chainId } = body;

    if (!tokenAddress || !chainId) {
      return NextResponse.json({ 
        error: 'Missing required fields: tokenAddress and chainId' 
      }, { status: 400 });
    }

    console.log('[TOKENS] Validating:', { tokenAddress, chainId });

    // Get RPC URL for the chain
    const rpcUrl = getRpcUrl(chainId);
    if (!rpcUrl) {
      return NextResponse.json({ 
        error: `Unsupported chain ID: ${chainId}` 
      }, { status: 400 });
    }

    // Use the database validation function
    const validation = await (db as any).validateTokenContract(tokenAddress.trim(), chainId, rpcUrl);
    
    console.log('[TOKENS] Validation result:', validation);
    
    if (validation.isValid) {
      return NextResponse.json({ 
        isValid: true,
        tokenInfo: validation.tokenInfo,
        isNative: validation.isNative || false
      });
    } else {
      return NextResponse.json({ 
        isValid: false,
        error: validation.error 
      });
    }
    
  } catch (error: any) {
    console.error('[TOKENS] Validation error:', error);
    return NextResponse.json(
      { 
        isValid: false,
        error: error.message || 'Token validation failed' 
      },
      { status: 500 }
    );
  }
}