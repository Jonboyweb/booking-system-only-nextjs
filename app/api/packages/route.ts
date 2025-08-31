import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const packages = await prisma.drinkPackage.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        price: 'asc'
      }
    });
    
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}