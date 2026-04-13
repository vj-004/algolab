import { NextResponse } from 'next/server';

import {
  createInterviewSession,
  getInterviewSession,
  hasInterviewSession,
} from '@/lib/interviewSessionStore';

const generateSessionCode = () => `INT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  if (!code) {
    return NextResponse.json({ success: false, error: 'Session code is required' }, { status: 400 });
  }

  const session = getInterviewSession(code);

  if (!session) {
    return NextResponse.json({ success: false, error: 'Interview session not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: session }, { status: 200 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const problemIds = Array.isArray(body?.problemIds) ? body.problemIds.filter(Boolean) : [];

    if (problemIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Select at least one problem' }, { status: 400 });
    }

    let code = body?.code?.trim();

    if (!code) {
      code = generateSessionCode();
      while (hasInterviewSession(code)) {
        code = generateSessionCode();
      }
    }

    const session = createInterviewSession({ code, problemIds });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.log('Error creating interview session:', error);
    return NextResponse.json({ success: false, error: 'Failed to create interview session' }, { status: 500 });
  }
}
