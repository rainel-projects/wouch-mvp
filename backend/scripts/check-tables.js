import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
    console.log('🔍 Checking table structures...\n');

    const tables = ['user_flows', 'questions', 'user_flow_events'];

    for (const tableName of tables) {
        console.log(`\n📋 Table: ${tableName}`);
        console.log('='.repeat(50));

        // Try to select all columns from one row
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log(`   Code: ${error.code}`);
            console.log(`   Details: ${JSON.stringify(error.details)}`);
            console.log(`   Hint: ${error.hint}`);
        } else if (data && data.length > 0) {
            console.log('✅ Columns:', Object.keys(data[0]).join(', '));
        } else {
            console.log('⚠️  Table is empty, trying insert to see structure...');

            // Try a minimal insert to see what columns are required
            const testData = { id: 'test_' + Date.now() };
            const { error: insertError } = await supabase
                .from(tableName)
                .insert(testData);

            if (insertError) {
                console.log(`   Error details: ${insertError.message}`);
                console.log(`   Hint: ${insertError.hint}`);
            }
        }
    }
}

checkTableStructure();
