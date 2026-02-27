import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getAgodaHotelCountries } from '@/services/admin/agoda-hotel.service';

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const countries = await getAgodaHotelCountries();
    return NextResponse.json({ ok: true, countries });
  } catch (err) {
    return handleServiceError(err, 'Agoda countries list error');
  }
}
