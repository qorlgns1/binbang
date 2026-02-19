'use client';

import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Building2, ExternalLink, Loader2, Link2, Receipt, Tag } from 'lucide-react';

type TestResult = {
  ok: boolean;
  status?: number;
  message?: string;
  error?: string;
  hint?: string;
  detail?: string;
  body?: unknown;
};

type AccountBody = { accountId: number; accountName: string; accountType: string; userRole: string };
type AccountsBody = { userId?: number; accounts?: AccountBody[] };

function ConnectionResultAlert({ result }: { result: TestResult }) {
  const body = result.body as AccountsBody | undefined;
  const hasIds = result.ok && body?.userId != null && Array.isArray(body.accounts) && body.accounts.length > 0;
  return (
    <Alert variant={result.ok ? 'default' : 'destructive'}>
      <AlertTitle>{result.ok ? '성공' : '실패'}</AlertTitle>
      <AlertDescription>
        <div className='mt-2 space-y-2'>
          {result.message && <p>{result.message}</p>}
          {result.error && <p>{result.error}</p>}
          {result.hint && <p className='text-muted-foreground text-sm'>{result.hint}</p>}
          {result.detail && <p className='text-muted-foreground text-sm'>{result.detail}</p>}
          {result.status != null && <p className='text-muted-foreground text-sm'>HTTP {result.status}</p>}
          {hasIds && (
            <div className='rounded border bg-muted/30 p-3 text-sm'>
              <p className='mb-1.5 font-medium'>내 정보</p>
              <p className='text-muted-foreground'>
                User ID: <span className='font-mono text-foreground'>{body.userId}</span>
              </p>
              <ul className='mt-2 list-inside list-disc space-y-0.5 text-muted-foreground'>
                {(body.accounts ?? []).map((a) => (
                  <li key={a.accountId}>
                    <span className='font-mono text-foreground'>{a.accountId}</span> · {a.accountName} · {a.accountType}{' '}
                    · {a.userRole}
                  </li>
                ))}
              </ul>
              <p className='text-muted-foreground mt-2 text-xs'>
                Link Builder/Offers에는 위 퍼블리셔 <strong>accountId</strong>가 사용됩니다. 가입 여부는 Awin UI
                프로그램 목록에서 확인하거나, 오퍼 조회 시 membership=joined면 가입한 광고주만 나옵니다.
              </p>
            </div>
          )}
          {result.ok && !hasIds && result.body != null && (
            <pre className='mt-2 max-h-60 overflow-auto rounded border bg-muted/50 p-3 text-xs'>
              {JSON.stringify(result.body, null, 2)}
            </pre>
          )}
          {!result.ok && result.body != null && (
            <pre className='mt-2 max-h-60 overflow-auto rounded border bg-muted/50 p-3 text-xs'>
              {JSON.stringify(result.body, null, 2)}
            </pre>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

function ResultAlert({ result }: { result: TestResult }) {
  const body = result.body as { url?: string; shortUrl?: string } | undefined;
  return (
    <Alert variant={result.ok ? 'default' : 'destructive'}>
      <AlertTitle>{result.ok ? '성공' : '실패'}</AlertTitle>
      <AlertDescription>
        <div className='mt-2 space-y-2'>
          {result.message && <p>{result.message}</p>}
          {result.error && <p>{result.error}</p>}
          {result.hint && <p className='text-muted-foreground text-sm'>{result.hint}</p>}
          {result.detail && <p className='text-muted-foreground text-sm'>{result.detail}</p>}
          {result.status != null && <p className='text-muted-foreground text-sm'>HTTP {result.status}</p>}
          {body?.url != null && (
            <div className='space-y-1'>
              <p className='text-muted-foreground text-sm font-medium'>URL</p>
              <a
                href={body.url}
                target='_blank'
                rel='noreferrer noopener'
                className='block break-all text-primary underline'
              >
                {body.url}
              </a>
              {body.shortUrl != null && (
                <>
                  <p className='text-muted-foreground mt-2 text-sm font-medium'>Short URL</p>
                  <a
                    href={body.shortUrl}
                    target='_blank'
                    rel='noreferrer noopener'
                    className='block break-all text-primary underline'
                  >
                    {body.shortUrl}
                  </a>
                </>
              )}
            </div>
          )}
          {result.body != null && body?.url == null && (
            <pre className='mt-2 max-h-60 overflow-auto rounded border bg-muted/50 p-3 text-xs'>
              {JSON.stringify(result.body, null, 2)}
            </pre>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

type AdvertiserOption = { id: string; advertiserId: number; name: string };

export function AwinTestPanel() {
  const [advertiserList, setAdvertiserList] = useState<AdvertiserOption[]>([]);
  const [connLoading, setConnLoading] = useState(false);
  const [connResult, setConnResult] = useState<TestResult | null>(null);

  const [lbAdvertiserId, setLbAdvertiserId] = useState('');
  const [lbDestinationUrl, setLbDestinationUrl] = useState('');
  const [lbClickref, setLbClickref] = useState('');
  const [lbShorten, setLbShorten] = useState(false);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbResult, setLbResult] = useState<TestResult | null>(null);

  const [progRelationship, setProgRelationship] = useState<string>('joined');
  const [progLoading, setProgLoading] = useState(false);
  const [progResult, setProgResult] = useState<TestResult | null>(null);

  const [offersPage, setOffersPage] = useState(1);
  const [offersPageSize, setOffersPageSize] = useState(50);
  const [offersMembership, setOffersMembership] = useState<string>('joined');
  const [offersType, setOffersType] = useState<string>('all');
  const [offersStatus, setOffersStatus] = useState<string>('active');
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersResult, setOffersResult] = useState<TestResult | null>(null);

  const [txStartDate, setTxStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [txEndDate, setTxEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [txAdvertiserId, setTxAdvertiserId] = useState('');
  const [txStatus, setTxStatus] = useState<string>('');
  const [txLoading, setTxLoading] = useState(false);
  const [txResult, setTxResult] = useState<TestResult | null>(null);

  const [rptStartDate, setRptStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [rptEndDate, setRptEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rptRegion, setRptRegion] = useState('US');
  const [rptLoading, setRptLoading] = useState(false);
  const [rptResult, setRptResult] = useState<TestResult | null>(null);

  const [pdAdvertiserId, setPdAdvertiserId] = useState('');
  const [pdLoading, setPdLoading] = useState(false);
  const [pdResult, setPdResult] = useState<TestResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/awin/advertisers');
        const data = await res.json();
        if (cancelled || !Array.isArray(data)) return;
        setAdvertiserList(data);
        if (data.length > 0) {
          const firstId = String(data[0].advertiserId);
          setLbAdvertiserId((prev) => (prev === '' ? firstId : prev));
          setPdAdvertiserId((prev) => (prev === '' ? firstId : prev));
        }
      } catch {
        if (!cancelled) setAdvertiserList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runConnectionTest = async () => {
    setConnLoading(true);
    setConnResult(null);
    try {
      const res = await fetch('/api/admin/awin/test');
      const data = (await res.json()) as TestResult;
      setConnResult(data);
    } catch (err) {
      setConnResult({
        ok: false,
        error: 'Request failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setConnLoading(false);
    }
  };

  const runLinkBuilder = async () => {
    const advertiserId = Number.parseInt(lbAdvertiserId, 10);
    if (!Number.isInteger(advertiserId) || advertiserId <= 0) {
      setLbResult({ ok: false, error: 'advertiserId는 양의 정수여야 합니다.' });
      return;
    }
    setLbLoading(true);
    setLbResult(null);
    try {
      const res = await fetch('/api/admin/awin/linkbuilder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiserId,
          ...(lbDestinationUrl.trim() ? { destinationUrl: lbDestinationUrl.trim() } : {}),
          ...(lbClickref.trim() ? { clickref: lbClickref.trim() } : {}),
          ...(lbShorten ? { shorten: true } : {}),
        }),
      });
      const data = (await res.json()) as TestResult & { body?: { url?: string; shortUrl?: string } };
      setLbResult(data);
    } catch (err) {
      setLbResult({
        ok: false,
        error: 'Request failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLbLoading(false);
    }
  };

  const runProgrammes = async () => {
    setProgLoading(true);
    setProgResult(null);
    try {
      const res = await fetch(`/api/admin/awin/programmes?relationship=${encodeURIComponent(progRelationship)}`);
      const data = (await res.json()) as TestResult;
      setProgResult(data);
    } catch (err) {
      setProgResult({
        ok: false,
        error: 'Request failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setProgLoading(false);
    }
  };

  const runOffers = async () => {
    setOffersLoading(true);
    setOffersResult(null);
    try {
      const res = await fetch('/api/admin/awin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: offersPage,
          pageSize: offersPageSize,
          membership: offersMembership,
          type: offersType,
          status: offersStatus,
        }),
      });
      const data = (await res.json()) as TestResult;
      setOffersResult(data);
    } catch (err) {
      setOffersResult({
        ok: false,
        error: 'Request failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setOffersLoading(false);
    }
  };

  const runTransactions = async () => {
    const start = new Date(txStartDate);
    const end = new Date(txEndDate);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start > end) {
      setTxResult({ ok: false, error: '기간을 다시 확인하세요.' });
      return;
    }
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    if (diffDays > 31) {
      setTxResult({ ok: false, error: '기간은 최대 31일입니다.' });
      return;
    }
    setTxLoading(true);
    setTxResult(null);
    try {
      const params = new URLSearchParams({
        startDate: txStartDate,
        endDate: txEndDate,
        ...(txAdvertiserId.trim() ? { advertiserId: txAdvertiserId.trim() } : {}),
        ...(txStatus ? { status: txStatus } : {}),
      });
      const res = await fetch(`/api/admin/awin/transactions?${params}`);
      const data = (await res.json()) as TestResult;
      setTxResult(data);
    } catch (err) {
      setTxResult({
        ok: false,
        error: 'Request failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTxLoading(false);
    }
  };

  const runReportsAdvertiser = async () => {
    setRptLoading(true);
    setRptResult(null);
    try {
      const params = new URLSearchParams({
        startDate: rptStartDate,
        endDate: rptEndDate,
        region: rptRegion,
      });
      const res = await fetch(`/api/admin/awin/reports/advertiser?${params}`);
      const data = (await res.json()) as TestResult;
      setRptResult(data);
    } catch (err) {
      setRptResult({
        ok: false,
        error: 'Request failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setRptLoading(false);
    }
  };

  const runProgrammeDetails = async () => {
    const aid = pdAdvertiserId.trim();
    const parsedAid = Number.parseInt(aid, 10);
    if (!aid || !Number.isInteger(parsedAid) || parsedAid <= 0) {
      setPdResult({ ok: false, error: 'advertiserId를 입력하세요.' });
      return;
    }
    setPdLoading(true);
    setPdResult(null);
    try {
      const res = await fetch(`/api/admin/awin/programmedetails?advertiserId=${encodeURIComponent(aid)}`);
      const data = (await res.json()) as TestResult;
      setPdResult(data);
    } catch (err) {
      setPdResult({
        ok: false,
        error: 'Request failed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setPdLoading(false);
    }
  };

  return (
    <main className='mx-auto max-w-3xl space-y-6 px-4 py-8'>
      {/* 1. Connection test */}
      <Card>
        <CardHeader>
          <CardTitle>Awin API 토큰 검증</CardTitle>
          <CardDescription>
            <code className='rounded bg-muted px-1.5 py-0.5'>GET /accounts</code>로 토큰 및 계정 목록 확인
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            <a
              href='https://ui.awin.com/awin-api'
              target='_blank'
              rel='noreferrer noopener'
              className='inline-flex items-center gap-1 text-primary underline hover:no-underline'
            >
              Awin API Credentials
              <ExternalLink className='size-3.5' />
            </a>
            에서 토큰 발급. 분당 20회 제한.
          </p>
          <Button onClick={runConnectionTest} disabled={connLoading}>
            {connLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                확인 중…
              </>
            ) : (
              '연결 테스트'
            )}
          </Button>
          {connResult && <ConnectionResultAlert result={connResult} />}
        </CardContent>
      </Card>

      {/* 2. Programmes (가입 광고주 목록) */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='size-5' />
            가입 광고주 (Programmes)
          </CardTitle>
          <CardDescription>
            <code className='rounded bg-muted px-1.5 py-0.5'>GET /publishers/.../programmes</code>— 관계별
            프로그램(광고주) 목록 조회
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-2'>
            <Label>relationship</Label>
            <Select value={progRelationship} onValueChange={setProgRelationship}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='joined'>joined (가입)</SelectItem>
                <SelectItem value='pending'>pending (승인 대기)</SelectItem>
                <SelectItem value='notjoined'>notJoined (미가입)</SelectItem>
                <SelectItem value='suspended'>suspended</SelectItem>
                <SelectItem value='rejected'>rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runProgrammes} disabled={progLoading}>
            {progLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                조회 중…
              </>
            ) : (
              '프로그램 목록 조회'
            )}
          </Button>
          {progResult && <ResultAlert result={progResult} />}
        </CardContent>
      </Card>

      {/* 3. Link Builder */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Link2 className='size-5' />
            Link Builder
          </CardTitle>
          <CardDescription>
            <code className='rounded bg-muted px-1.5 py-0.5'>POST /publishers/.../linkbuilder/generate</code>— 광고주
            URL로 추적 링크 생성
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-2'>
            <Label htmlFor='lb-advertiser'>advertiserId (필수) — DB 가입 광고주에서 선택</Label>
            {advertiserList.length > 0 ? (
              <Select value={lbAdvertiserId} onValueChange={setLbAdvertiserId}>
                <SelectTrigger id='lb-advertiser'>
                  <SelectValue placeholder='광고주 선택' />
                </SelectTrigger>
                <SelectContent>
                  {advertiserList.map((a) => (
                    <SelectItem key={a.id} value={String(a.advertiserId)}>
                      {a.advertiserId} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Input
                  id='lb-advertiser'
                  type='number'
                  min={1}
                  placeholder='가입 광고주 없음 — 광고주 관리에서 Awin 동기화 후 선택 가능'
                  value={lbAdvertiserId}
                  onChange={(e) => setLbAdvertiserId(e.target.value)}
                />
                <p className='text-muted-foreground text-sm'>
                  가입 광고주 관리에서 &quot;Awin에서 가져오기&quot; 후 이 페이지를 새로고침하세요.
                </p>
              </>
            )}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='lb-dest'>destinationUrl (선택)</Label>
            <Input
              id='lb-dest'
              type='url'
              placeholder='https://...'
              value={lbDestinationUrl}
              onChange={(e) => setLbDestinationUrl(e.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='lb-clickref'>clickref (선택)</Label>
            <Input
              id='lb-clickref'
              placeholder='추적용 식별자'
              value={lbClickref}
              onChange={(e) => setLbClickref(e.target.value)}
            />
          </div>
          <div className='flex items-center gap-2'>
            <Checkbox id='lb-shorten' checked={lbShorten} onCheckedChange={(c) => setLbShorten(c === true)} />
            <Label htmlFor='lb-shorten'>shorten (단축 URL 포함)</Label>
          </div>
          <Button onClick={runLinkBuilder} disabled={lbLoading}>
            {lbLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                생성 중…
              </>
            ) : (
              '링크 생성'
            )}
          </Button>
          {lbResult && <ResultAlert result={lbResult} />}
        </CardContent>
      </Card>

      {/* 4. Offers */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Tag className='size-5' />
            Offers (프로모션/바우처)
          </CardTitle>
          <CardDescription>
            <code className='rounded bg-muted px-1.5 py-0.5'>POST /publishers/.../promotions</code>— 가입 광고주의 오퍼
            목록 조회
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <div className='grid gap-2'>
              <Label>page</Label>
              <Input
                type='number'
                min={1}
                value={offersPage}
                onChange={(e) => setOffersPage(Number(e.target.value) || 1)}
              />
            </div>
            <div className='grid gap-2'>
              <Label>pageSize</Label>
              <Input
                type='number'
                min={10}
                max={200}
                value={offersPageSize}
                onChange={(e) => setOffersPageSize(Number(e.target.value) || 50)}
              />
            </div>
            <div className='grid gap-2'>
              <Label>membership</Label>
              <Select value={offersMembership} onValueChange={setOffersMembership}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>all</SelectItem>
                  <SelectItem value='joined'>joined</SelectItem>
                  <SelectItem value='notJoined'>notJoined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>type</Label>
              <Select value={offersType} onValueChange={setOffersType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>all</SelectItem>
                  <SelectItem value='promotion'>promotion</SelectItem>
                  <SelectItem value='voucher'>voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>status</Label>
              <Select value={offersStatus} onValueChange={setOffersStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>active</SelectItem>
                  <SelectItem value='expiringSoon'>expiringSoon</SelectItem>
                  <SelectItem value='upcoming'>upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={runOffers} disabled={offersLoading}>
            {offersLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                조회 중…
              </>
            ) : (
              '오퍼 조회'
            )}
          </Button>
          {offersResult && <ResultAlert result={offersResult} />}
        </CardContent>
      </Card>

      {/* 5. Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Receipt className='size-5' />
            Transactions (트랜잭션)
          </CardTitle>
          <CardDescription>
            <code className='rounded bg-muted px-1.5 py-0.5'>GET /publishers/.../transactions/</code>— 전환(매출) 목록,
            최대 31일 구간
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <div className='grid gap-2'>
              <Label>startDate</Label>
              <Input type='date' value={txStartDate} onChange={(e) => setTxStartDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>endDate</Label>
              <Input type='date' value={txEndDate} onChange={(e) => setTxEndDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>advertiserId (선택)</Label>
              <Input
                type='number'
                placeholder='필터'
                value={txAdvertiserId}
                onChange={(e) => setTxAdvertiserId(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label>status (선택)</Label>
              <Select value={txStatus || '_'} onValueChange={(v) => setTxStatus(v === '_' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='_'>—</SelectItem>
                  <SelectItem value='pending'>pending</SelectItem>
                  <SelectItem value='approved'>approved</SelectItem>
                  <SelectItem value='declined'>declined</SelectItem>
                  <SelectItem value='deleted'>deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={runTransactions} disabled={txLoading}>
            {txLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                조회 중…
              </>
            ) : (
              '트랜잭션 조회'
            )}
          </Button>
          {txResult && <ResultAlert result={txResult} />}
        </CardContent>
      </Card>

      {/* 6. Reports (광고주별 성과) */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='size-5' />
            광고주별 리포트
          </CardTitle>
          <CardDescription>
            <code className='rounded bg-muted px-1.5 py-0.5'>GET /publishers/.../reports/advertiser</code>—
            클릭/전환/노출 집계
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>startDate</Label>
              <Input type='date' value={rptStartDate} onChange={(e) => setRptStartDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>endDate</Label>
              <Input type='date' value={rptEndDate} onChange={(e) => setRptEndDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>region</Label>
              <Select value={rptRegion} onValueChange={setRptRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='US'>US</SelectItem>
                  <SelectItem value='GB'>GB</SelectItem>
                  <SelectItem value='DE'>DE</SelectItem>
                  <SelectItem value='FR'>FR</SelectItem>
                  <SelectItem value='AU'>AU</SelectItem>
                  <SelectItem value='CA'>CA</SelectItem>
                  <SelectItem value='AT'>AT</SelectItem>
                  <SelectItem value='BE'>BE</SelectItem>
                  <SelectItem value='CH'>CH</SelectItem>
                  <SelectItem value='DK'>DK</SelectItem>
                  <SelectItem value='ES'>ES</SelectItem>
                  <SelectItem value='FI'>FI</SelectItem>
                  <SelectItem value='IE'>IE</SelectItem>
                  <SelectItem value='IT'>IT</SelectItem>
                  <SelectItem value='NL'>NL</SelectItem>
                  <SelectItem value='NO'>NO</SelectItem>
                  <SelectItem value='PL'>PL</SelectItem>
                  <SelectItem value='SE'>SE</SelectItem>
                  <SelectItem value='BR'>BR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={runReportsAdvertiser} disabled={rptLoading}>
            {rptLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                조회 중…
              </>
            ) : (
              '리포트 조회'
            )}
          </Button>
          {rptResult && <ResultAlert result={rptResult} />}
        </CardContent>
      </Card>

      {/* 7. Programme details */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='size-5' />
            프로그램 상세 (Programme details)
          </CardTitle>
          <CardDescription>
            <code className='rounded bg-muted px-1.5 py-0.5'>GET /publishers/.../programmedetails</code>— 특정 광고주
            수수료/KPI 등
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-2'>
            <Label htmlFor='pd-advertiser'>advertiserId — DB 가입 광고주에서 선택</Label>
            {advertiserList.length > 0 ? (
              <Select value={pdAdvertiserId} onValueChange={setPdAdvertiserId}>
                <SelectTrigger id='pd-advertiser'>
                  <SelectValue placeholder='광고주 선택' />
                </SelectTrigger>
                <SelectContent>
                  {advertiserList.map((a) => (
                    <SelectItem key={a.id} value={String(a.advertiserId)}>
                      {a.advertiserId} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Input
                  id='pd-advertiser'
                  type='number'
                  min={1}
                  placeholder='가입 광고주 없음 — 광고주 관리에서 동기화 후 선택'
                  value={pdAdvertiserId}
                  onChange={(e) => setPdAdvertiserId(e.target.value)}
                />
                <p className='text-muted-foreground text-sm'>
                  가입 광고주 관리에서 &quot;Awin에서 가져오기&quot; 후 새로고침하세요.
                </p>
              </>
            )}
          </div>
          <Button onClick={runProgrammeDetails} disabled={pdLoading}>
            {pdLoading ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' />
                조회 중…
              </>
            ) : (
              '상세 조회'
            )}
          </Button>
          {pdResult && <ResultAlert result={pdResult} />}
        </CardContent>
      </Card>
    </main>
  );
}
