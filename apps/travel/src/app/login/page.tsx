'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback: 'OAuth 콜백 처리에 실패했어요. 다시 로그인해 주세요.',
  OAuthSignin: '소셜 로그인 시작에 실패했어요. 다시 시도해 주세요.',
  OAuthCreateAccount: '소셜 계정 생성에 실패했어요. 잠시 후 다시 시도해 주세요.',
  AccessDenied: '로그인이 거부되었습니다.',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? `로그인 오류: ${error}`) : null;

  const handleGoogleLogin = () => {
    void signIn('google', { callbackUrl });
  };

  const handleKakaoLogin = () => {
    void signIn('kakao', { callbackUrl });
  };

  return (
    <main className='min-h-screen bg-background text-foreground flex items-center justify-center px-4'>
      <section className='w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm'>
        <h1 className='text-2xl font-bold'>로그인</h1>
        <p className='mt-2 text-sm text-muted-foreground'>계속하려면 소셜 로그인을 진행해 주세요.</p>

        {errorMessage && (
          <div className='mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
            {errorMessage}
          </div>
        )}

        <div className='mt-5 space-y-3'>
          <button
            type='button'
            onClick={handleKakaoLogin}
            className='w-full rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-semibold text-black hover:bg-[#F5DC00] transition-colors'
          >
            Kakao로 로그인
          </button>

          <button
            type='button'
            onClick={handleGoogleLogin}
            className='w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold hover:bg-muted transition-colors'
          >
            Google로 로그인
          </button>
        </div>

        <div className='mt-5 text-center'>
          <Link href='/' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
