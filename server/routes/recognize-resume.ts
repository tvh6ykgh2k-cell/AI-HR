import { Hono } from 'hono';
import { recognizeResume } from '../services/agnes.js';
import { readSettings } from '../services/obsidian.js';

export const recognizeResumeRoute = new Hono();

recognizeResumeRoute.post('/', async (c) => {
  try {
    const { imageBase64 } = await c.req.json<{ imageBase64: string }>();
    if (!imageBase64) return c.json({ error: 'imageBase64 required' }, 400);
    const settings = await readSettings();
    const text = await recognizeResume(imageBase64, settings.apiKey || undefined, settings.model || undefined);
    return c.json({ text });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
