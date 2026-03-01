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
    async signIn({ user, account, profile }): Promise<boolean> {
      if (account?.provider === 'kakao') {
        // Kakao는 이메일 검증을 강제하지 않으므로 직접 플래그를 확인한다.
        // allowDangerousEmailAccountLinking=true 환경에서 미검증 이메일로
        // 기존 계정에 자동 연동되는 계정 탈취를 방지하기 위한 guard.
        const kakaoAccount = (profile as Record<string, unknown> | undefined)?.kakao_account as
          | { is_email_valid?: boolean; is_email_verified?: boolean }
          | undefined;

        if (!kakaoAccount?.is_email_valid || !kakaoAccount?.is_email_verified) {
          return false;
        }

        // 카카오 로그인/연동 시 talk_message 발송용 토큰을 User 레코드에 저장한다.
        // user.id: NextAuth 어댑터가 찾거나 생성한 User의 ID (기존 이메일 계정 포함)
        if (account.access_token && user?.id) {
          await saveKakaoTokens(user.id, {
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
