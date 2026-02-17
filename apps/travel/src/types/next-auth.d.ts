import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
      planName: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    roles?: { name: string }[];
    plan?: { name: string } | null;
  }
}
