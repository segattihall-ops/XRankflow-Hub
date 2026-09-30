import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

function authed(req: NextRequest) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '');
  return t ? verifyToken(t) : null;
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body: any = await req.json().catch(() => ({}));
  const prompt: string = (body && body.prompt) || '';
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ text: '(AI not configured - add ANTHROPIC_API_KEY in env vars)' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
    });
    const data: any = await r.json();
    const text = (data.content && data.content[0] && data.content[0].text) || '(AI error)';
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ text: '(AI request failed)' });
  }
}
