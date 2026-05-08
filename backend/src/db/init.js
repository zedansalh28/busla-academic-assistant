const { initializeDatabase } = require('./schema');
const db = require('./connection');

initializeDatabase();
console.log('✓ Database initialization complete');
process.exit(0);
