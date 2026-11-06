// Next.js App Router — a server-side Route Handler.
// File path in a real app: app/api/rates/[cc]/route.ts
//
// The SDK runs only on the server. The API key stays in a server environment
// variable and is never exposed to the browser.
import { Cotizave, CotizaveError } from '@cotizave/sdk';
import { NextResponse } from 'next/server';

// One client per server process.
const client = new Cotizave({ apiKey: process.env.COTIZAVE_API_KEY! });

export async function GET(_request: Request, { params }: { params: Promise<{ cc: string }> }) {
  const { cc } = await params;
  try {
    const data = await client.rates.list(cc);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof CotizaveError) {
      return NextResponse.json(
        { code: err.code, message: err.message },
        { status: err.status || 502 },
      );
    }
    return NextResponse.json({ code: 'internal_error' }, { status: 500 });
  }
}
