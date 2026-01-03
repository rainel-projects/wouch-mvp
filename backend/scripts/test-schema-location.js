import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🔍 Testing schema locations...\n');

async function testSchemas() {
    // Test 1: Default client (public schema)
    const publicClient = createClient(supabaseUrl, supabaseKey);

    console.log('1️⃣ Testing PUBLIC schema (default):');
    const { data: publicData, error: publicError } = await publicClient
        .from('questions')
        .select('id, question_code')
        .limit(1);

    if (publicError) {
        console.log(`   ❌ Error: ${publicError.message} (${publicError.code})`);
    } else {
        console.log(`   ✅ SUCCESS! Found ${publicData?.length || 0} questions in public schema`);
        if (publicData?.[0]) {
            console.log(`   First question: ${publicData[0].question_code}`);
        }
    }

    // Test 2: question_master_schema
    console.log('\n2️⃣ Testing QUESTION_MASTER_SCHEMA:');
    const { data: qmData, error: qmError } = await publicClient
        .schema('question_master_schema')
        .from('questions')
        .select('id, question_code')
        .limit(1);

    if (qmError) {
        console.log(`   ❌ Error: ${qmError.message} (${qmError.code})`);
    } else {
        console.log(`   ✅ SUCCESS! Found ${qmData?.length || 0} questions in question_master_schema`);
    }

    // Test 3: insight_engine_schema
    console.log('\n3️⃣ Testing INSIGHT_ENGINE_SCHEMA:');
    const { data: ieData, error: ieError } = await publicClient
        .schema('insight_engine_schema')
        .from('user_scores')
        .select('id')
        .limit(1);

    if (ieError) {
        console.log(`   ❌ Error: ${ieError.message} (${ieError.code})`);
    } else {
        console.log(`   ✅ SUCCESS! Found ${ieData?.length || 0} rows in insight_engine_schema.user_scores`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('CONCLUSION:');
    if (!publicError) {
        console.log('✅ Tables exist in PUBLIC schema');
        console.log('❌ Custom schemas (question_master_schema, etc.) are NOT being used');
        console.log('\n💡 SOLUTION: All tables are in public schema.');
        console.log('   Remove .schema() calls from backend code.');
    } else if (!qmError) {
        console.log('✅ Tables exist in CUSTOM schemas');
        console.log('   Current .schema() implementation is correct.');
    } else {
        console.log('❌ Tables not found in either schema');
        console.log('   Database might be empty or schema names are different.');
    }
    console.log('='.repeat(60));
}

testSchemas();
