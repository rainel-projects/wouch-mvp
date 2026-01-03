
import { executeSQL } from './utils/sqlExecutor.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function findTables() {
    try {
        const tables = await executeSQL(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'question_responses'
        `);
        fs.writeFileSync('tables_found.json', JSON.stringify(tables, null, 2));
    } catch (e) {
        console.error(e);
    }
}
findTables();
