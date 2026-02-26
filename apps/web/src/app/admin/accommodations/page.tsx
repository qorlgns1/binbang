import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { AdminAccommodationForm } from './_components/AdminAccommodationForm';
import { AgodaApiTestPanel } from './_components/AgodaApiTestPanel';

export const metadata = {
  title: 'Admin – Accommodations',
  robots: { index: false, follow: false },
};

export default function AdminAccommodationsPage(): React.ReactElement {
  return (
    <main className='mx-auto max-w-3xl space-y-8 px-4 py-8'>
      <div>
        <h1 className='text-2xl font-semibold'>Accommodations</h1>
        <p className='mt-1 text-sm text-muted-foreground'>URL 스크래핑 방식 숙소 등록 및 Agoda API 연결 확인</p>
      </div>

      {/* Agoda API 계정 확인 */}
      <Card>
        <CardHeader>
          <CardTitle>Agoda API 연결 확인</CardTitle>
          <CardDescription>
            Hotel ID와 날짜를 입력해 Agoda Search API를 직접 호출합니다. metaSearch extra 포함 여부를 바꿔 landingUrl
            감지와 fallback 규칙을 스모크 테스트할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgodaApiTestPanel />
        </CardContent>
      </Card>

      {/* URL 방식 숙소 등록 */}
      <Card>
        <CardHeader>
          <CardTitle>숙소 등록 (URL 방식)</CardTitle>
          <CardDescription>Airbnb 또는 Agoda 숙소 URL을 붙여넣으세요. 정보가 자동으로 채워집니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminAccommodationForm />
        </CardContent>
      </Card>
    </main>
  );
}
