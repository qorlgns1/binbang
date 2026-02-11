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
          빈방어때는 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 서비스
          이용 시 수집되는 개인정보의 처리 방식을 안내합니다.
        </p>
        <section className='mt-8'>
          <h2 className='text-xl font-medium text-foreground'>1. 수집하는 개인정보</h2>
          <p className='mt-2 text-muted-foreground'>
            회원가입 시 이름, 이메일 주소, 비밀번호를 수집합니다. 서비스 이용 과정에서 등록하신 숙소 URL과 알림 설정
            정보도 저장됩니다. 이 정보들은 빈방 알림 서비스를 제공하기 위해 필요합니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>2. 개인정보의 사용 목적</h2>
          <p className='mt-2 text-muted-foreground'>
            수집한 정보는 회원 관리, 빈방 알림 발송, 서비스 개선 및 고객 지원을 위해서만 사용됩니다. 서비스 제공 외의
            목적으로 개인정보를 사용하거나 제3자에게 제공하지 않습니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>3. 개인정보의 보관 및 삭제</h2>
          <p className='mt-2 text-muted-foreground'>
            개인정보는 서비스 이용 목적이 달성된 후 즉시 삭제합니다. 다만, 관련 법령에 따라 일정 기간 보관이 필요한 경우
            해당 기간 동안 안전하게 보관한 후 삭제합니다. 계정을 삭제하시면 관련 개인정보도 함께 삭제됩니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>4. 개인정보 관련 권리</h2>
          <p className='mt-2 text-muted-foreground'>
            언제든지 본인의 개인정보를 조회하거나 수정·삭제할 수 있습니다. 개인정보 처리와 관련한 문의나 권리 행사
            요청은 서비스 내 문의 기능을 통해 연락해 주시면 신속히 처리하겠습니다.
          </p>
        </section>
      </div>
      <div className='mt-12 flex gap-4'>
        <Link href='/terms' className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'>
          서비스 약관
        </Link>
        <Link href='/' className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'>
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
