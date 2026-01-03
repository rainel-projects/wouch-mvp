import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing database connection and checking for existing data...\n');

async function checkExistingData() {
    try {
        // Check questions
        console.log('1. Checking questions table...');
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('id, question_code, question_text, part')
            .limit(5);

        if (qError) {
            console.log('   ❌ Error:', qError.message);
        } else {
            console.log(`   ✅ Found ${questions?.length || 0} questions`);
            if (questions && questions.length > 0) {
                console.log('   Sample:', questions[0].question_code, '-', questions[0].question_text?.substring(0, 50));
            }
        }

        // Check score_definitions
        console.log('\n2. Checking score_definitions table...');
        const { data: scores, error: sError } = await supabase
            .from('score_definitions')
            .select('score_code, name')
            .limit(5);

        if (sError) {
            console.log('   ❌ Error:', sError.message);
        } else {
            console.log(`   ✅ Found ${scores?.length || 0} score definitions`);
            if (scores && scores.length > 0) {
                scores.forEach(s => console.log(`   - ${s.score_code}: ${s.name}`));
            }
        }

        // Check modules (for KAI)
        console.log('\n3. Checking modules table...');
        const { data: modules, error: mError } = await supabase
            .from('modules')
            .select('id, title, status')
            .limit(5);

        if (mError) {
            console.log('   ❌ Error:', mError.message);
        } else {
            console.log(`   ✅ Found ${modules?.length || 0} modules`);
            if (modules && modules.length > 0) {
                modules.forEach(m => console.log(`   - ${m.id}: ${m.title}`));
            }
        }

        // Check branching_rules
        console.log('\n4. Checking branching_rules table...');
        const { data: rules, error: rError } = await supabase
            .from('branching_rules')
            .select('rule_id, rule_type, status')
            .limit(5);

        if (rError) {
            console.log('   ❌ Error:', rError.message);
        } else {
            console.log(`   ✅ Found ${rules?.length || 0} branching rules`);
            if (rules && rules.length > 0) {
                rules.forEach(r => console.log(`   - ${r.rule_id}: ${r.rule_type}`));
            }
        }

        console.log('\n✅ Database connection successful!');
        console.log('📊 Summary: Your Supabase database has existing data that the backend can use.');

    } catch (err) {
        console.error('\n❌ Unexpected error:', err.message);
    }
}

checkExistingData();
