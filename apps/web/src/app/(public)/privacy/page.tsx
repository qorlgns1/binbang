import Link from 'next/link';

/**
 * Public privacy policy page. Accessible without authentication.
 * Replace placeholder content with your actual privacy policy text.
 */
export default function PrivacyPage(): React.ReactElement {
  return (
    <main className='mx-auto max-w-3xl px-4 py-12'>
      <Link
        href='/'
        className='mb-8 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
      >
        ← 홈으로
      </Link>
      <h1 className='text-3xl font-semibold text-foreground'>개인정보처리방침</h1>
      <p className='mt-2 text-sm text-muted-foreground'>최종 수정일: 2026년 2월 11일</p>
      <div className='prose prose-neutral mt-8 dark:prose-invert'>
        <p className='text-muted-foreground'>
          Binbang(빈방어때)은 이용자의 개인정보를 소중히 하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
          본 개인정보처리방침은 서비스 이용 시 수집·이용·보관·제공되는 개인정보에 대한 사항을 안내합니다.
        </p>
        <section className='mt-8'>
          <h2 className='text-xl font-medium text-foreground'>1. 수집하는 개인정보 항목</h2>
          <p className='mt-2 text-muted-foreground'>
            회원가입 및 서비스 이용 과정에서 이름, 이메일 주소, 비밀번호 등이 수집될 수 있습니다.
            빈방 알림 서비스 제공을 위해 등록하신 숙소 URL·설정 정보가 저장됩니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>2. 개인정보의 이용 목적</h2>
          <p className='mt-2 text-muted-foreground'>
            수집된 정보는 회원 관리, 빈방 알림 발송, 서비스 개선 및 고객 지원 목적으로만 이용됩니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>3. 보관 및 파기</h2>
          <p className='mt-2 text-muted-foreground'>
            개인정보는 이용 목적 달성 후 별도 보관이 필요한 경우를 제외하고 지체 없이 파기합니다.
            법령에 따라 보존이 필요한 경우 해당 기간 동안 안전하게 보관한 뒤 파기합니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>4. 문의</h2>
          <p className='mt-2 text-muted-foreground'>
            개인정보 처리와 관련한 문의나 권리 행사 요청은 서비스 내 문의 채널 또는 운영자 이메일을 통해 연락해 주세요.
          </p>
        </section>
      </div>
      <div className='mt-12'>
        <Link
          href='/'
          className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
