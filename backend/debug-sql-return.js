
import { executeSQL } from './utils/sqlExecutor.js';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'test-verify-001';
const sessionId = 'session-verify-001';

async function check() {
    console.log('Testing executeSQL return type...');
    try {
        const result = await executeSQL(`
            SELECT score_type, delta FROM insight_engine_schema.user_scores
            WHERE user_id = '${userId}' AND session_id = '${sessionId}'
        `);
        console.log('Type:', typeof result);
        console.log('IsArray:', Array.isArray(result));
        console.log('Value:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('ERROR:', e);
    }
}
check();
