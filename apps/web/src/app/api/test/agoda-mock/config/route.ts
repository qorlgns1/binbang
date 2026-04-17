import { NextResponse } from 'next/server';

import { setAgodaMockScenario, type AgodaMockScenario } from '../state';

export async function POST(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = (await req.json()) as { scenario?: string };

  if (body.scenario !== 'sold_out' && body.scenario !== 'available') {
    return NextResponse.json({ error: 'scenario must be "sold_out" or "available"' }, { status: 400 });
  }

  await setAgodaMockScenario(body.scenario as AgodaMockScenario);
  return NextResponse.json({ ok: true, scenario: body.scenario });
}
