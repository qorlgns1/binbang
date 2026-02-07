import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      planName: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    roles?: { name: string }[];
    plan?: { name: string } | null;
  }
}
