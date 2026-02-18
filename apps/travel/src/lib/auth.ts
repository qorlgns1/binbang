import type { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';

import { createNextAuthAdapter, saveKakaoTokens } from '@/services/auth.service';

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
  events: {
    // signIn은 User/Account 생성 전에 실행되므로 첫 로그인 시 토큰 저장이 누락됨. linkAccount는 DB 레코드 생성 후 호출됨.
    async linkAccount({ user, account }) {
      if (account?.provider === 'kakao' && account.access_token) {
        await saveKakaoTokens(user.id, {
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? null,
          expiresAt: account.expires_at ?? null,
        });
      }
    },
  },
  callbacks: {
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
