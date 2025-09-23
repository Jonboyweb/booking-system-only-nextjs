import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withCORS } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const packages = await db.drinkPackage.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    });

    const response = NextResponse.json(packages);
    return withCORS(response, request);
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
    return withCORS(response, request);
  }
}