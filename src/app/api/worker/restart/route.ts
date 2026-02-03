import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { exec, spawn } from 'child_process';
import * as fs from 'fs';

import { authOptions } from '@/lib/auth';

export async function POST(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workerUrl = process.env.NODE_ENV === 'production' ? 'http://worker:3500' : 'http://localhost:3500';

    let response: Response;

    try {
      // 1. Worker가 실행 중인지 확인
      response = await fetch(`${workerUrl}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // 2. Worker가 죽었을 경우 환경별로 재시작
      console.log('⚠️ Worker 접속 실패, 자동 재시작 시도:', error);

      // Docker 환경인지 확인 (NODE_ENV가 아닌 실제 실행 환경)
      const isDockerEnvironment =
        process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');

      if (isDockerEnvironment) {
        // Docker 환경: docker-compose로 재시작
        return new Promise<NextResponse>((resolve) => {
          exec('docker-compose restart worker', (error: Error | null, stdout: string, _stderr: string) => {
            if (error) {
              resolve(
                NextResponse.json(
                  {
                    error: 'Docker 재시작 실패: ' + error.message,
                    timestamp: new Date().toISOString(),
                  },
                  { status: 500 },
                ),
              );
            } else {
              resolve(
                NextResponse.json({
                  message: 'Worker Docker 재시작 완료',
                  method: 'docker-compose restart',
                  stdout: stdout.trim(),
                  timestamp: new Date().toISOString(),
                }),
              );
            }
          });
        });
      } else {
        // 로컬 환경: pnpm cron으로 재시작
        return new Promise<NextResponse>((resolve) => {
          const workerProcess = spawn('pnpm', ['cron'], {
            stdio: 'pipe',
            detached: true,
          });

          workerProcess.unref();

          resolve(
            NextResponse.json({
              message: 'Worker 재시작 명령 전송 (로컬 환경)',
              method: 'pnpm cron',
              timestamp: new Date().toISOString(),
            }),
          );
        });
      }
    }

    if (!response.ok) {
      throw new Error('Worker restart failed');
    }

    const result = await response.json();

    // Worker가 살아있던 경우: process.exit(1) 후 자동 재시작 처리
    const isDockerEnvironment =
      process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production' || fs.existsSync('/.dockerenv');

    if (!isDockerEnvironment) {
      // 로컬 환경에서는 프로세스 매니저가 없으므로 직접 재시작
      // Worker가 exit(1)하는 1초 후에 새 프로세스 시작
      setTimeout(() => {
        const workerProcess = spawn('pnpm', ['cron'], {
          stdio: 'ignore',
          detached: true,
        });
        workerProcess.unref();
      }, 1500);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 },
    );
  }
}
