import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { adminToken } = body;

    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token required' }, { status: 400 });
    }

    if (adminToken === process.env.ADMIN_TOKEN) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('[AUTH] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}