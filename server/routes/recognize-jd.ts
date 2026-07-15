import { Hono } from 'hono';
import { recognizeJD } from '../services/agnes.js';
import { readSettings } from '../services/obsidian.js';
import type { JobDescription } from '../types.js';

export const recognizeJdRoute = new Hono();

recognizeJdRoute.post('/', async (c) => {
  try {
    const { imageBase64 } = await c.req.json<{ imageBase64: string }>();
    const settings = await readSettings();
    const rawJson = await recognizeJD(imageBase64, settings.apiKey || undefined);
    const jd: JobDescription = JSON.parse(rawJson);
    jd.rawText = jd.rawText || `${jd.company} - ${jd.position}\n${jd.responsibilities.join('\n')}\n${jd.requirements.join('\n')}`;
    return c.json(jd);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
