import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing raw SQL query to access question_master_schema...\n');

async function testRawSQL() {
    try {
        // Use raw SQL via RPC to query the schema directly
        const { data, error } = await supabase.rpc('exec_sql', {
            query: `
        SELECT id, question_code, question_text, part, order_in_part
        FROM question_master_schema.questions
        ORDER BY order_in_part
        LIMIT 5
      `
        });

        if (error) {
            console.log('❌ RPC Error:', error.message);
            console.log('This means we need to create a custom function in Supabase');

            // Try alternative: direct query with schema in FROM clause
            console.log('\n🔄 Trying alternative approach...');

            const { data: altData, error: altError } = await supabase
                .from('question_master_schema.questions')
                .select('id, question_code, question_text')
                .limit(5);

            if (altError) {
                console.log('❌ Alternative Error:', altError.message, `(${altError.code})`);
                console.log('\n💡 SOLUTION NEEDED:');
                console.log('We need to either:');
                console.log('1. Expose question_master_schema in Supabase API settings');
                console.log('2. Create views in public schema that reference question_master_schema');
                console.log('3. Use Supabase SQL Editor to create helper functions');
            } else {
                console.log('✅ SUCCESS with alternative approach!');
                console.log('Data:', altData);
            }
        } else {
            console.log('✅ SUCCESS with RPC!');
            console.log('Data:', data);
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

testRawSQL();
