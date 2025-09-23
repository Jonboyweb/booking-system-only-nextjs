// Database singleton instance
// This ensures we only create one PrismaClient instance across the entire application
// to prevent connection pool exhaustion

import { prisma } from './prisma';

// Export the singleton instance
// All imports should use: import { db } from '@/lib/db';
export const db = prisma;

// Also export prisma for backwards compatibility during migration
export { prisma };