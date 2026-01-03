
import { executeSQL } from './utils/sqlExecutor.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const tables = await executeSQL(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'question_responses'
        `);

        let output = '';
        if (tables && tables.length > 0) {
            const schema = tables[0].table_schema;
            output += `FOUND_SCHEMA: ${schema}\n`;

            const cols = await executeSQL(`
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_schema = '${schema}' 
                AND table_name = 'question_responses'
            `);
            const colDetails = cols.map(c => `${c.column_name} (${c.data_type})`).join('\n');
            output += `COLUMNS:\n${colDetails}\n`;
        } else {
            output += 'NOT_FOUND\n';
        }

        fs.writeFileSync('debug-output.txt', output);
        console.log('Done writing debug-output.txt');

    } catch (error) {
        console.error('ERROR:', error);
        fs.writeFileSync('debug-output.txt', `ERROR: ${error.message}`);
    }
}

check();
