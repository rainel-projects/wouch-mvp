
import { executeSQL } from './utils/sqlExecutor.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const tables = await executeSQL(`
            SELECT table_schema 
            FROM information_schema.tables 
            WHERE table_name = 'user_scores'
        `);

        if (tables && tables.length > 0) {
            const schema = tables[0].table_schema;
            const cols = await executeSQL(`
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_schema = '${schema}' 
                AND table_name = 'user_scores'
            `);
            console.log(JSON.stringify(cols, null, 2));
        } else {
            console.log('NOT_FOUND');
        }
    } catch (e) {
        console.error(e);
    }
}
check();
