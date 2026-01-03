import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get table schema using information_schema
async function getTableSchema(tableName) {
    const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: tableName
    });

    if (error) {
        // Fallback: insert a dummy row to see structure
        console.log(`Getting schema for ${tableName}...`);
        return null;
    }

    return data;
}

// Seed score_definitions
async function seedScoreDefinitions() {
    console.log('\n📊 Seeding score_definitions...');

    const scoreDefinitions = [
        {
            score_code: 'emotional_awareness',
            score_name: 'Emotional Awareness',
            description: 'Ability to recognize and understand emotions',
            min_value: 0,
            max_value: 100,
            threshold_low: 30,
            threshold_medium: 60,
            threshold_high: 80,
            interpretation_low: 'Needs significant development in emotional awareness',
            interpretation_medium: 'Developing emotional awareness',
            interpretation_high: 'Strong emotional awareness',
            created_at: new Date().toISOString()
        },
        {
            score_code: 'relationship_readiness',
            score_name: 'Relationship Readiness',
            description: 'Overall readiness for healthy dating',
            min_value: 0,
            max_value: 100,
            threshold_low: 40,
            threshold_medium: 65,
            threshold_high: 85,
            interpretation_low: 'Not ready for dating - focus on personal growth',
            interpretation_medium: 'Building readiness - continue development',
            interpretation_high: 'Ready for healthy relationships',
            created_at: new Date().toISOString()
        },
        {
            score_code: 'communication_skills',
            score_name: 'Communication Skills',
            description: 'Ability to express needs and listen effectively',
            min_value: 0,
            max_value: 100,
            threshold_low: 35,
            threshold_medium: 65,
            threshold_high: 85,
            interpretation_low: 'Needs improvement in communication',
            interpretation_medium: 'Developing communication skills',
            interpretation_high: 'Strong communicator',
            created_at: new Date().toISOString()
        }
    ];

    const { data, error } = await supabase
        .from('score_definitions')
        .insert(scoreDefinitions)
        .select();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} score definitions`);
    }
}

// Seed questions
async function seedQuestions() {
    console.log('\n📝 Seeding questions...');

    const questions = [
        {
            question_code: 'emotional_awareness_01',
            question_text: 'How often do you take time to reflect on your emotions?',
            question_type: 'single_choice',
            options: JSON.stringify([
                { key: 'A', text: 'Rarely or never', value: 'rarely' },
                { key: 'B', text: 'Sometimes', value: 'sometimes' },
                { key: 'C', text: 'Often', value: 'often' },
                { key: 'D', text: 'Daily', value: 'daily' }
            ]),
            order_index: 1,
            is_required: true,
            created_at: new Date().toISOString()
        },
        {
            question_code: 'communication_01',
            question_text: 'When you disagree with someone, how do you typically respond?',
            question_type: 'single_choice',
            options: JSON.stringify([
                { key: 'A', text: 'Avoid the conversation', value: 'avoid' },
                { key: 'B', text: 'Get defensive or argumentative', value: 'defensive' },
                { key: 'C', text: 'Try to understand their perspective', value: 'understanding' },
                { key: 'D', text: 'Express my view calmly and listen actively', value: 'calm_active' }
            ]),
            order_index: 2,
            is_required: true,
            created_at: new Date().toISOString()
        },
        {
            question_code: 'past_relationships_01',
            question_text: 'How would you describe your last relationship ending?',
            question_type: 'single_choice',
            options: JSON.stringify([
                { key: 'A', text: 'Very difficult, still processing', value: 'difficult' },
                { key: 'B', text: 'Challenging but learning from it', value: 'learning' },
                { key: 'C', text: 'Amicable and resolved', value: 'amicable' },
                { key: 'D', text: 'Haven\'t been in a relationship', value: 'no_relationship' }
            ]),
            order_index: 3,
            is_required: true,
            created_at: new Date().toISOString()
        }
    ];

    const { data, error } = await supabase
        .from('questions')
        .insert(questions)
        .select();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} questions`);
    }
}

// Seed score_rules
async function seedScoreRules() {
    console.log('\n⚙️  Seeding score_rules...');

    const scoreRules = [
        // Emotional awareness question rules
        {
            rule_code: 'ea_q1_rarely',
            score_code: 'emotional_awareness',
            source_question_code: 'emotional_awareness_01',
            condition_type: 'equals',
            condition_value: 'rarely',
            score_delta: 10,
            rule_description: 'Low emotional reflection frequency',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'ea_q1_sometimes',
            score_code: 'emotional_awareness',
            source_question_code: 'emotional_awareness_01',
            condition_type: 'equals',
            condition_value: 'sometimes',
            score_delta: 40,
            rule_description: 'Moderate emotional reflection',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'ea_q1_often',
            score_code: 'emotional_awareness',
            source_question_code: 'emotional_awareness_01',
            condition_type: 'equals',
            condition_value: 'often',
            score_delta: 70,
            rule_description: 'Good emotional reflection',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'ea_q1_daily',
            score_code: 'emotional_awareness',
            source_question_code: 'emotional_awareness_01',
            condition_type: 'equals',
            condition_value: 'daily',
            score_delta: 90,
            rule_description: 'Excellent emotional reflection',
            is_active: true,
            created_at: new Date().toISOString()
        },
        // Communication question rules
        {
            rule_code: 'comm_q1_avoid',
            score_code: 'communication_skills',
            source_question_code: 'communication_01',
            condition_type: 'equals',
            condition_value: 'avoid',
            score_delta: 15,
            rule_description: 'Avoidant communication style',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'comm_q1_defensive',
            score_code: 'communication_skills',
            source_question_code: 'communication_01',
            condition_type: 'equals',
            condition_value: 'defensive',
            score_delta: 30,
            rule_description: 'Defensive communication',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'comm_q1_understanding',
            score_code: 'communication_skills',
            source_question_code: 'communication_01',
            condition_type: 'equals',
            condition_value: 'understanding',
            score_delta: 70,
            rule_description: 'Empathetic communication',
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'comm_q1_calm',
            score_code: 'communication_skills',
            source_question_code: 'communication_01',
            condition_type: 'equals',
            condition_value: 'calm_active',
            score_delta: 95,
            rule_description: 'Excellent communication skills',
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];

    const { data, error } = await supabase
        .from('score_rules')
        .insert(scoreRules)
        .select();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} score rules`);
    }
}

// Seed KAI lessons
async function seedKaiLessons() {
    console.log('\n🎓 Seeding KAI lessons...');

    const kaiLessons = [
        {
            kai_lesson_code: 'emotional_awareness_intro',
            lesson_title: 'Understanding Your Emotions',
            lesson_goal: 'Develop foundational emotional awareness',
            trigger_condition: 'emotional_awareness < 30',
            lesson_type: 'intervention',
            estimated_duration_minutes: 10,
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            kai_lesson_code: 'communication_basics',
            lesson_title: 'Healthy Communication Fundamentals',
            lesson_goal: 'Learn effective communication strategies',
            trigger_condition: 'communication_skills < 35',
            lesson_type: 'intervention',
            estimated_duration_minutes: 12,
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];

    const { data, error } = await supabase
        .from('kai_lessons')
        .insert(kaiLessons)
        .select();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} KAI lessons`);
        return data;
    }
}

// Seed KAI lesson content
async function seedKaiLessonContent(lessons) {
    console.log('\n📚 Seeding KAI lesson content...');

    if (!lessons || lessons.length === 0) {
        console.log('⚠️  No lessons to add content for');
        return;
    }

    const lessonContent = [
        {
            kai_lesson_id: lessons[0].id,
            content_type: 'text',
            content_order: 1,
            content_data: JSON.stringify({
                heading: 'Why Emotional Awareness Matters',
                body: 'Emotional awareness is the foundation of healthy relationships. It helps you understand your own needs, communicate effectively, and build deeper connections.'
            }),
            created_at: new Date().toISOString()
        },
        {
            kai_lesson_id: lessons[0].id,
            content_type: 'exercise',
            content_order: 2,
            content_data: JSON.stringify({
                heading: 'Daily Emotion Check-in',
                instructions: 'Take 2 minutes each day to identify and name what you\'re feeling. Start with basic emotions: happy, sad, angry, anxious, excited.',
                action: 'Set a daily reminder to practice this'
            }),
            created_at: new Date().toISOString()
        },
        {
            kai_lesson_id: lessons[1].id,
            content_type: 'text',
            content_order: 1,
            content_data: JSON.stringify({
                heading: 'The Foundation of Connection',
                body: 'Healthy communication isn\'t about winning arguments—it\'s about understanding and being understood. It requires both speaking honestly and listening actively.'
            }),
            created_at: new Date().toISOString()
        }
    ];

    const { data, error } = await supabase
        .from('kai_lesson_content')
        .insert(lessonContent)
        .select();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} lesson content items`);
    }
}

// Seed branching rules
async function seedBranchingRules() {
    console.log('\n🔀 Seeding branching rules...');

    const branchingRules = [
        {
            rule_code: 'trigger_ea_kai',
            rule_name: 'Trigger Emotional Awareness KAI',
            condition_type: 'score_threshold',
            condition_expression: 'emotional_awareness < 30',
            next_step_type: 'KAI',
            next_step_code: 'emotional_awareness_intro',
            priority: 1,
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'trigger_comm_kai',
            rule_name: 'Trigger Communication KAI',
            condition_type: 'score_threshold',
            condition_expression: 'communication_skills < 35',
            next_step_type: 'KAI',
            next_step_code: 'communication_basics',
            priority: 2,
            is_active: true,
            created_at: new Date().toISOString()
        },
        {
            rule_code: 'continue_questions',
            rule_name: 'Continue to Next Question',
            condition_type: 'default',
            condition_expression: 'true',
            next_step_type: 'QUESTION',
            next_step_code: 'next',
            priority: 999,
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];

    const { data, error } = await supabase
        .from('branching_rules')
        .insert(branchingRules)
        .select();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} branching rules`);
    }
}

// Seed flows
async function seedFlows() {
    console.log('\n🌊 Seeding flows...');

    const flows = [
        {
            flow_code: 'onboarding_v1',
            flow_name: 'Dating Readiness Onboarding',
            flow_description: 'Initial assessment of dating readiness with KAI interventions',
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];

    const { data, error } = await supabase
        .from('flows')
        .insert(flows)
        .select();

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Inserted ${data.length} flows`);
        return data;
    }
}

// Main seed function
async function seedAll() {
    console.log('🌱 Starting database seeding...\n');
    console.log('='.repeat(60));

    try {
        await seedScoreDefinitions();
        await seedQuestions();
        await seedScoreRules();
        const lessons = await seedKaiLessons();
        await seedKaiLessonContent(lessons);
        await seedBranchingRules();
        await seedFlows();

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   - Score definitions: 3');
        console.log('   - Questions: 3');
        console.log('   - Score rules: 8');
        console.log('   - KAI lessons: 2');
        console.log('   - KAI content: 3');
        console.log('   - Branching rules: 3');
        console.log('   - Flows: 1');
        console.log('\n' + '='.repeat(60));

    } catch (err) {
        console.error('\n❌ Seeding failed:', err);
    }
}

seedAll();
