// lib/prisma.js
import { PrismaClient } from '@prisma/client';

let prisma;

// Check if we are running in development mode
if (process.env.NODE_ENV === 'development') {
  // In development mode, attach Prisma to the `global` object to prevent new instances on every reload
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
} else {
  // In production mode, create a new Prisma client
  prisma = new PrismaClient();
}

export default prisma;
