import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db from '../../lib/db';

const requireAdmin = (req: NextRequest) => {
  const bearer = req.headers.get('authorization');
  const xToken = req.headers.get('x-admin-token');
  const token = xToken || (bearer && bearer.replace(/^Bearer\s+/i, ''));
  return token && token === process.env.ADMIN_TOKEN;
};

export default async function handler(req: NextRequest) {
  console.log('[GENERATE] Request received:', {
    method: req.method,
    headers: {
      'x-admin-token': req.headers.get('x-admin-token') ? '***SET***' : 'MISSING',
      'authorization': req.headers.get('authorization') ? '***SET***' : 'MISSING',
    }
  });

  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const isAdmin = requireAdmin(req);
  console.log('[GENERATE] Admin check:', isAdmin);
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { count, amount, expiresInHours, campaign_id = 'default' } = body;
    
    console.log('[GENERATE] Parsed body:', { count, amount, expiresInHours, campaign_id });
    
    if (!count || !amount) {
      return NextResponse.json({ error: 'Missing count or amount' }, { status: 400 });
    }

    let expires_at: string | null = null;
    if (expiresInHours && Number(expiresInHours) > 0) {
      const d = new Date();
      d.setHours(d.getHours() + Number(expiresInHours));
      expires_at = d.toISOString();
    }

    const links = [];
    const host = req.headers.get('host') || 'chingadrop.xyz';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    
    console.log('[GENERATE] Starting link generation, count:', Number(count));
    
    for (let i = 0; i < Number(count); i++) {
      const id = randomUUID();
      console.log(`[GENERATE] Saving link ${i + 1}/${count}, id:`, id);
      
      await (db as any).save(id, Number(amount), expires_at, campaign_id);
      const link = `${protocol}://${host}/claim/${id}`;
      links.push(link);
      
      console.log(`[GENERATE] Generated link ${i + 1}:`, link);
    }

    console.log('[GENERATE] Success! Generated', links.length, 'links');
    
    return NextResponse.json({ links, expires_at });
  } catch (error: any) {
    console.error('[GENERATE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate links', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}