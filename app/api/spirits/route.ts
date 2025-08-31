import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const spirits = await prisma.spirit.findMany({
      where: {
        isAvailable: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    return NextResponse.json(spirits);
  } catch (error) {
    console.error('Failed to fetch spirits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spirits' },
      { status: 500 }
    );
  }
}