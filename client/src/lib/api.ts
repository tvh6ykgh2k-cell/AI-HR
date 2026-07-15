const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  testConnection: () => request<any>('/test-connection', { method: 'POST' }),
  saveQA: (sessionId: string, question: string, answer: string) =>
    request<any>('/chat/save-qa', { method: 'POST', body: JSON.stringify({ sessionId, question, answer }) }),
  recognizeJD: (imageBase64: string) =>
    request<any>('/recognize-jd', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
  generatePrep: (jdText: string, resumeText?: string) =>
    request<any>('/prep/generate', { method: 'POST', body: JSON.stringify({ jdText, resumeText }) }),
  scoreStar: (question: string, answer: string, jdContext: string) =>
    request<any>('/prep/score-star', { method: 'POST', body: JSON.stringify({ question, answer, jdContext }) }),
  listSessions: () => request<any[]>('/sessions'),
  getSession: (id: string) => request<any>(`/sessions/${id}`),
  deleteSession: (id: string) => request<any>(`/sessions/${id}`, { method: 'DELETE' }),
};

export function streamChat(
  sessionId: string, message: string, jdContext: string, starContext: string,
  onToken: (token: string) => void, onDone: () => void, onError: (err: Error) => void,
): AbortController {
  const controller = new AbortController();
  fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, jdContext, starContext }),
    signal: controller.signal,
  }).then(async (res) => {
    const reader = res.body?.getReader();
    if (!reader) { onError(new Error('No body')); return; }
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) onToken(parsed.token);
          if (parsed.error) onError(new Error(parsed.error));
        } catch {}
      }
    }
    onDone();
  }).catch(onError);
  return controller;
}
