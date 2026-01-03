// Simple test to isolate the error
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://nvdkkmpdhixpckhviqsp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetOnboardingState() {
    const userId = 'test_user_debug_2';
    const sessionId = 'test_session_debug_2';

    console.log('Testing getOnboardingState logic...\n');

    try {
        // Step 1: Check user_flows
        console.log('Step 1: Checking user_flows...');
        const { data: userFlow, error: flowError } = await supabase
            .from('user_flows')
            .select('*')
            .eq('user_id', userId)
            .single();

        console.log('Flow error:', flowError);
        console.log('Flow data:', userFlow);

        if (flowError && flowError.code !== 'PGRST116') {
            console.error('ERROR: Failed to fetch user flow:', flowError.message);
            return;
        }

        if (!userFlow) {
            console.log('\n✅ No flow found - need to initialize');

            // Step 2: Get first question
            console.log('\nStep 2: Fetching first question...');
            const { data: firstQuestion, error: qError } = await supabase
                .from('questions')
                .select('question_code')
                .eq('part', 'part_01')
                .order('order_in_part', { ascending: true })
                .limit(1)
                .single();

            console.log('Question error:', qError);
            console.log('Question data:', firstQuestion);

            if (qError) {
                console.error('ERROR: Failed to fetch first question:', qError.message);
                console.error('Details:', qError.details);
                console.error('Hint:', qError.hint);
                return;
            }

            if (!firstQuestion) {
                console.error('ERROR: No questions found in database');
                return;
            }

            console.log('\n✅ Would initialize with question:', firstQuestion.question_code);
        } else {
            console.log('\n✅ Existing flow found');
            console.log('Current step:', userFlow.current_step_code);
            console.log('Status:', userFlow.status);
        }

    } catch (err) {
        console.error('\n❌ Unexpected error:', err.message);
        console.error('Stack:', err.stack);
    }
}

testGetOnboardingState();
