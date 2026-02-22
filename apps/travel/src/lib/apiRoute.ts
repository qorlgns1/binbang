import { getServerSession } from 'next-auth';
import type { ZodSchema } from 'zod';

import { authOptions } from '@/lib/auth';
import { jsonError } from '@/lib/httpResponse';

type ErrorExtra = Record<string, unknown>;

interface ParseJsonBodyOptions {
  allowEmptyBody?: boolean;
  errorExtra?: ErrorExtra;
}

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>,
  options: ParseJsonBodyOptions = {},
): Promise<{ data: T } | { response: Response }> {
  const { allowEmptyBody = false, errorExtra = {} } = options;
  let body: unknown = allowEmptyBody ? {} : undefined;

  try {
    body = await req.json();
  } catch {
    if (!allowEmptyBody) {
      return { response: jsonError(400, 'Invalid JSON body', errorExtra) };
    }
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      response: jsonError(400, 'Validation failed', {
        details: parsed.error.flatten(),
        ...errorExtra,
      }),
    };
  }

  return { data: parsed.data };
}

export async function requireUserId(errorExtra: ErrorExtra = {}): Promise<{ userId: string } | { response: Response }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { response: jsonError(401, 'Unauthorized', errorExtra) };
  }

  return { userId };
}
