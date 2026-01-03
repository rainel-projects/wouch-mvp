import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
    throw new Error('Missing SUPABASE_KEY in .env file');
}

// Create Supabase client with service_role key
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Execute raw SQL query using Supabase RPC
 * This bypasses PostgREST and directly queries the database
 */
export async function executeSQL(query, params = []) {
    try {
        // Use Supabase's SQL execution via RPC
        // Note: This requires a database function to be created
        const { data, error } = await supabase.rpc('execute_sql', {
            query_text: query,
            query_params: params
        });

        if (error) {
            throw error;
        }

        return { data, error: null };
    } catch (error) {
        console.error('SQL execution error:', error);
        return { data: null, error };
    }
}

/**
 * Query a specific schema table
 * Uses fully qualified table names to bypass schema cache issues
 */
export async function queryTable(schema, table, options = {}) {
    const { select = '*', where, limit, orderBy } = options;

    let query = `SELECT ${select} FROM ${schema}.${table}`;

    if (where) {
        const conditions = Object.entries(where)
            .map(([key, value]) => `${key} = '${value}'`)
            .join(' AND ');
        query += ` WHERE ${conditions}`;
    }

    if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
        query += ` LIMIT ${limit}`;
    }

    return executeSQL(query);
}

export default supabase;
