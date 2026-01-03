import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Direct PostgreSQL connection (bypasses PostgREST API)
const DATABASE_URL = process.env.DATABASE_URL ||
    'postgresql://postgres:[YOUR-PASSWORD]@db.nvdkkmpdhixpckhviqsp.supabase.co:5432/postgres';

if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set in .env, using default connection string');
    console.warn('⚠️  Please add DATABASE_URL to your .env file');
}

// Create PostgreSQL connection pool
export const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

// Helper function to query with schema
export async function query(text, params, schema = 'public') {
    const client = await pool.connect();
    try {
        // Set search_path to include the schema
        if (schema && schema !== 'public') {
            await client.query(`SET search_path TO ${schema}, public`);
        }
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

// Helper to query specific schema
export async function querySchema(schema, text, params) {
    return query(text, params, schema);
}

export default pool;
