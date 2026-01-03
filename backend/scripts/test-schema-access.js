import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing schema access with different methods...\n');

async function testSchemaAccess() {
    try {
        // Test 1: Try with schema prefix in table name
        console.log('Test 1: Using schema.table notation');
        const { data: test1, error: error1 } = await supabase
            .from('learning_engine_schema.modules')
            .select('id, title')
            .limit(3);

        if (error1) {
            console.log('   ❌ Error:', error1.message, `(${error1.code})`);
        } else {
            console.log(`   ✅ SUCCESS! Found ${test1?.length || 0} modules`);
            if (test1 && test1.length > 0) {
                test1.forEach(m => console.log(`      - ${m.id}: ${m.title}`));
            }
        }

        // Test 2: Try questions table
        console.log('\nTest 2: Checking questions table');
        const { data: test2, error: error2 } = await supabase
            .from('learning_engine_schema.questions')
            .select('id, question_code, question_text')
            .limit(3);

        if (error2) {
            console.log('   ❌ Error:', error2.message, `(${error2.code})`);
        } else {
            console.log(`   ✅ SUCCESS! Found ${test2?.length || 0} questions`);
            if (test2 && test2.length > 0) {
                test2.forEach(q => console.log(`      - ${q.question_code}: ${q.question_text?.substring(0, 50)}`));
            }
        }

        // Test 3: Try user_flows
        console.log('\nTest 3: Checking user_flows table');
        const { data: test3, error: error3 } = await supabase
            .from('learning_engine_schema.user_flows')
            .select('id, user_id, status')
            .limit(3);

        if (error3) {
            console.log('   ❌ Error:', error3.message, `(${error3.code})`);
        } else {
            console.log(`   ✅ SUCCESS! Found ${test3?.length || 0} user flows`);
        }

    } catch (err) {
        console.error('\n❌ Unexpected error:', err.message);
    }
}

testSchemaAccess();
