import supabase from '../config/supabase.js';
import { recalculateScores } from './scoringService.js';

/**
 * KAI Service - Using existing modules table for KAI lessons
 * KAI lessons are special modules marked with specific criteria
 */

/**
 * Unlock a KAI lesson (module) for a user
 */
export async function unlockKaiLesson(userId, sessionId, kaiLessonId) {
    console.log(`🔓 Unlocking KAI lesson: ${kaiLessonId}`);

    // Fetch module (KAI lesson) details
    const { data: lesson, error: lessonError } = await supabase
        .schema('learning_engine_schema')
        .from('modules')
        .select('*')
        .eq('id', kaiLessonId)
        .eq('status', 'active')
        .single();

    if (lessonError || !lesson) {
        throw new Error(`KAI lesson not found: ${kaiLessonId}`);
    }

    // Check if already unlocked
    const { data: existing } = await supabase
        .schema('learning_engine_schema')
        .from('user_module_progress')
        .select('id, unlocked, completed')
        .eq('user_id', userId)
        .eq('module_id', kaiLessonId)
        .single();

    if (existing) {
        console.log('ℹ️  KAI lesson already unlocked');
        return lesson;
    }

    // Unlock the KAI lesson
    const { error: unlockError } = await supabase
        .schema('learning_engine_schema')
        .from('user_module_progress')
        .insert({
            user_id: userId,
            module_id: kaiLessonId,
            unlocked: true,
            completed: false
        });

    if (unlockError) {
        throw new Error(`Failed to unlock KAI lesson: ${unlockError.message}`);
    }

    console.log(`✅ KAI lesson unlocked: ${lesson.title}`);
    return lesson;
}

/**
 * Mark KAI lesson as completed and trigger rescoring
 */
export async function completeKaiLesson(userId, sessionId, kaiLessonId) {
    console.log(`✅ Completing KAI lesson: ${kaiLessonId}`);

    // Mark as completed
    const { error: updateError } = await supabase
        .schema('learning_engine_schema')
        .from('user_module_progress')
        .update({
            completed: true,
            completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('module_id', kaiLessonId);

    if (updateError) {
        throw new Error(`Failed to mark KAI lesson complete: ${updateError.message}`);
    }

    // Apply KAI score boost (if any score rules exist for this KAI lesson)
    await applyKaiScoreBoost(userId, sessionId, kaiLessonId);

    // Recalculate scores after KAI completion
    const updatedScores = await recalculateScores(userId, sessionId);

    console.log(`✅ KAI lesson completed, scores updated`);
    return updatedScores;
}

/**
 * Apply score boost after KAI completion
 */
async function applyKaiScoreBoost(userId, sessionId, kaiLessonId) {
    console.log('📈 Applying KAI score boost...');

    // Fetch score rules for this KAI lesson
    // In existing schema, we might use component='KAI' or similar
    const { data: rules, error } = await supabase
        .schema('question_master_schema')
        .from('score_rules')
        .select('*')
        .eq('component', 'KAI')
        .eq('status', 'active');

    if (error) {
        console.warn('Failed to fetch KAI score rules:', error.message);
        return;
    }

    if (!rules || rules.length === 0) {
        console.log('⚠️  No KAI score boost rules found');
        return;
    }

    // Apply each rule
    const scoreDeltas = [];

    for (const rule of rules) {
        // Check if rule applies to this specific KAI lesson
        // This might be stored in rule.condition or similar
        scoreDeltas.push({
            user_id: userId,
            session_id: sessionId,
            score_type: rule.score_code,
            delta: rule.points,
            source_rule_id: rule.id,
            created_at: new Date().toISOString()
        });
    }

    if (scoreDeltas.length > 0) {
        const { error: insertError } = await supabase
            .schema('insight_engine_schema')
            .from('user_scores')
            .insert(scoreDeltas);

        if (insertError) {
            console.error('Failed to insert KAI score deltas:', insertError.message);
        } else {
            console.log(`✅ Applied ${scoreDeltas.length} KAI score boosts`);
        }
    }
}

/**
 * Get KAI lesson content
 */
export async function getKaiLessonContent(kaiLessonId) {
    // Fetch module (KAI lesson)
    const { data: lesson, error: lessonError } = await supabase
        .schema('learning_engine_schema')
        .from('modules')
        .select('*')
        .eq('id', kaiLessonId)
        .single();

    if (lessonError || !lesson) {
        throw new Error(`KAI lesson not found: ${kaiLessonId}`);
    }

    // Fetch content
    const { data: content, error: contentError } = await supabase
        .schema('learning_engine_schema')
        .from('module_content')
        .select('*')
        .eq('module_id', kaiLessonId)
        .order('content_order', { ascending: true });

    if (contentError) {
        throw new Error(`Failed to fetch KAI lesson content: ${contentError.message}`);
    }

    return {
        id: lesson.id,
        lesson_title: lesson.title,
        lesson_goal: lesson.activity_description || lesson.content_outline,
        estimated_duration_minutes: lesson.duration_minutes,
        content: content || []
    };
}

export default {
    unlockKaiLesson,
    completeKaiLesson,
    getKaiLessonContent
};
