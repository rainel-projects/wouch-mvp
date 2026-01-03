import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
    let output = '🔍 Checking Supabase Tables...\n\n';

    const tablesToCheck = [
        'users',
        'questions',
        'question_responses',
        'responses',
        'score_definitions',
        'score_rules',
        'user_scores',
        'scores',
        'user_flags',
        'branching_rules',
        'flows',
        'flow_steps',
        'flow_decision_points',
        'user_flows',
        'user_flow_events',
        'kai_lessons',
        'kai_lesson_content',
        'user_kai_progress',
        'modules',
        'module_content',
        'user_module_progress',
        'insights',
        'insight_conditions',
        'user_insights'
    ];

    const existingTables = [];
    const missingTables = [];
    const tableDetails = {};

    for (const tableName of tablesToCheck) {
        try {
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    output += `❌ ${tableName} - NOT FOUND\n`;
                    missingTables.push(tableName);
                } else {
                    output += `⚠️  ${tableName} - ERROR: ${error.message}\n`;
                }
            } else {
                output += `✅ ${tableName} (${count || 0} rows)\n`;
                existingTables.push(tableName);

                // Get column structure
                const { data: sample } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (sample && sample.length > 0) {
                    const columns = Object.keys(sample[0]);
                    output += `   📋 Columns: ${columns.join(', ')}\n\n`;
                    tableDetails[tableName] = { columns, rowCount: count || 0 };
                } else {
                    output += '\n';
                    tableDetails[tableName] = { columns: [], rowCount: count || 0 };
                }
            }
        } catch (err) {
            output += `❌ ${tableName} - EXCEPTION: ${err.message}\n`;
            missingTables.push(tableName);
        }
    }

    output += '\n' + '='.repeat(60) + '\n';
    output += `\n✅ Existing tables: ${existingTables.length}\n`;
    output += `❌ Missing tables: ${missingTables.length}\n`;

    if (missingTables.length > 0) {
        output += '\n📝 Missing tables that need to be created:\n';
        missingTables.forEach(t => output += `   - ${t}\n`);
    }

    output += '\n' + '='.repeat(60) + '\n';

    console.log(output);

    // Save to file
    fs.writeFileSync('schema-report.txt', output);
    fs.writeFileSync('schema-details.json', JSON.stringify({
        existing: existingTables,
        missing: missingTables,
        details: tableDetails
    }, null, 2));

    console.log('\n📄 Report saved to schema-report.txt');
    console.log('📄 Details saved to schema-details.json');
}

checkTables().catch(console.error);
