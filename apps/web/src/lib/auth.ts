import type { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';

import { createNextAuthAdapter, findAccountUserId, saveKakaoTokens } from '@/services/auth.service';

export const authOptions: NextAuthOptions = {
  adapter: createNextAuthAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope: 'profile_nickname profile_image account_email talk_message',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account }): Promise<boolean> {
      if (account?.provider === 'kakao' && account.access_token) {
        const userId = await findAccountUserId(account.provider, account.providerAccountId);

        if (userId) {
          await saveKakaoTokens(userId, {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
          });
        }
      }
      return true;
    },
    async session({ session, user }): Promise<Session> {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.roles = (user.roles ?? []).map((r: { name: string }): string => r.name);
        session.user.planName = user.plan?.name ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
