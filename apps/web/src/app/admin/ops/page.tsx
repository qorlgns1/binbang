import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAdminOpsSummary } from '@/services/admin/ops.service';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR', { hour12: false });
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNotificationStatus(value: string | null): string {
  if (!value) return '-';
  return value;
}

export default async function AdminOpsPage() {
  const summary = await getAdminOpsSummary();

  return (
    <main className='mx-auto max-w-7xl space-y-6 px-4 py-8'>
      <section className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>MoonCatch Ops</h1>
        <p className='text-sm text-muted-foreground'>
          집계 범위: 최근 {summary.range.days}일 ({formatDateTime(summary.range.from)} ~{' '}
          {formatDateTime(summary.range.to)})
        </p>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>알림 등록 수</CardTitle>
            <CardDescription>AGODA 알림 기준</CardDescription>
          </CardHeader>
          <CardContent className='space-y-1 text-sm'>
            <p>
              전체: <span className='font-semibold'>{summary.alerts.total.toLocaleString()}</span>
            </p>
            <p>
              활성: <span className='font-semibold'>{summary.alerts.active.toLocaleString()}</span>
            </p>
            <p>
              최근 {summary.range.days}일 신규:{' '}
              <span className='font-semibold'>{summary.alerts.registeredInRange.toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>알림 성공률</CardTitle>
            <CardDescription>sent / (sent + failed)</CardDescription>
          </CardHeader>
          <CardContent className='space-y-1 text-sm'>
            <p className='text-2xl font-semibold'>{formatRate(summary.notifications.successRate)}</p>
            <p>
              sent: <span className='font-semibold'>{summary.notifications.sent.toLocaleString()}</span>
            </p>
            <p>
              failed: <span className='font-semibold'>{summary.notifications.failed.toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>발송 상태 분포</CardTitle>
            <CardDescription>최근 {summary.range.days}일</CardDescription>
          </CardHeader>
          <CardContent className='space-y-1 text-sm'>
            <p>
              queued: <span className='font-semibold'>{summary.notifications.queued.toLocaleString()}</span>
            </p>
            <p>
              suppressed: <span className='font-semibold'>{summary.notifications.suppressed.toLocaleString()}</span>
            </p>
            <p>
              attempted: <span className='font-semibold'>{summary.notifications.attempted.toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>스톨 감지</CardTitle>
          <CardDescription>폴링 주기 2배 이상 미폴링 활성 숙소 (최대 20건)</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.stalled.count === 0 ? (
            <p className='text-sm text-muted-foreground'>스톨된 숙소가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>숙소</TableHead>
                  <TableHead>마지막 폴링</TableHead>
                  <TableHead>미폴링 경과</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.stalled.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='text-sm'>{item.name}</TableCell>
                    <TableCell className='text-xs text-muted-foreground'>
                      {item.lastPolledAt ? formatDateTime(item.lastPolledAt) : '미폴링'}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {item.stalledSinceMinutes >= 60
                        ? `${Math.floor(item.stalledSinceMinutes / 60)}시간 ${item.stalledSinceMinutes % 60}분`
                        : `${item.stalledSinceMinutes}분`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>오탐 후보</CardTitle>
          <CardDescription>
            verify 기각 또는 발송 실패/억제 이벤트 최신 {summary.falsePositiveCandidates.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.falsePositiveCandidates.length === 0 ? (
            <p className='text-sm text-muted-foreground'>현재 오탐 후보가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시각</TableHead>
                  <TableHead>숙소</TableHead>
                  <TableHead>이벤트</TableHead>
                  <TableHead>알림 상태</TableHead>
                  <TableHead>사유</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.falsePositiveCandidates.map((item) => (
                  <TableRow key={item.eventId}>
                    <TableCell className='text-xs text-muted-foreground'>{formatDateTime(item.detectedAt)}</TableCell>
                    <TableCell className='text-sm'>{item.accommodationName}</TableCell>
                    <TableCell>
                      <Badge variant='secondary'>
                        {item.eventType} / {item.eventStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-xs'>{formatNotificationStatus(item.notificationStatus)}</TableCell>
                    <TableCell className='text-xs text-muted-foreground'>{item.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
