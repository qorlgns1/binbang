import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { getCaseById } from '@/services/casesService';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const caseDetail = await getCaseById(id);

    if (!caseDetail) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ case: caseDetail });
  } catch (error) {
    console.error('Admin case detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
