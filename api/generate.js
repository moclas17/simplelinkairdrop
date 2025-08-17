import { randomUUID } from 'crypto';
import db from '../lib/db.js';

console.log('[GENERATE] Module loaded - Admin token configured:', !!process.env.ADMIN_TOKEN);

const requireAdmin = (req) => {
  const bearer = req.headers['authorization'];
  const x = req.headers['x-admin-token'];
  const token = (x && String(x)) || (bearer && String(bearer).replace(/^Bearer\s+/i, ''));
  return token && token === process.env.ADMIN_TOKEN;
};

export default async function handler(req, res) {
  console.log('[GENERATE] Request received:', {
    method: req.method,
    headers: {
      'x-admin-token': req.headers['x-admin-token'] ? '***SET***' : 'MISSING',
      'authorization': req.headers['authorization'] ? '***SET***' : 'MISSING',
      'content-type': req.headers['content-type']
    },
    body: req.body
  });

  if (req.method !== 'POST') {
    console.log('[GENERATE] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isAdmin = requireAdmin(req);
  console.log('[GENERATE] Admin check:', isAdmin);
  if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });

  const { count, amount, expiresInHours, campaign_id = 'default' } = req.body || {};
  console.log('[GENERATE] Parsed body:', { count, amount, expiresInHours, campaign_id });
  if (!count || !amount) {
    console.log('[GENERATE] Missing required fields');
    return res.status(400).json({ error: 'Missing count or amount' });
  }

  let expires_at = null;
  if (expiresInHours && Number(expiresInHours) > 0) {
    const d = new Date();
    d.setHours(d.getHours() + Number(expiresInHours));
    expires_at = d.toISOString();
  }

  const links = [];
  console.log('[GENERATE] Starting link generation, count:', Number(count));
  
  try {
    for (let i = 0; i < Number(count); i++) {
      const id = randomUUID();
      console.log(`[GENERATE] Saving link ${i + 1}/${count}, id:`, id);
      await db.save(id, Number(amount), expires_at, campaign_id);
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const link = `${proto}://${req.headers.host}/claim/${id}`;
      links.push(link);
      console.log(`[GENERATE] Generated link ${i + 1}:`, link);
    }

    console.log('[GENERATE] Success! Generated', links.length, 'links');
    res.status(200).json({ links, expires_at });
  } catch (error) {
    console.error('[GENERATE] Error:', error);
    res.status(500).json({ error: 'Failed to generate links', details: error.message });
  }
}
