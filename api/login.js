import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the login HTML file
    const loginPath = path.join(__dirname, '../public/reown-login.html');
    const html = fs.readFileSync(loginPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error serving login page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
