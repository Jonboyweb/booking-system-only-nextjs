import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withCORS } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const champagnes = await db.champagne.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    });

    // Map isActive to isAvailable for frontend compatibility
    const mappedChampagnes = champagnes.map(champagne => ({
      ...champagne,
      isAvailable: champagne.isActive
    }));

    const response = NextResponse.json(mappedChampagnes);
    return withCORS(response, request);
  } catch (error) {
    console.error('Failed to fetch champagnes:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch champagnes' },
      { status: 500 }
    );
    return withCORS(response, request);
  }
}