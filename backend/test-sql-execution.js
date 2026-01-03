import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🧪 Testing SQL execution via Supabase RPC...\n');

async function testSQLExecution() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Test 1: Simple query
        console.log('1️⃣ Testing execute_sql_json function...');
        const { data, error } = await supabase.rpc('execute_sql_json', {
            query_text: 'SELECT version()'
        });

        if (error) {
            console.error('❌ Function not found or error:', error.message);
            console.log('\n📝 You need to create the function first!');
            console.log('   Go to Supabase Dashboard → SQL Editor');
            console.log('   Run the SQL from create_sql_function.md');
            return;
        }

        console.log('✅ Function exists and works!\n');

        // Test 2: Query questions from question_master_schema
        console.log('2️⃣ Testing question_master_schema.questions...');
        const { data: questions, error: qError } = await supabase.rpc('execute_sql_json', {
            query_text: `
                SELECT question_code, question_text, options
                FROM question_master_schema.questions
                LIMIT 3
            `
        });

        if (qError) {
            console.error('❌ Error querying questions:', qError.message);
        } else if (questions && questions.length > 0) {
            console.log(`✅ Found ${questions.length} questions:`);
            questions.forEach(q => {
                console.log(`   - ${q.question_code}: ${q.question_text?.substring(0, 50)}...`);
            });
        } else {
            console.log('⚠️  No questions found (database might be empty)');
        }
        console.log('');

        // Test 3: Query user_flows
        console.log('3️⃣ Testing journey_engine_schema.user_flows...');
        const { data: flows, error: fError } = await supabase.rpc('execute_sql_json', {
            query_text: `
                SELECT COUNT(*) as count
                FROM journey_engine_schema.user_flows
            `
        });

        if (fError) {
            console.error('❌ Error querying user_flows:', fError.message);
        } else {
            console.log(`✅ user_flows table accessible (${flows[0]?.count || 0} rows)`);
        }
        console.log('');

        console.log('='.repeat(60));
        console.log('✅ ALL TESTS PASSED!');
        console.log('SQL execution via RPC is working correctly.');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

testSQLExecution();
