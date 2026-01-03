import supabase from '../config/supabase.js';
import { executeSQL, querySingle } from '../utils/sqlExecutor.js';

/**
 * Flow Service - Adapted for existing Supabase schema
 * Uses: user_flows, flows, flow_steps, user_flow_events
 */

/**
 * Get current onboarding state for a user
 */
export async function getOnboardingState(userId, sessionId) {
    console.log(`📍 Getting onboarding state for user: ${userId}`);

    // Check if user has a flow state using SQL execution
    const userFlow = await querySingle(`
        SELECT * FROM journey_engine_schema.user_flows
        WHERE user_id = '${userId}'
        LIMIT 1
    `);

    // If no flow exists, start onboarding
    if (!userFlow) {
        console.log('🆕 New user - starting onboarding');
        return await initializeOnboarding(userId, sessionId);
    }

    // Check if onboarding is complete
    if (userFlow.status === 'completed') {
        return {
            step_type: 'COMPLETE',
            step_id: null,
            progress: 100
        };
    }

    // Return current step
    return {
        step_type: 'QUESTION', // Simplified - always return QUESTION for now
        step_id: userFlow.current_step_code,
        progress: await calculateProgress(userId, sessionId)
    };
}

/**
 * Initialize onboarding for a new user
 */
async function initializeOnboarding(userId, sessionId) {
    // Get first question using SQL execution
    const firstQuestion = await querySingle(`
        SELECT question_code FROM question_master_schema.questions
        ORDER BY order_in_part ASC
        LIMIT 1
    `);

    if (!firstQuestion) {
        console.error('Failed to fetch first question - database might be empty');
        // Return a safe default state instead of throwing
        return {
            step_type: 'COMPLETE',
            step_id: null,
            progress: 0,
            error: 'No questions available'
        };
    }

    // Create user flow using SQL execution
    await executeSQL(`
        INSERT INTO journey_engine_schema.user_flows 
        (user_id, flow_code, current_step_code, status, started_at)
        VALUES (
            '${userId}',
            'onboarding_v1',
            '${firstQuestion.question_code}',
            'in_progress',
            '${new Date().toISOString()}'
        )
    `);

    // Log flow event
    await logFlowEvent(userId, 'onboarding_v1', firstQuestion.question_code, 'started');

    return {
        step_type: 'QUESTION',
        step_id: firstQuestion.question_code,
        progress: 0
    };
}

/**
 * Update user flow to next step
 */
export async function updateFlowState(userId, sessionId, stepType, stepCode) {
    console.log(`📝 Updating flow state: ${stepType}:${stepCode}`);

    const status = stepType === 'COMPLETE' ? 'completed' : 'in_progress';
    const completedAt = status === 'completed' ? `, completed_at = '${new Date().toISOString()}'` : '';

    // Update user_flows using SQL execution
    await executeSQL(`
        UPDATE journey_engine_schema.user_flows
        SET current_step_code = '${stepCode}',
            status = '${status}'${completedAt}
        WHERE user_id = '${userId}'
    `);

    // Log flow event
    await logFlowEvent(userId, 'onboarding_v1', stepCode, 'entered');
}

/**
 * Log a flow event for audit trail
 */
async function logFlowEvent(userId, flowCode, stepCode, eventType) {
    await executeSQL(`
        INSERT INTO journey_engine_schema.user_flow_events
        (user_id, flow_code, step_code, event_type, created_at)
        VALUES (
            '${userId}',
            '${flowCode}',
            '${stepCode}',
            '${eventType}',
            '${new Date().toISOString()}'
        )
    `);
}

/**
 * Calculate onboarding progress percentage
 */
async function calculateProgress(userId, sessionId) {
    // Count total questions using SQL execution
    const totalResult = await querySingle(`
        SELECT COUNT(*) as count FROM question_master_schema.questions
    `);
    const totalQuestions = parseInt(totalResult?.count || 0);

    // Count answered questions
    const answeredResult = await querySingle(`
        SELECT COUNT(*) as count FROM journey_engine_schema.question_responses
        WHERE user_id = '${userId}' AND session_id = '${sessionId}'
    `);
    const answeredQuestions = parseInt(answeredResult?.count || 0);

    if (!totalQuestions || totalQuestions === 0) return 0;

    return Math.round((answeredQuestions / totalQuestions) * 100);
}

export default {
    getOnboardingState,
    updateFlowState
};
