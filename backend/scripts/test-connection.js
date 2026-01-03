import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing Supabase connection...\n');

// Simple test - try to query a table
async function testConnection() {
    try {
        // Try to list tables by querying information_schema
        console.log('Attempting to query users table...');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (error) {
            console.log('Error:', error.message);
            console.log('Code:', error.code);
            console.log('Details:', error.details);
        } else {
            console.log('Success! Users table exists');
            if (data && data.length > 0) {
                console.log('Sample columns:', Object.keys(data[0]));
            } else {
                console.log('Table is empty');
            }
        }
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

testConnection();
