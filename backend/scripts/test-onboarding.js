import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOnboardingState() {
    const userId = 'test_user_debug';
    const sessionId = 'test_session_debug';

    console.log('🧪 Testing onboarding state fetch...\n');

    try {
        // Step 1: Check if user_flows exists
        console.log('Step 1: Checking user_flows...');
        const { data: userFlow, error: flowError } = await supabase
            .from('user_flows')
            .select('*')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .single();

        console.log('Flow error:', flowError);
        console.log('Flow data:', userFlow);

        if (flowError && flowError.code !== 'PGRST116') {
            console.error('❌ Error fetching flow:', flowError);
            return;
        }

        if (!userFlow) {
            console.log('\n✅ No flow found - need to initialize');

            // Step 2: Get first question
            console.log('\nStep 2: Fetching first question...');
            const { data: firstQuestion, error: qError } = await supabase
                .from('questions')
                .select('question_code')
                .order('order_index', { ascending: true })
                .limit(1)
                .single();

            console.log('Question error:', qError);
            console.log('Question data:', firstQuestion);

            if (qError || !firstQuestion) {
                console.error('❌ Error fetching first question:', qError);
                return;
            }

            // Step 3: Create user flow
            console.log('\nStep 3: Creating user flow...');
            const { data: newFlow, error: insertError } = await supabase
                .from('user_flows')
                .insert({
                    user_id: userId,
                    session_id: sessionId,
                    flow_code: 'onboarding_v1',
                    current_step_type: 'QUESTION',
                    current_step_code: firstQuestion.question_code,
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .select();

            console.log('Insert error:', insertError);
            console.log('Insert data:', newFlow);

            if (insertError) {
                console.error('❌ Error creating flow:', insertError);
                return;
            }

            console.log('\n✅ Flow created successfully!');
        } else {
            console.log('\n✅ Existing flow found:', userFlow);
        }

    } catch (err) {
        console.error('\n❌ Unexpected error:', err);
        console.error('Stack:', err.stack);
    }
}

testOnboardingState();
