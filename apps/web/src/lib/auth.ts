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
      // 이메일 계정 사용자가 카카오 연동 시 기존 계정에 자동 연결되도록 허용
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: 'profile_nickname profile_image account_email talk_message',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }): Promise<boolean> {
      // 카카오 로그인/연동 시 talk_message 발송용 토큰을 User 레코드에 저장한다.
      // user.id: NextAuth 어댑터가 찾거나 생성한 User의 ID (기존 이메일 계정 포함)
      if (account?.provider === 'kakao' && account.access_token && user?.id) {
        await saveKakaoTokens(user.id, {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        });
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
