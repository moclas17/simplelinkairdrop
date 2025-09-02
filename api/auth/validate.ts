import { NextRequest, NextResponse } from 'next/server';

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const adminToken = req.headers.get('x-admin-token');

  if (!adminToken) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }

  const isValid = adminToken === process.env.ADMIN_TOKEN;
  
  return NextResponse.json({ valid: isValid });
}