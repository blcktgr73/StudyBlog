import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL environment variable is required');
  }
  // For build time, create a dummy connection
  console.warn('DATABASE_URL not found, using dummy connection for build');
}

// For query purposes
const queryClient = connectionString ? postgres(connectionString) : null as any;
export const db = queryClient ? drizzle(queryClient, { schema }) : null as any;

// For migrations
export const migrationClient = connectionString ? postgres(connectionString, { max: 1 }) : null as any;
export const migrationDb = migrationClient ? drizzle(migrationClient, { schema }) : null as any;