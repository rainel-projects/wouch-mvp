import supabase from '../config/supabase.js';

/**
 * Execute raw SQL query via Supabase RPC
 * This bypasses PostgREST and directly queries the database
 */
export async function executeSQL(queryText) {
    const { data, error } = await supabase.rpc('execute_sql_json', {
        query_text: queryText
    });

    if (error) {
        console.error('SQL execution error:', error);
        throw new Error(`SQL execution failed: ${error.message}`);
    }

    return data || [];
}

/**
 * Helper to query a single row
 */
export async function querySingle(queryText) {
    const results = await executeSQL(queryText);
    return results[0] || null;
}

/**
 * Helper to insert and return inserted row
 */
export async function insertAndReturn(schema, table, data) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map(v =>
        v === null ? 'NULL' :
            typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` :
                v
    ).join(', ');

    const query = `
        INSERT INTO ${schema}.${table} (${columns})
        VALUES (${values})
        RETURNING *
    `;

    return querySingle(query);
}

/**
 * Helper to update rows
 */
export async function updateRows(schema, table, data, where) {
    const setClauses = Object.entries(data)
        .map(([key, value]) => {
            const val = value === null ? 'NULL' :
                typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` :
                    value;
            return `${key} = ${val}`;
        })
        .join(', ');

    const whereClauses = Object.entries(where)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(' AND ');

    const query = `
        UPDATE ${schema}.${table}
        SET ${setClauses}
        WHERE ${whereClauses}
        RETURNING *
    `;

    return executeSQL(query);
}

export default { executeSQL, querySingle, insertAndReturn, updateRows };
