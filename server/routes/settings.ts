import { Hono } from 'hono';
import { readSettings, writeSettings } from '../services/obsidian.js';
import type { AppSettings } from '../types.js';

export const settingsRoute = new Hono();

settingsRoute.get('/', async (c) => {
  try {
    const settings = await readSettings();
    return c.json(settings);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

settingsRoute.put('/', async (c) => {
  try {
    const body = await c.req.json<Partial<AppSettings>>();
    const current = await readSettings();
    const updated: AppSettings = {
      ...current,
      ...body,
      sliders: { ...current.sliders, ...body.sliders },
    };
    await writeSettings(updated);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
