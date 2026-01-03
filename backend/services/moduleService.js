import supabase from '../config/supabase.js';
import { recalculateScores } from './scoringService.js';

/**
 * Module Service - Adapted for existing Supabase schema
 * Uses: modules, module_content, user_module_progress tables
 * Note: KAI is handled through modules in existing schema
 */

/**
 * Unlock a module for a user
 */
export async function unlockModule(userId, sessionId, moduleId) {
    console.log(`🔓 Unlocking module: ${moduleId}`);

    // Fetch module details
    const { data: module, error: moduleError } = await supabase
        .schema('learning_engine_schema')
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .eq('status', 'active')
        .single();

    if (moduleError || !module) {
        throw new Error(`Module not found: ${moduleId}`);
    }

    // Check if already unlocked
    const { data: existing } = await supabase
        .schema('learning_engine_schema')
        .from('user_module_progress')
        .select('id, unlocked, completed')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single();

    if (existing) {
        console.log('ℹ️  Module already unlocked');
        return module;
    }

    // Unlock the module
    const { error: unlockError } = await supabase
        .schema('learning_engine_schema')
        .from('user_module_progress')
        .insert({
            user_id: userId,
            module_id: moduleId,
            unlocked: true,
            completed: false
        });

    if (unlockError) {
        throw new Error(`Failed to unlock module: ${unlockError.message}`);
    }

    console.log(`✅ Module unlocked: ${module.title}`);
    return module;
}

/**
 * Mark module as completed
 */
export async function completeModule(userId, sessionId, moduleId) {
    console.log(`✅ Completing module: ${moduleId}`);

    // Mark as completed
    const { error: updateError } = await supabase
        .schema('learning_engine_schema')
        .from('user_module_progress')
        .update({
            completed: true,
            completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('module_id', moduleId);

    if (updateError) {
        throw new Error(`Failed to mark module complete: ${updateError.message}`);
    }

    // Recalculate scores (modules may have associated score boosts)
    const updatedScores = await recalculateScores(userId, sessionId);

    console.log(`✅ Module completed`);
    return updatedScores;
}

/**
 * Get module content
 */
export async function getModuleContent(moduleId) {
    // Fetch module
    const { data: module, error: moduleError } = await supabase
        .schema('learning_engine_schema')
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

    if (moduleError || !module) {
        throw new Error(`Module not found: ${moduleId}`);
    }

    // Fetch content
    const { data: content, error: contentError } = await supabase
        .schema('learning_engine_schema')
        .from('module_content')
        .select('*')
        .eq('module_id', moduleId)
        .order('content_order', { ascending: true });

    if (contentError) {
        throw new Error(`Failed to fetch module content: ${contentError.message}`);
    }

    return {
        ...module,
        content: content || []
    };
}

export default {
    unlockModule,
    completeModule,
    getModuleContent
};
