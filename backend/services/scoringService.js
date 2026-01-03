import supabase from '../config/supabase.js';
import { executeSQL, querySingle } from '../utils/sqlExecutor.js';

/**
 * Scoring Service - Adapted for existing Supabase schema
 * Uses: score_rules (with 'points' column), user_scores, score_definitions
 */

/**
 * Apply score rules based on a question response
 */
export async function applyScoreRules(userId, sessionId, questionCode, responseValue) {
    console.log(`📊 Applying score rules for question: ${questionCode}, value: ${responseValue}`);

    // Fetch applicable score rules using SQL execution
    const rules = await executeSQL(`
        SELECT * FROM question_master_schema.score_rules
        WHERE source_question_code = '${questionCode}'
        AND status = 'active'
    `);

    if (!rules || rules.length === 0) {
        console.log('⚠️  No score rules found for this question');
        return { scores: {}, flags: [] };
    }

    // Evaluate rules and collect matching deltas
    const scoreDeltas = [];

    for (const rule of rules) {
        let matches = false;

        // Evaluate condition (existing schema uses 'condition' field as JSON)
        if (rule.condition) {
            try {
                const condition = typeof rule.condition === 'string' ? JSON.parse(rule.condition) : rule.condition;
                matches = evaluateCondition(condition, responseValue);
            } catch (e) {
                console.warn(`Failed to parse condition for rule ${rule.id}:`, e);
            }
        }

        if (matches) {
            console.log(`✅ Rule matched: ${rule.id} (+${rule.points} to ${rule.score_code})`);
            scoreDeltas.push({
                user_id: userId,
                session_id: sessionId,
                score_type: rule.score_code,
                delta: rule.points, // Using 'points' from existing schema
                source_rule_id: rule.id,
                created_at: new Date().toISOString()
            });
        }
    }

    // Write atomic score deltas using SQL execution
    if (scoreDeltas.length > 0) {
        for (const delta of scoreDeltas) {
            await executeSQL(`
                INSERT INTO insight_engine_schema.user_scores
                (user_id, session_id, score_type, delta, source_rule_id, created_at)
                VALUES (
                    '${delta.user_id}',
                    '${delta.session_id}',
                    '${delta.score_type}',
                    ${delta.delta},
                    '${delta.source_rule_id}',
                    '${delta.created_at}'
                )
            `);
        }
    }

    // Recalculate aggregated scores
    const aggregatedScores = await recalculateScores(userId, sessionId);

    // Check and raise flags
    const raisedFlags = await checkAndRaiseFlags(userId, sessionId, aggregatedScores);

    return {
        scores: aggregatedScores,
        flags: raisedFlags
    };
}

/**
 * Evaluate a condition object against a response value
 */
function evaluateCondition(condition, responseValue) {
    if (!condition) return false;

    const { operator, value } = condition;

    switch (operator) {
        case 'equals':
        case '==':
            return String(responseValue) === String(value);
        case 'greater_than':
        case '>':
            return Number(responseValue) > Number(value);
        case 'less_than':
        case '<':
            return Number(responseValue) < Number(value);
        case 'contains':
            return String(responseValue).includes(String(value));
        default:
            console.warn(`Unknown operator: ${operator}`);
            return false;
    }
}

/**
 * Recalculate aggregated scores from user_scores
 */
export async function recalculateScores(userId, sessionId) {
    console.log('🔢 Recalculating aggregated scores...');

    // Fetch all score deltas using SQL execution
    const userScores = await executeSQL(`
        SELECT score_type, delta FROM insight_engine_schema.user_scores
        WHERE user_id = '${userId}' AND session_id = '${sessionId}'
    `);

    // Aggregate by score_type
    const aggregated = {};

    if (userScores) {
        for (const score of userScores) {
            if (!aggregated[score.score_type]) {
                aggregated[score.score_type] = 0;
            }
            aggregated[score.score_type] += score.delta;
        }
    }

    // Fetch score definitions to get min/max values
    const definitions = await executeSQL(`
        SELECT score_code, output_min, output_max
        FROM question_master_schema.score_definitions
    `);

    const ranges = {};
    if (definitions) {
        for (const def of definitions) {
            ranges[def.score_code] = {
                min: def.output_min || 0,
                max: def.output_max || 100
            };
        }
    }

    // Clamp scores to [min, max]
    for (const [scoreCode, value] of Object.entries(aggregated)) {
        const range = ranges[scoreCode] || { min: 0, max: 100 };
        aggregated[scoreCode] = Math.max(range.min, Math.min(value, range.max));
    }

    // Persist aggregated scores to 'scores' table
    for (const [scoreCode, value] of Object.entries(aggregated)) {
        // Check if score exists
        const existingScore = await querySingle(`
            SELECT id FROM insight_engine_schema.scores
            WHERE user_id = '${userId}'
            AND session_id = '${sessionId}'
            AND score_code = '${scoreCode}'
        `);

        if (existingScore) {
            await executeSQL(`
                UPDATE insight_engine_schema.scores
                SET score_value = ${value},
                    updated_at = '${new Date().toISOString()}'
                WHERE id = '${existingScore.id}'
            `);
        } else {
            // Assume randomUUID is available or let DB handle ID if default
            await executeSQL(`
                INSERT INTO insight_engine_schema.scores
                (user_id, session_id, score_code, score_value, max_value, created_at)
                VALUES (
                    '${userId}',
                    '${sessionId}',
                    '${scoreCode}',
                    ${value},
                    ${ranges[scoreCode]?.max || 100},
                    '${new Date().toISOString()}'
                )
            `);
        }
    }

    console.log('✅ Scores calculated and persisted:', aggregated);
    return aggregated;
}

/**
 * Check score thresholds and raise flags
 */
export async function checkAndRaiseFlags(userId, sessionId, scores) {
    console.log('🚩 Checking for flags...');

    const raisedFlags = [];

    // Fetch score definitions with interpretation ranges using SQL execution
    const definitions = await executeSQL(`
        SELECT * FROM question_master_schema.score_definitions
    `);

    for (const def of definitions) {
        const scoreValue = scores[def.score_code];

        if (scoreValue === undefined) continue;

        // Parse interpretation_ranges to check for flags
        if (def.interpretation_ranges) {
            try {
                const ranges = typeof def.interpretation_ranges === 'string'
                    ? JSON.parse(def.interpretation_ranges)
                    : def.interpretation_ranges;

                // Check if score is in a flaggable range (e.g., "critical" or "high_risk")
                for (const range of ranges) {
                    if (range.flag && scoreValue >= range.min && scoreValue <= range.max) {
                        const flagCode = `${def.score_code}_${range.label}`;

                        // Check if flag already exists
                        const existingFlag = await querySingle(`
                            SELECT id FROM insight_engine_schema.user_flags
                            WHERE user_id = '${userId}'
                            AND session_id = '${sessionId}'
                            AND flag_code = '${flagCode}'
                            LIMIT 1
                        `);

                        if (!existingFlag) {
                            await executeSQL(`
                                INSERT INTO insight_engine_schema.user_flags
                                (user_id, session_id, flag_code, created_at)
                                VALUES (
                                    '${userId}',
                                    '${sessionId}',
                                    '${flagCode}',
                                    '${new Date().toISOString()}'
                                )
                            `);

                            console.log(`🚩 Flag raised: ${flagCode}`);
                            raisedFlags.push({ flag_code: flagCode });
                        }
                    }
                }
            } catch (e) {
                console.warn(`Failed to parse interpretation_ranges for ${def.score_code}:`, e);
            }
        }
    }

    return raisedFlags;
}

export default {
    applyScoreRules,
    recalculateScores,
    checkAndRaiseFlags
};
