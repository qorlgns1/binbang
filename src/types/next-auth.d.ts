import type { DefaultSession, DefaultUser } from 'next-auth';

import type { Role } from '@/generated/prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
  }
}
