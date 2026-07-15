// Load .env.local from project root BEFORE any service imports
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log('[env] Loaded .env.local');
} else {
  console.warn('[env] WARNING: .env.local not found at', envPath);
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { settingsRoute } from './routes/settings.js';
import { chatRoute } from './routes/chat.js';
import { recognizeJdRoute } from './routes/recognize-jd.js';
import { prepRoute } from './routes/prep.js';
import { sessionsRoute } from './routes/sessions.js';
import { sendChat } from './services/agnes.js';
import { readSettings } from './services/obsidian.js';

const app = new Hono();

app.use('/*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.route('/api/settings', settingsRoute);
app.route('/api/chat', chatRoute);
app.route('/api/recognize-jd', recognizeJdRoute);
app.route('/api/prep', prepRoute);
app.route('/api/sessions', sessionsRoute);

app.post('/api/test-connection', async (c) => {
  try {
    const settings = await readSettings();
    const tokens: string[] = [];
    for await (const token of sendChat(
      [{ role: 'user', content: 'Ping. Reply with only "pong".' }],
      { apiKeyOverride: settings.apiKey || undefined, modelOverride: settings.model || undefined }
    )) { tokens.push(token); }
    return c.json({ success: true, response: tokens.join('').trim() });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

const port = 3001;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
