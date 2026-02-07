import type { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';

import { PrismaAdapter } from '@next-auth/prisma-adapter';

import prisma from '@/lib/prisma';

const baseAdapter = PrismaAdapter(prisma);

export const authOptions: NextAuthOptions = {
  adapter: {
    ...baseAdapter,
    async getUser(id: string): Promise<{
      id: string;
      email: string;
      emailVerified: Date | null;
      name: string | null;
      image: string | null;
      roles: { name: string }[];
      plan: { name: string } | null;
    } | null> {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: { select: { name: true } },
          plan: { select: { name: true } },
        },
      });
      if (!user) return null;
      return user as typeof user & { email: string };
    },
    async getSessionAndUser(sessionToken: string): Promise<{
      session: {
        id: string;
        sessionToken: string;
        userId: string;
        expires: Date;
      };
      user: {
        id: string;
        email: string;
        emailVerified: Date | null;
        name: string | null;
        image: string | null;
        roles: { name: string }[];
        plan: { name: string } | null;
      };
    } | null> {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              roles: { select: { name: true } },
              plan: { select: { name: true } },
            },
          },
        },
      });
      if (!session) return null;
      const { user, ...rest } = session;
      return {
        session: rest,
        user: user as typeof user & { email: string },
      };
    },
  },
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
      // 카카오 로그인 시 토큰을 DB에 저장
      if (account?.provider === 'kakao' && account.access_token) {
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          include: { user: true },
        });

        if (existingAccount) {
          await prisma.user.update({
            where: { id: existingAccount.userId },
            data: {
              kakaoAccessToken: account.access_token,
              kakaoRefreshToken: account.refresh_token,
              kakaoTokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
            },
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
