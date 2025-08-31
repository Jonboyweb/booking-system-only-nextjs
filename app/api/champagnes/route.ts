import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const champagnes = await prisma.champagne.findMany({
      where: {
        isAvailable: true
      },
      orderBy: {
        price: 'asc'
      }
    });
    
    return NextResponse.json(champagnes);
  } catch (error) {
    console.error('Failed to fetch champagnes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch champagnes' },
      { status: 500 }
    );
  }
}