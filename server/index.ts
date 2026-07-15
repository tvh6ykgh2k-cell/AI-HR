import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { settingsRoute } from './routes/settings.js';
import { chatRoute } from './routes/chat.js';
import { recognizeJdRoute } from './routes/recognize-jd.js';
import { prepRoute } from './routes/prep.js';

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

const port = 3001;
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
