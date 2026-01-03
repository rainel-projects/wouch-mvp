
import { executeSQL } from './utils/sqlExecutor.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log('Checking scores table schema...');
    try {
        const columns = await executeSQL(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'insight_engine_schema' 
            AND table_name = 'scores'
        `);
        console.log('Columns:', columns);
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
