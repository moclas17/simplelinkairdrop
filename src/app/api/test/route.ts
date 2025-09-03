import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[TEST] Basic API test');
  
  try {
    // Test basic functionality first
    console.log('[TEST] Environment variables check:');
    console.log('[TEST] SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('[TEST] SUPABASE_SERVICE_ROLE exists:', !!process.env.SUPABASE_SERVICE_ROLE);
    
    // Try importing the database module
    console.log('[TEST] Attempting to import database module...');
    const db = await import('@/lib/db');
    console.log('[TEST] Database module imported successfully:', !!db.default);
    
    return NextResponse.json({ 
      success: true,
      message: 'Basic test passed',
      env: {
        supabaseUrl: !!process.env.SUPABASE_URL,
        supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE
      },
      dbModule: !!db.default
    });
    
  } catch (error: any) {
    console.error('[TEST] Error in test API:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}