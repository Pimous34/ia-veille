const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Use explicit config to check password without encoding issues
  user: 'postgres.pjiobifgcvdapikurlbn',
  password: 'SuperPassword2025!', 
  host: 'aws-1-eu-west-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function restoreDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📖 Reading backup file...');
    const backupPath = path.join(__dirname, 'supabase', 'backup_schema.sql');
    const sql = fs.readFileSync(backupPath, 'utf8');

    console.log(`🚀 Executing SQL script (${sql.length} chars)...`);
    
    // Split commands slightly safely if possible, or execute mostly efficiently
    // Simple execution might fail on transactions if inside transaction block?
    // Dump usually contains transactions.
    
    await client.query(sql);
    
    console.log('✨ Restoration complete!');
  } catch (err) {
    console.error('❌ Restoration failed:', err);
    if (err.code === 'ENOTFOUND') {
      console.error('⚠️ Host resolution failed. Check the project ID and host URL.');
    }
  } finally {
    await client.end();
  }
}

restoreDatabase();
