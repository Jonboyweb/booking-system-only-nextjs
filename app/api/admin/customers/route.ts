import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { getAuthUser } from '@/src/middleware/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { firstName, lastName, email, phone, marketingConsent } = await request.json();

    // Check if customer already exists
    let customer = await prisma.customer.findUnique({
      where: { email }
    });

    if (!customer) {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          marketingConsent
        }
      });
    } else {
      // Update existing customer
      customer = await prisma.customer.update({
        where: { email },
        data: {
          firstName,
          lastName,
          phone,
          marketingConsent
        }
      });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create/update customer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Check authentication
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } }
      ]
    } : {};

    const customers = await prisma.customer.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}