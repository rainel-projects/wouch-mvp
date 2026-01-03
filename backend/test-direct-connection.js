import { pool, querySchema } from './config/database.js';

console.log('🧪 Testing direct PostgreSQL connection...\n');

async function testConnection() {
    try {
        // Test 1: Basic connection
        console.log('1️⃣ Testing basic connection...');
        const { rows: versionRows } = await pool.query('SELECT version()');
        console.log('✅ Connected to PostgreSQL');
        console.log(`   Version: ${versionRows[0].version.substring(0, 50)}...\n`);

        // Test 2: List all schemas
        console.log('2️⃣ Listing all schemas...');
        const { rows: schemas } = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            ORDER BY schema_name
        `);
        console.log('✅ Found schemas:');
        schemas.forEach(s => console.log(`   - ${s.schema_name}`));
        console.log('');

        // Test 3: Query question_master_schema.questions
        console.log('3️⃣ Testing question_master_schema.questions...');
        const { rows: questions } = await querySchema(
            'question_master_schema',
            'SELECT question_code, question_text FROM questions LIMIT 3'
        );

        if (questions.length > 0) {
            console.log(`✅ Found ${questions.length} questions:`);
            questions.forEach(q => {
                console.log(`   - ${q.question_code}: ${q.question_text?.substring(0, 50)}...`);
            });
        } else {
            console.log('⚠️  No questions found (database might be empty)');
        }
        console.log('');

        // Test 4: Query journey_engine_schema.user_flows
        console.log('4️⃣ Testing journey_engine_schema.user_flows...');
        const { rows: flows } = await querySchema(
            'journey_engine_schema',
            'SELECT COUNT(*) as count FROM user_flows'
        );
        console.log(`✅ user_flows table accessible (${flows[0].count} rows)`);
        console.log('');

        console.log('='.repeat(60));
        console.log('✅ ALL TESTS PASSED!');
        console.log('Direct PostgreSQL connection is working correctly.');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Details:', error);
    } finally {
        await pool.end();
    }
}

testConnection();
