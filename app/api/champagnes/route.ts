import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const champagnes = await prisma.champagne.findMany({
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
    
    return NextResponse.json(mappedChampagnes);
  } catch (error) {
    console.error('Failed to fetch champagnes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch champagnes' },
      { status: 500 }
    );
  }
}