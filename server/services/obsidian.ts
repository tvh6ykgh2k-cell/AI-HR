import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppSettings, SessionMeta } from '../types.js';
import { DEFAULT_SETTINGS } from '../types.js';

function vaultPath(): string {
  return process.env.OBSIDIAN_VAULT_PATH || '';
}

function settingsPath(): string {
  return path.join(vaultPath(), 'settings.json');
}

function sessionsDir(): string {
  return path.join(vaultPath(), 'sessions');
}

// ========== Settings ==========

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // First run: write defaults
    await writeSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await fs.mkdir(vaultPath(), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
}

// ========== Sessions ==========

function sessionFileName(meta: SessionMeta): string {
  const suffix = meta.type === 'prep' ? '-准备' : '';
  return `${meta.id}${suffix}.md`;
}

function sessionFilePath(meta: SessionMeta): string {
  return path.join(sessionsDir(), sessionFileName(meta));
}

export async function ensureSessionsDir(): Promise<void> {
  await fs.mkdir(sessionsDir(), { recursive: true });
}

export async function createSessionFile(meta: SessionMeta, content: string): Promise<string> {
  await ensureSessionsDir();
  const filePath = sessionFilePath(meta);

  const tags = ['面试', ...meta.tags].map(t => `"${t}"`).join(', ');

  const frontmatter = `---
date: ${meta.date}
company: ${meta.company}
position: ${meta.position}
type: ${meta.type}
tags: [${tags}]
---

${content}`;

  await fs.writeFile(filePath, frontmatter, 'utf-8');
  return filePath;
}

export async function appendToSession(meta: SessionMeta, content: string): Promise<void> {
  const filePath = sessionFilePath(meta);
  await fs.appendFile(filePath, content, 'utf-8');
}

export async function listSessions(): Promise<SessionMeta[]> {
  try {
    await ensureSessionsDir();
    const files = await fs.readdir(sessionsDir());
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const sessions: SessionMeta[] = [];
    for (const file of mdFiles) {
      const filePath = path.join(sessionsDir(), file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;

      const fm = fmMatch[1];
      const get = (key: string) => fm.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim() || '';

      sessions.push({
        id: file.replace('-准备.md', '').replace('.md', ''),
        date: get('date'),
        company: get('company'),
        position: get('position'),
        type: (get('type') as 'interview' | 'prep') || 'interview',
        tags: get('tags').replace(/[[\]"]/g, '').split(',').map(t => t.trim()).filter(Boolean),
      });
    }

    return sessions.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export async function readSession(id: string): Promise<string | null> {
  try {
    await ensureSessionsDir();
    const files = await fs.readdir(sessionsDir());
    const target = files.find(f => f.startsWith(id) && f.endsWith('.md'));
    if (!target) return null;
    return await fs.readFile(path.join(sessionsDir(), target), 'utf-8');
  } catch {
    return null;
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  try {
    await ensureSessionsDir();
    const files = await fs.readdir(sessionsDir());
    const targets = files.filter(f => f.startsWith(id) && f.endsWith('.md'));
    for (const f of targets) {
      await fs.unlink(path.join(sessionsDir(), f));
    }
    return targets.length > 0;
  } catch {
    return false;
  }
}

export async function sessionExists(meta: SessionMeta): Promise<boolean> {
  try {
    await fs.access(sessionFilePath(meta));
    return true;
  } catch {
    return false;
  }
}

export async function readSessionContent(meta: SessionMeta): Promise<string> {
  try {
    return await fs.readFile(sessionFilePath(meta), 'utf-8');
  } catch {
    return '';
  }
}
