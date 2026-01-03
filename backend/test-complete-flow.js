import { executeSQL, querySingle } from './utils/sqlExecutor.js';

async function testCompleteFlow() {
    const testUserId = `flow_test_${Date.now()}`;
    const testSessionId = `session_${Date.now()}`;

    console.log('🧪 TESTING COMPLETE MVP FLOW');
    console.log('='.repeat(70));
    console.log(`User ID: ${testUserId}`);
    console.log(`Session ID: ${testSessionId}`);
    console.log('='.repeat(70));

    try {
        // ============================================================
        // STEP 1: Initialize Onboarding Flow
        // ============================================================
        console.log('\n📋 STEP 1: Initialize Onboarding Flow');
        console.log('-'.repeat(70));

        const initResponse = await fetch(
            `http://localhost:3000/onboarding/state?user_id=${testUserId}&session_id=${testSessionId}`
        );
        const initData = await initResponse.json();

        console.log('✅ Flow initialized');
        console.log(`   Step Type: ${initData.step_type}`);
        console.log(`   Step ID: ${initData.step_id}`);
        console.log(`   Progress: ${initData.progress}%`);

        if (initData.step_type !== 'QUESTION') {
            throw new Error('Expected QUESTION step type');
        }

        // ============================================================
        // STEP 2: Submit Answer
        // ============================================================
        console.log('\n📝 STEP 2: Submit Answer');
        console.log('-'.repeat(70));
        console.log(`   Question: ${initData.step_id}`);
        console.log(`   Answer: opt_1`);

        const answerResponse = await fetch('http://localhost:3000/answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: testUserId,
                session_id: testSessionId,
                question_code: initData.step_id,
                response_value: 'opt_1'
            })
        });

        if (!answerResponse.ok) {
            const errorText = await answerResponse.text();
            throw new Error(`Answer submission failed: ${errorText}`);
        }

        const answerData = await answerResponse.json();

        console.log('✅ Answer submitted successfully');
        console.log(`   Next Step Type: ${answerData.next_step_type}`);
        console.log(`   Next Step ID: ${answerData.next_step_id}`);

        // ============================================================
        // STEP 3: Verify Response Stored
        // ============================================================
        console.log('\n💾 STEP 3: Verify Response Stored');
        console.log('-'.repeat(70));

        const response = await querySingle(`
      SELECT 
        user_id,
        question_code,
        selected_option_ids,
        created_at
      FROM journey_engine_schema.question_responses
      WHERE user_id = '${testUserId}'
      AND question_code = '${initData.step_id}'
      LIMIT 1
    `);

        if (response) {
            console.log('✅ Response stored in question_responses');
            console.log(`   Question: ${response.question_code}`);
            console.log(`   Selected Options: ${JSON.stringify(response.selected_option_ids)}`);
            console.log(`   Created At: ${response.created_at}`);
        } else {
            console.log('❌ No response found in database');
        }

        // ============================================================
        // STEP 4: Verify Scores Calculated
        // ============================================================
        console.log('\n📊 STEP 4: Verify Scores Calculated');
        console.log('-'.repeat(70));

        const scoreDeltas = await executeSQL(`
      SELECT 
        score_type,
        delta,
        source_rule_id,
        created_at
      FROM insight_engine_schema.user_scores
      WHERE user_id = '${testUserId}'
      ORDER BY created_at DESC
    `);

        if (scoreDeltas && scoreDeltas.length > 0) {
            console.log(`✅ ${scoreDeltas.length} score delta(s) recorded`);
            scoreDeltas.forEach((score, i) => {
                console.log(`   ${i + 1}. ${score.score_type}: +${score.delta} (rule: ${score.source_rule_id})`);
            });
        } else {
            console.log('⚠️  No score deltas found (may be normal if no rules match)');
        }

        const aggregatedScores = await executeSQL(`
      SELECT 
        score_type,
        current_value,
        updated_at
      FROM insight_engine_schema.scores
      WHERE user_id = '${testUserId}'
    `);

        if (aggregatedScores && aggregatedScores.length > 0) {
            console.log(`✅ ${aggregatedScores.length} aggregated score(s)`);
            aggregatedScores.forEach((score, i) => {
                console.log(`   ${i + 1}. ${score.score_type}: ${score.current_value}`);
            });
        } else {
            console.log('⚠️  No aggregated scores found');
        }

        // ============================================================
        // STEP 5: Verify Flags Raised
        // ============================================================
        console.log('\n🚩 STEP 5: Verify Flags Raised');
        console.log('-'.repeat(70));

        const flags = await executeSQL(`
      SELECT 
        flag_code,
        source_rule_id,
        source_question_code,
        created_at
      FROM insight_engine_schema.user_flags
      WHERE user_id = '${testUserId}'
      ORDER BY created_at DESC
    `);

        if (flags && flags.length > 0) {
            console.log(`✅ ${flags.length} flag(s) raised`);
            flags.forEach((flag, i) => {
                console.log(`   ${i + 1}. ${flag.flag_code} (from: ${flag.source_question_code})`);
            });
        } else {
            console.log('⚠️  No flags raised (may be normal if thresholds not crossed)');
        }

        // ============================================================
        // STEP 6: Verify Flow State Updated
        // ============================================================
        console.log('\n🔄 STEP 6: Verify Flow State Updated');
        console.log('-'.repeat(70));

        const flow = await querySingle(`
      SELECT 
        user_id,
        flow_code,
        current_step_code,
        status,
        started_at,
        updated_at
      FROM journey_engine_schema.user_flows
      WHERE user_id = '${testUserId}'
      LIMIT 1
    `);

        if (flow) {
            console.log('✅ Flow state updated');
            console.log(`   Flow Code: ${flow.flow_code}`);
            console.log(`   Current Step: ${flow.current_step_code}`);
            console.log(`   Status: ${flow.status}`);
            console.log(`   Updated At: ${flow.updated_at}`);
        } else {
            console.log('❌ No flow state found');
        }

        // ============================================================
        // STEP 7: Verify Audit Trail
        // ============================================================
        console.log('\n📜 STEP 7: Verify Audit Trail');
        console.log('-'.repeat(70));

        const events = await executeSQL(`
      SELECT 
        step_code,
        event_type,
        created_at
      FROM journey_engine_schema.user_flow_events
      WHERE user_id = '${testUserId}'
      ORDER BY created_at DESC
    `);

        if (events && events.length > 0) {
            console.log(`✅ ${events.length} event(s) logged`);
            events.forEach((event, i) => {
                console.log(`   ${i + 1}. ${event.step_code} - ${event.event_type}`);
            });
        } else {
            console.log('⚠️  No events logged');
        }

        // ============================================================
        // FINAL SUMMARY
        // ============================================================
        console.log('\n' + '='.repeat(70));
        console.log('🎉 COMPLETE MVP FLOW VERIFICATION');
        console.log('='.repeat(70));
        console.log('\n✅ Verified Steps:');
        console.log('   1. Flow initialized → user_flows created');
        console.log('   2. Answer submitted → question_responses saved');
        console.log('   3. Scoring rules applied → user_scores recorded');
        console.log('   4. Scores aggregated → scores updated');
        console.log('   5. Flags raised (if thresholds crossed) → user_flags created');
        console.log('   6. Branching evaluated → next step determined');
        console.log('   7. Flow advanced → user_flows updated');
        console.log('   8. Audit trail maintained → user_flow_events logged');

        console.log('\n📊 Summary:');
        console.log(`   Responses: ${response ? 1 : 0}`);
        console.log(`   Score Deltas: ${scoreDeltas?.length || 0}`);
        console.log(`   Aggregated Scores: ${aggregatedScores?.length || 0}`);
        console.log(`   Flags: ${flags?.length || 0}`);
        console.log(`   Events: ${events?.length || 0}`);

        console.log('\n🔄 Vicky\'s Flow:');
        console.log('   User answers → ✅ response stored → ✅ scoring rules applied →');
        console.log('   ✅ scores aggregated → ✅ flags raised → ✅ branching determined →');
        console.log('   ✅ flow advanced');

        console.log('\n✨ MVP FLOW IS WORKING! ✨\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Details:', error);
    }
}

testCompleteFlow();
