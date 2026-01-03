import supabase from '../config/supabase.js';
import { executeSQL, querySingle } from '../utils/sqlExecutor.js';

/**
 * Branching Service - Adapted for existing Supabase schema
 * Uses: branching_rules table with existing structure
 */

/**
 * Evaluate branching rules and determine next step
 */
export async function evaluateBranching(userId, sessionId, currentScores, currentQuestionCode) {
    console.log('🔀 Evaluating branching rules...');

    // Fetch all active branching rules, ordered by priority using SQL execution
    const rules = await executeSQL(`
        SELECT * FROM question_master_schema.branching_rules
        WHERE status = 'active'
        ORDER BY priority ASC
    `);

    if (!rules || rules.length === 0) {
        console.log('⚠️  No branching rules found, continuing to next question');
        return { stepType: 'QUESTION', stepCode: 'next' };
    }

    // Fetch active flags for this user using SQL execution
    const userFlags = await executeSQL(`
        SELECT flag_code FROM insight_engine_schema.user_flags
        WHERE user_id = '${userId}' AND session_id = '${sessionId}'
    `);
    const activeFlagCodes = new Set(userFlags.map(f => f.flag_code));

    // Evaluate each rule in priority order
    for (const rule of rules) {
        // Check if rule applies to current question
        if (rule.trigger_question_code && rule.trigger_question_code !== currentQuestionCode) {
            continue;
        }

        const matches = await evaluateCondition(rule, currentScores, activeFlagCodes);

        if (matches) {
            console.log(`✅ Branching rule matched: ${rule.rule_id}`);

            // Determine next step based on rule_type
            // In existing schema, rule_type might indicate routing to modules or protocols
            if (rule.rule_type === 'route_to_module' || rule.rule_type === 'route_to_kai') {
                return {
                    stepType: 'KAI', // KAI intervention as per MVP spec
                    stepCode: rule.condition_value, // Assuming this contains module_id
                    ruleId: rule.rule_id
                };
            } else if (rule.rule_type === 'route_to_protocol') {
                return {
                    stepType: 'PROTOCOL',
                    stepCode: rule.condition_value,
                    ruleId: rule.rule_id
                };
            }

            // Default: continue to next question
            return {
                stepType: 'QUESTION',
                stepCode: 'next',
                ruleId: rule.rule_id
            };
        }
    }

    // Default fallback
    console.log('⚠️  No rules matched, continuing to next question');
    return { stepType: 'QUESTION', stepCode: 'next' };
}

/**
 * Evaluate a single branching condition
 */
async function evaluateCondition(rule, scores, activeFlagCodes) {
    const { condition_type, condition_value } = rule;

    switch (condition_type) {
        case 'score_threshold':
            return evaluateScoreThreshold(condition_value, scores);

        case 'flag_exists':
            // Check if specific flag exists
            return activeFlagCodes.has(condition_value);

        case 'always':
            return true;

        default:
            console.warn(`Unknown condition type: ${condition_type}`);
            return false;
    }
}

/**
 * Evaluate score threshold expression
 */
function evaluateScoreThreshold(expression, scores) {
    if (!expression) return false;

    // Handle JSON condition
    if (typeof expression === 'object') {
        const { score_code, operator, value } = expression;
        const scoreValue = scores[score_code] || 0;

        switch (operator) {
            case '<':
                return scoreValue < value;
            case '<=':
                return scoreValue <= value;
            case '>':
                return scoreValue > value;
            case '>=':
                return scoreValue >= value;
            case '==':
                return scoreValue === value;
            default:
                return false;
        }
    }

    // Handle string expression like "emotional_awareness < 30"
    const match = String(expression).match(/(\w+)\s*([<>=!]+)\s*(\d+)/);

    if (!match) {
        console.warn(`Invalid expression: ${expression}`);
        return false;
    }

    const [, scoreCode, operator, thresholdStr] = match;
    const threshold = Number(thresholdStr);
    const scoreValue = scores[scoreCode] || 0;

    switch (operator) {
        case '<':
            return scoreValue < threshold;
        case '<=':
            return scoreValue <= threshold;
        case '>':
            return scoreValue > threshold;
        case '>=':
            return scoreValue >= threshold;
        case '==':
        case '===':
            return scoreValue === threshold;
        default:
            return false;
    }
}

/**
 * Get the next question in sequence
 */
export async function getNextQuestion(currentQuestionCode) {
    // Fetch current question using SQL execution
    const currentQuestion = await querySingle(`
        SELECT order_in_part FROM question_master_schema.questions
        WHERE question_code = '${currentQuestionCode}'
        LIMIT 1
    `);

    if (!currentQuestion) {
        console.error('Failed to fetch current question');
        return null;
    }

    // Fetch next question by order
    const nextQuestion = await querySingle(`
        SELECT question_code FROM question_master_schema.questions
        WHERE order_in_part > ${currentQuestion.order_in_part}
        ORDER BY order_in_part ASC
        LIMIT 1
    `);

    if (!nextQuestion) {
        console.log('✅ No more questions - onboarding complete');
        return null;
    }

    return nextQuestion.question_code;
}

export default {
    evaluateBranching,
    getNextQuestion
};
