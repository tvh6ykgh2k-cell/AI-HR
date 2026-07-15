import { Hono } from 'hono';
import { listSessions, readSession, deleteSession } from '../services/obsidian.js';

export const sessionsRoute = new Hono();

sessionsRoute.get('/', async (c) => {
  try {
    const sessions = await listSessions();
    return c.json(sessions);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

sessionsRoute.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const content = await readSession(id);
    if (!content) return c.json({ error: 'Session not found' }, 404);
    return c.json({ id, content });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

sessionsRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deleted = await deleteSession(id);
    if (!deleted) return c.json({ error: 'Session not found' }, 404);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
