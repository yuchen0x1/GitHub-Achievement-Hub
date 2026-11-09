import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET(): NextResponse {
  return new NextResponse('ok\n', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
