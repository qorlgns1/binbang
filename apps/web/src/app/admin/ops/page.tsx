import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getAdminOpsAccommodationDiagnostics,
  getAdminOpsSummary,
  type AdminOpsDiagnosticLevel,
} from '@/services/admin/ops.service';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR', { hour12: false });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ko-KR');
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNotificationStatus(value: string | null): string {
  if (!value) return '-';
  return value;
}

function formatStatusBadgeVariant(level: AdminOpsDiagnosticLevel): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (level === 'error') return 'destructive';
  if (level === 'warn') return 'secondary';
  if (level === 'info') return 'outline';
  return 'default';
}

function formatStatusLabel(level: AdminOpsDiagnosticLevel): string {
  if (level === 'error') return 'ERROR';
  if (level === 'warn') return 'WARN';
  if (level === 'info') return 'INFO';
  return 'OK';
}

function truncateText(value: string | null | undefined, max = 80): string {
  if (!value) return '-';
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function pickParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

interface AdminOpsPageProps {
  searchParams: Promise<{
    accommodationId?: string | string[];
    q?: string | string[];
  }>;
}

export default async function AdminOpsPage({ searchParams }: AdminOpsPageProps) {
  const params = await searchParams;
  const diagnosticsQuery = pickParam(params.accommodationId ?? params.q).trim();

  const [summary, diagnostics] = await Promise.all([
    getAdminOpsSummary(),
    diagnosticsQuery.length > 0 ? getAdminOpsAccommodationDiagnostics(diagnosticsQuery) : Promise.resolve(null),
  ]);

  return (
    <main className='mx-auto max-w-7xl space-y-6 px-4 py-8'>
      <section className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>Binbang Ops</h1>
        <p className='text-sm text-muted-foreground'>
          집계 범위: 최근 {summary.range.days}일 ({formatDateTime(summary.range.from)} ~{' '}
          {formatDateTime(summary.range.to)})
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>숙소 알림 진단</CardTitle>
          <CardDescription>
            숙소 ID(accommodationId) 또는 Agoda hotelId(platformId)로 조회해 poll → event → notification → consent
            체인을 점검합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form action='/admin/ops' method='get' className='flex flex-col gap-2 sm:flex-row'>
            <Input
              name='accommodationId'
              defaultValue={diagnosticsQuery}
              className='font-mono'
              placeholder='예: cmeq... 또는 265923'
            />
            <Button type='submit'>진단</Button>
            {diagnosticsQuery && (
              <Button type='button' variant='outline' asChild>
                <a href='/admin/ops'>초기화</a>
              </Button>
            )}
          </form>

          {diagnosticsQuery && !diagnostics ? (
            <p className='text-sm text-muted-foreground'>
              `{diagnosticsQuery}`에 해당하는 AGODA 숙소를 찾지 못했습니다.
            </p>
          ) : null}

          {diagnostics ? (
            <div className='space-y-4'>
              <div className='grid gap-3 text-sm md:grid-cols-4'>
                <div className='rounded-md border p-3'>
                  <p className='text-xs text-muted-foreground'>숙소</p>
                  <p className='font-medium'>{diagnostics.accommodation.name}</p>
                  <p className='font-mono text-xs text-muted-foreground'>{diagnostics.accommodation.id}</p>
                </div>
                <div className='rounded-md border p-3'>
                  <p className='text-xs text-muted-foreground'>플랫폼 / 활성</p>
                  <p className='font-mono text-sm'>{diagnostics.accommodation.platformId ?? '-'}</p>
                  <p>{diagnostics.accommodation.isActive ? 'active' : 'inactive'}</p>
                </div>
                <div className='rounded-md border p-3'>
                  <p className='text-xs text-muted-foreground'>일정</p>
                  <p>
                    {formatDate(diagnostics.accommodation.checkIn)} - {formatDate(diagnostics.accommodation.checkOut)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    lastPoll:{' '}
                    {diagnostics.accommodation.lastPolledAt
                      ? formatDateTime(diagnostics.accommodation.lastPolledAt)
                      : '-'}
                  </p>
                </div>
                <div className='rounded-md border p-3'>
                  <p className='text-xs text-muted-foreground'>발송 설정</p>
                  <p>
                    provider: <span className='font-mono'>{diagnostics.config.emailProvider}</span>
                  </p>
                  <p className='font-mono text-xs text-muted-foreground'>{diagnostics.config.fromEmail}</p>
                </div>
              </div>

              <div className='space-y-2'>
                {diagnostics.checks.map((item) => (
                  <div key={item.code} className='rounded-md border p-3'>
                    <div className='flex items-center gap-2'>
                      <Badge variant={formatStatusBadgeVariant(item.level)}>{formatStatusLabel(item.level)}</Badge>
                      <p className='text-sm font-medium'>{item.message}</p>
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className='grid gap-3 text-sm md:grid-cols-3'>
                <div className='rounded-md border p-3'>
                  <p className='text-xs text-muted-foreground'>Poll 카운트</p>
                  <p>total: {diagnostics.counters.polls.total}</p>
                  <p>success: {diagnostics.counters.polls.success}</p>
                  <p>failed: {diagnostics.counters.polls.failed}</p>
                </div>
                <div className='rounded-md border p-3'>
                  <p className='text-xs text-muted-foreground'>Event 카운트</p>
                  <p>vacancy(detected): {diagnostics.counters.events.vacancyDetected}</p>
                  <p>vacancy(rejected): {diagnostics.counters.events.vacancyRejected}</p>
                  <p>price_drop(detected): {diagnostics.counters.events.priceDropDetected}</p>
                </div>
                <div className='rounded-md border p-3'>
                  <p className='text-xs text-muted-foreground'>Notification 카운트</p>
                  <p>queued: {diagnostics.counters.notifications.queued}</p>
                  <p>sent: {diagnostics.counters.notifications.sent}</p>
                  <p>
                    failed/suppressed: {diagnostics.counters.notifications.failed}/
                    {diagnostics.counters.notifications.suppressed}
                  </p>
                </div>
              </div>

              <p className='rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground'>
                Vacancy 판단 메모: {diagnostics.vacancyContext.note}
              </p>

              <div className='space-y-2'>
                <h3 className='text-sm font-semibold'>최근 Poll (최대 5건)</h3>
                {diagnostics.recentPollRuns.length === 0 ? (
                  <p className='text-xs text-muted-foreground'>poll 기록이 없습니다.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시각</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>HTTP</TableHead>
                        <TableHead>Latency</TableHead>
                        <TableHead>Snapshots</TableHead>
                        <TableHead>오류</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnostics.recentPollRuns.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className='text-xs text-muted-foreground'>
                            {formatDateTime(item.polledAt)}
                          </TableCell>
                          <TableCell className='text-xs'>{item.status}</TableCell>
                          <TableCell className='text-xs'>{item.httpStatus ?? '-'}</TableCell>
                          <TableCell className='text-xs'>
                            {item.latencyMs != null ? `${item.latencyMs}ms` : '-'}
                          </TableCell>
                          <TableCell className='text-xs'>{item.snapshotCount}</TableCell>
                          <TableCell className='text-xs text-muted-foreground'>{truncateText(item.error)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className='space-y-2'>
                <h3 className='text-sm font-semibold'>최근 Alert Event (최대 10건)</h3>
                {diagnostics.recentEvents.length === 0 ? (
                  <p className='text-xs text-muted-foreground'>event 기록이 없습니다.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시각</TableHead>
                        <TableHead>이벤트</TableHead>
                        <TableHead>offerKey</TableHead>
                        <TableHead>알림 상태</TableHead>
                        <TableHead>알림 오류</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnostics.recentEvents.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className='text-xs text-muted-foreground'>
                            {formatDateTime(item.detectedAt)}
                          </TableCell>
                          <TableCell className='text-xs'>
                            {item.type} / {item.status}
                          </TableCell>
                          <TableCell className='text-xs font-mono'>{item.offerKey ?? '-'}</TableCell>
                          <TableCell className='text-xs'>{item.latestNotificationStatus ?? '-'}</TableCell>
                          <TableCell className='text-xs text-muted-foreground'>
                            {truncateText(item.latestNotificationError)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className='space-y-2'>
                <h3 className='text-sm font-semibold'>최근 Notification (최대 10건)</h3>
                {diagnostics.recentNotifications.length === 0 ? (
                  <p className='text-xs text-muted-foreground'>notification 기록이 없습니다.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시각</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>attempt</TableHead>
                        <TableHead>오류</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnostics.recentNotifications.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className='text-xs text-muted-foreground'>
                            {formatDateTime(item.createdAt)}
                          </TableCell>
                          <TableCell className='text-xs'>{item.status}</TableCell>
                          <TableCell className='text-xs'>{item.attempt}</TableCell>
                          <TableCell className='text-xs text-muted-foreground'>
                            {truncateText(item.lastError)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className='space-y-2'>
                <h3 className='text-sm font-semibold'>최근 Consent (최대 5건)</h3>
                {diagnostics.consent.recent.length === 0 ? (
                  <p className='text-xs text-muted-foreground'>consent 로그가 없습니다.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>시각</TableHead>
                        <TableHead>타입</TableHead>
                        <TableHead>이메일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnostics.consent.recent.map((item) => (
                        <TableRow key={`${item.createdAt}-${item.type}`}>
                          <TableCell className='text-xs text-muted-foreground'>
                            {formatDateTime(item.createdAt)}
                          </TableCell>
                          <TableCell className='text-xs'>{item.type}</TableCell>
                          <TableCell className='text-xs font-mono'>{item.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

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
                  <TableHead>숙소 ID</TableHead>
                  <TableHead>마지막 폴링</TableHead>
                  <TableHead>미폴링 경과</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.stalled.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='text-sm'>{item.name}</TableCell>
                    <TableCell className='font-mono text-xs'>{item.id}</TableCell>
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
