require('dotenv').config({ path : '../.env' });
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,  
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL.');
  hashPasswords();
});

function hashPasswords() {
  const selectQuery = 'SELECT id, password FROM users';

  db.query(selectQuery, async (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      db.end();
      return;
    }

    for (const user of results) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';

      db.query(updateQuery, [hashedPassword, user.id], (updateErr) => {
        if (updateErr) {
          console.error(`Failed to update user ${user.id}:`, updateErr);
        } else {
          console.log(`User ${user.id} password updated.`);
        }
      });
    }

    setTimeout(() => {
      console.log('Finished hashing all passwords.');
      db.end();
    }, 2000); // slight delay to allow all queries to finish
  });
}
