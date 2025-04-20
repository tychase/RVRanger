// Run the migration to add search_vector column
import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use DATABASE_URL from environment variables 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('Starting migration to add search_vector column...');
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'add_search_vector.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute SQL
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Migration completed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Migration failed:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();