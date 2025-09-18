// Temporary stub for Prisma to prevent import errors
// This allows the app to compile while we transition to Supabase
// TODO: Remove this file and update all remaining Prisma imports to use Supabase

export const prisma = {
  // Stub object to prevent import errors
  item: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve(null),
    update: () => Promise.resolve(null),
    delete: () => Promise.resolve(null),
  },
  user: {
    findUnique: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve(null),
    update: () => Promise.resolve(null),
  },
  bid: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve(null),
  },
  // Add other models as needed
} as any;