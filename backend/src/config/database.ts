import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,                  // max pool connections
    idleTimeoutMillis: 30000, // close idle connections after 30s
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const pool = new Pool(config);

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
    process.exit(-1);
});

export async function testConnection(): Promise<void> {
    try {
        const client = await pool.connect();
        const { rows } = await client.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected at', rows[0].now);
        client.release();
    } catch (err) {
        console.error('❌ PostgreSQL connection failed:', err);
        process.exit(1);
    }
}

/** Execute a parameterised query and return all rows */
export async function query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    const result = await pool.query<T>(text, params);
    return result.rows;
}

/** Execute a parameterised query and return the first row (or null) */
export async function queryOne<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T | null> {
    const result = await pool.query<T>(text, params);
    return result.rows[0] ?? null;
}
