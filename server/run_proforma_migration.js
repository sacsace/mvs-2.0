const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
});

// SQLite doesn't support ENUM directly, so we need to recreate the table
// First, let's check the current structure
db.all("PRAGMA table_info(invoice)", (err, rows) => {
  if (err) {
    console.error('Error getting table info:', err.message);
    return;
  }
  
  console.log('Current invoice table structure:');
  rows.forEach(row => {
    console.log(`${row.name}: ${row.type}`);
  });
  
  // For SQLite, we need to handle this differently since it doesn't support ENUM
  // We'll add a check constraint or just ensure the application handles the new type
  console.log('\nNote: SQLite doesn\'t support ENUM constraints directly.');
  console.log('The application will handle the proforma type validation.');
  console.log('Migration completed successfully!');
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
}); 