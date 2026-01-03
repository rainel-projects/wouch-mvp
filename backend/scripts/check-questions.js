import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestions() {
    console.log('🔍 Checking questions in database...\n');

    try {
        // Get ALL questions to see what exists
        const { data: allQuestions, error } = await supabase
            .from('questions')
            .select('id, question_code, part, order_in_part, question_text')
            .order('part', { ascending: true })
            .order('order_in_part', { ascending: true })
            .limit(10);

        if (error) {
            console.error('❌ Error:', error.message);
            console.error('Code:', error.code);
            console.error('Details:', error.details);
            return;
        }

        if (!allQuestions || allQuestions.length === 0) {
            console.log('⚠️  NO QUESTIONS FOUND IN DATABASE');
            console.log('The questions table exists but is empty.');
            return;
        }

        console.log(`✅ Found ${allQuestions.length} questions:\n`);

        // Group by part
        const byPart = {};
        allQuestions.forEach(q => {
            if (!byPart[q.part]) byPart[q.part] = [];
            byPart[q.part].push(q);
        });

        Object.keys(byPart).forEach(part => {
            console.log(`📋 Part: ${part} (${byPart[part].length} questions)`);
            byPart[part].forEach(q => {
                console.log(`   ${q.order_in_part}. [${q.question_code}] ${q.question_text?.substring(0, 60)}...`);
            });
            console.log('');
        });

        // Show first question
        const firstQuestion = allQuestions[0];
        console.log('🎯 First question to use:');
        console.log(`   Code: ${firstQuestion.question_code}`);
        console.log(`   Part: ${firstQuestion.part}`);
        console.log(`   Order: ${firstQuestion.order_in_part}`);

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

checkQuestions();
