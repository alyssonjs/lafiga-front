import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api/client';
import { rateLimiter } from '@/lib/utils/rateLimiter';

export async function GET(
  request,
  { params }
) {
  try {
    // Verificar rate limiting
    const identifier = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = await rateLimiter.limit(identifier);
    
    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Obter query params
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    // Chamar API externa
    const data = await apiClient.get<any>(
      `/${params.endpoint}?${new URLSearchParams(query)}`
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60',
        'CDN-Cache-Control': 'public, s-maxage=300',
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}