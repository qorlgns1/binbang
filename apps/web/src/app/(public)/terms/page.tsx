import Link from 'next/link';

/**
 * Public terms of service page. Accessible without authentication.
 * Replace placeholder content with your actual terms of service text.
 */
export default function TermsPage(): React.ReactElement {
  return (
    <main className='mx-auto max-w-3xl px-4 py-12'>
      <Link
        href='/'
        className='mb-8 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
      >
        ← 홈으로
      </Link>
      <h1 className='text-3xl font-semibold text-foreground'>서비스 약관</h1>
      <p className='mt-2 text-sm text-muted-foreground'>최종 수정일: 2026년 2월 11일</p>
      <div className='prose prose-neutral mt-8 dark:prose-invert'>
        <p className='text-muted-foreground'>
          빈방어때 서비스를 이용해 주셔서 감사합니다. 본 약관은 서비스 이용 시 적용되는 규정입니다.
        </p>
        <section className='mt-8'>
          <h2 className='text-xl font-medium text-foreground'>1. 약관의 동의</h2>
          <p className='mt-2 text-muted-foreground'>
            회원가입 또는 서비스 이용 시 본 약관에 동의한 것으로 간주됩니다. 약관은 필요에 따라 변경될 수 있으며, 변경 시 사전에 공지합니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>2. 서비스 내용</h2>
          <p className='mt-2 text-muted-foreground'>
            빈방어때는 숙소 예약 사이트의 빈방 정보를 모니터링하고, 설정하신 조건에 맞는 빈방이 발견되면 알림을 보내드립니다. 서비스는 지속적으로 개선되며, 기능이나 운영 방식은 사전 공지 후 변경될 수 있습니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>3. 이용 시 주의사항</h2>
          <p className='mt-2 text-muted-foreground'>
            서비스는 관련 법령과 본 약관을 준수하여 이용해 주시기 바랍니다. 타인의 계정을 사용하거나, 서비스의 정상적인 운영을 방해하는 행위는 금지됩니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>4. 서비스의 한계</h2>
          <p className='mt-2 text-muted-foreground'>
            예약 사이트의 구조 변경이나 장애로 인해 알림이 지연되거나 누락될 수 있습니다. 최종적인 예약 가능 여부는 해당 예약 사이트에서 직접 확인하시기 바랍니다. 이러한 사유로 인한 불이익에 대해서는 책임을 지지 않습니다.
          </p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>5. 문의 및 연락처</h2>
          <p className='mt-2 text-muted-foreground'>
            서비스 이용 중 궁금한 점이나 문의사항이 있으시면 서비스 내 문의 기능을 이용하거나 운영자에게 연락해 주세요.
          </p>
        </section>
      </div>
      <div className='mt-12 flex gap-4'>
        <Link
          href='/privacy'
          className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'
        >
          개인정보처리방침
        </Link>
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
