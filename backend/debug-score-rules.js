
import { executeSQL } from './utils/sqlExecutor.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log('Checking score_rules schema...');
    try {
        const tables = await executeSQL(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'score_rules'
        `);

        if (tables && tables.length > 0) {
            const schema = tables[0].table_schema;
            console.log(`FOUND_SCHEMA: ${schema}`);

            const cols = await executeSQL(`
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_schema = '${schema}' 
                AND table_name = 'score_rules'
            `);
            const colNames = cols.map(c => c.column_name);
            console.log(`COLUMNS: ${colNames.join(', ')}`);
        } else {
            console.log('NOT_FOUND: score_rules');
        }

    } catch (e) {
        console.error('ERROR:', e);
    }
}
check();
