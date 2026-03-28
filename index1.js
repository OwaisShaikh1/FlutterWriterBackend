

require('dotenv').config({ path :'./.env' });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// const { MongoClient, ServerApiVersion } = require('mongodb');
// const = "mongodb+srv://323mohammed0050:d14fcVdkzeeReZzi@flinn.tqooslh.mongodb.net/?retryWrites=true&w=majority&appName=Flinn";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Global request logger — logs every incoming request before routing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${ms}ms) | Auth: ${req.headers['authorization'] ? 'YES' : 'NO'}`);
  });
  next();
});


// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.log('DB connection error:', err);
  } else {
    console.log('Connected to MySQL!');
    
    // Ensure tables and columns exist
    db.query(`CREATE TABLE IF NOT EXISTS follows (
      id INT AUTO_INCREMENT PRIMARY KEY,
      follower_id INT NOT NULL,
      following_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_follow (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    )`, err => {
      if (err) console.error('Error creating follows table:', err);
    });

    // Deduplicate chapters: keep only the highest id per (item_id, number) pair
    db.query(`
      DELETE c1 FROM chapters c1
      INNER JOIN chapters c2
        ON c1.item_id = c2.item_id AND c1.number = c2.number AND c1.id < c2.id
    `, err => {
      if (err) console.error('Error deduplicating chapters:', err);
      else {
        // Add UNIQUE constraint if it doesn't already exist
        db.query(`
          SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'chapters'
            AND CONSTRAINT_NAME = 'unique_chapter_per_item'
        `, (err, rows) => {
          if (!err && rows[0].cnt === 0) {
            db.query(`ALTER TABLE chapters ADD UNIQUE KEY unique_chapter_per_item (item_id, number)`, err => {
              if (err) console.error('Error adding unique constraint to chapters:', err);
              else console.log('✅ Added UNIQUE(item_id, number) to chapters');
            });
          }
        });
      }
    });

    // Deduplicate items: keep only the highest id per (author_id, name, type)
    db.query(`
      DELETE i1 FROM items i1
      INNER JOIN items i2
        ON i1.author_id = i2.author_id
        AND i1.name = i2.name
        AND i1.type = i2.type
        AND i1.id < i2.id
    `, err => {
      if (err) console.error('Error deduplicating items:', err);
      else {
        // Add UNIQUE constraint if it doesn't already exist
        db.query(`
          SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'items'
            AND CONSTRAINT_NAME = 'unique_item_per_author'
        `, (err, rows) => {
          if (!err && rows[0].cnt === 0) {
            db.query(`ALTER TABLE items ADD UNIQUE KEY unique_item_per_author (author_id, name, type)`, err => {
              if (err) console.error('Error adding unique constraint to items:', err);
              else console.log('✅ Added UNIQUE(author_id, name, type) to items');
            });
          }
        });
      }
    });

    // Create changelog table for efficient sync
    db.query(`CREATE TABLE IF NOT EXISTS changelog (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entity_type ENUM('item', 'chapter') NOT NULL,
      entity_id INT NOT NULL,
      parent_id INT NULL,
      operation ENUM('create', 'update', 'delete') NOT NULL,
      user_id INT,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_changed_at (changed_at),
      INDEX idx_entity_type (entity_type, entity_id)
    )`, err => {
      if (err) console.error('Error creating changelog table:', err);
      else console.log('Changelog table ready');
    });

    db.query(`SHOW COLUMNS FROM users LIKE 'bio'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE users ADD COLUMN bio TEXT`, err => {
          if (err) console.error('Error adding bio column:', err);
        });
      }
    });

    db.query(`SHOW COLUMNS FROM users LIKE 'created_at'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, err => {
          if (err) console.error('Error adding created_at column:', err);
        });
      }
    });

    db.query(`SHOW COLUMNS FROM items LIKE 'author_id'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE items ADD COLUMN author_id INT`, err => {
          if (err) console.error('Error adding author_id column to items:', err);
        });
      }
    });

    db.query(`SHOW COLUMNS FROM users LIKE 'library'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE users ADD COLUMN library JSON DEFAULT NULL`, err => {
          if (err) console.error('Error adding library column:', err);
        });
      }
    });

    // Add timestamps to items table
    db.query(`SHOW COLUMNS FROM items LIKE 'created_at'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE items ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, err => {
          if (err) console.error('Error adding created_at to items:', err);
          else console.log('✅ Added created_at to items');
        });
      }
    });

    db.query(`SHOW COLUMNS FROM items LIKE 'updated_at'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`, err => {
          if (err) console.error('Error adding updated_at to items:', err);
          else console.log('✅ Added updated_at to items');
        });
      }
    });

    // Add client_request_id for idempotent mobile create retries
    db.query(`SHOW COLUMNS FROM items LIKE 'client_request_id'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE items ADD COLUMN client_request_id VARCHAR(128) NULL`, err => {
          if (err) console.error('Error adding client_request_id to items:', err);
          else console.log('✅ Added client_request_id to items');
        });
      }
    });

    db.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'items'
        AND CONSTRAINT_NAME = 'unique_item_client_request_id'
    `, (err, rows) => {
      if (!err && rows[0].cnt === 0) {
        db.query(`ALTER TABLE items ADD UNIQUE KEY unique_item_client_request_id (client_request_id)`, err => {
          if (err) console.error('Error adding unique constraint to client_request_id:', err);
          else console.log('✅ Added UNIQUE(client_request_id) to items');
        });
      }
    });

    // Add timestamps to chapters table
    db.query(`SHOW COLUMNS FROM chapters LIKE 'created_at'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE chapters ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, err => {
          if (err) console.error('Error adding created_at to chapters:', err);
          else console.log('✅ Added created_at to chapters');
        });
      }
    });

    db.query(`SHOW COLUMNS FROM chapters LIKE 'updated_at'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE chapters ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`, err => {
          if (err) console.error('Error adding updated_at to chapters:', err);
          else console.log('✅ Added updated_at to chapters');
        });
      }
    });

    // Add version columns for conflict resolution
    db.query(`SHOW COLUMNS FROM items LIKE 'version'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE items ADD COLUMN version INT DEFAULT 1`, err => {
          if (err) console.error('Error adding version to items:', err);
          else console.log('✅ Added version to items');
        });
      }
    });

    db.query(`SHOW COLUMNS FROM chapters LIKE 'version'`, (err, results) => {
      if (!err && results.length === 0) {
        db.query(`ALTER TABLE chapters ADD COLUMN version INT DEFAULT 1`, err => {
          if (err) console.error('Error adding version to chapters:', err);
          else console.log('✅ Added version to chapters');
        });
      }
    });
  }
});

const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d', // 30 days - persist login until logout
  });

  return token;
};

// Helper function to log changes to changelog table
const logChange = (entityType, entityId, operation, userId = null, parentId = null) => {
  db.query(
    'INSERT INTO changelog (entity_type, entity_id, parent_id, operation, user_id) VALUES (?, ?, ?, ?, ?)',
    [entityType, entityId, parentId, operation, userId],
    (err) => {
      if (err) console.error('Error logging change:', err);
    }
  );
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.warn(`🔒 AUTH FAIL [${req.method} ${req.originalUrl}]: No token provided`);
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.warn(`🔒 AUTH FAIL [${req.method} ${req.originalUrl}]: ${err.message}`);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Optional auth - doesn't fail if no token, just sets req.user to null
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    req.user = err ? null : user;
    next();
  });
}

app.post('/verify-token', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ valid: false, message: 'Token missing' });
  }

  // Use jwt.verify to check if the token is valid
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ valid: false, message: 'Invalid or expired token' });
    }

    // If the token is valid, send back the user info
    return res.json({ valid: true, user: decoded });
  });
});

app.get('/', (req, res) => {
  res.send('API is running');
});

// Health check endpoint for connectivity testing
app.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is reachable',
    timestamp: new Date().toISOString()
  });
});

app.post('/register', async (req, res) => {
  const { Name, username, password, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkSql = 'SELECT * FROM users WHERE username = ?';
    db.query(checkSql, [username], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('Error checking user:', checkErr);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (checkResult.length > 0) {
        return res.status(409).json({ success: false, message: 'Username already exists' });
      }

      const insertSql = 'INSERT INTO users (Name, username, password, email) VALUES (?, ?, ?, ?)';
      db.query(insertSql, [Name, username, hashedPassword, email], (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting user:', insertErr);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        const user = {
          id: result.insertId,
          username,
        };

        const token = generateToken(user);

        return res.status(201).json({
          success: true,
          message: 'User registered successfully',
          token,
        });
      });
    });
  } catch (err) {
    console.error('Error hashing password:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password); // compare hashed password
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Create JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, username: user.username, name: user.Name }, // include name for display
      token,
    });
  });
});

// ✅ Serve static images
app.use('/static/images', express.static(path.join(__dirname, 'static', 'images')));  // <-- New line

app.get('/users', authenticateToken, (req, res) => {
  db.query('SELECT username FROM users', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Get user profile
app.get('/users/:id', optionalAuth, (req, res) => {
  const profileId = req.params.id;
  const currentUserId = req.user ? req.user.id : null;

  const query = `
    SELECT 
      u.id, 
      u.Name as name, 
      u.username, 
      u.email, 
      u.bio, 
      u.library,
      (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following,
      (SELECT COUNT(*) FROM items WHERE author_id = u.id) as posts,
      u.created_at as createdAt,
      ${currentUserId ? `(SELECT COUNT(*) > 0 FROM follows WHERE follower_id = ${currentUserId} AND following_id = u.id)` : 'FALSE'} as is_followed_by_user
    FROM users u
    WHERE u.id = ?
  `;

  db.query(query, [profileId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(results[0]);
  });
});

// Toggle follow
app.post('/users/:id/follow', authenticateToken, (req, res) => {
  const followingId = req.params.id;
  const followerId = req.user.id;

  if (followerId == followingId) {
    return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
  }

  // Check if already following
  db.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId], (err, results) => {
    if (err) {
      console.error('Error checking follow status:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      // Unfollow
      db.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId], (deleteErr) => {
        if (deleteErr) {
          console.error('Error unfollowing:', deleteErr);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Get new counts
        db.query(`SELECT 
          (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
          (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following`, 
          [followingId, followingId], (countErr, countResult) => {
          res.status(200).json({ success: true, followed: false, followers: countResult[0].followers });
        });
      });
    } else {
      // Follow
      db.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [followerId, followingId], (insertErr) => {
        if (insertErr) {
          console.error('Error following:', insertErr);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Get new counts
        db.query(`SELECT 
          (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
          (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following`, 
          [followingId, followingId], (countErr, countResult) => {
          res.status(200).json({ success: true, followed: true, followers: countResult[0].followers });
        });
      });
    }
  });
});

// Update user profile (bio, etc)
app.put('/users/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, bio, library } = req.body;

  let updates = [];
  let params = [];

  if (name !== undefined) {
    updates.push('Name = ?');
    params.push(name);
  }
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (library !== undefined) {
    updates.push('library = ?');
    params.push(typeof library === 'string' ? library : JSON.stringify(library));
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  let query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  params.push(userId);

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    res.status(200).json({ success: true, message: 'Profile updated' });
  });
});

app.get('/items', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const authorId = req.query.authorId;
  const ids = req.query.ids;
  
  // Query items with author name, chapter count, likes count, comments count, and is_liked_by_user
  let query = `
    SELECT 
      i.id,
      i.name,
      i.type,
      i.description,
      i.review,
      i.image_path,
      i.author_id,
      i.version,
      i.created_at,
      i.updated_at,
      COALESCE(u.Name, u.username, 'Unknown Author') as author,
      (SELECT COUNT(DISTINCT number) FROM chapters WHERE item_id = i.id) as chapters,
      (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
      ${userId ? `(SELECT COUNT(*) > 0 FROM likes WHERE item_id = i.id AND user_id = ${userId})` : 'FALSE'} as is_liked_by_user
    FROM items i
    LEFT JOIN users u ON i.author_id = u.id
  `;

  const queryParams = [];
  const whereClauses = [];

  if (authorId) {
    whereClauses.push(`i.author_id = ?`);
    queryParams.push(authorId);
  }

  if (ids) {
    const idList = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (idList.length > 0) {
      whereClauses.push(`i.id IN (${idList.join(',')})`);
    }
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ` + whereClauses.join(' AND ');
  }

  query += ` ORDER BY i.id DESC`;
  
  console.log('📥 GET /items - Query params:', { authorId, ids, userId });
  console.log('📥 GET /items - SQL:', query);
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching items:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    console.log(`✅ GET /items - Returning ${results.length} items`);
    if (results.length > 0) {
      console.log('   First item:', results[0].name, '(ID:', results[0].id + ')');
      if (results.length > 1) {
        console.log('   Last item:', results[results.length - 1].name, '(ID:', results[results.length - 1].id + ')');
      }
    }
    
    res.status(200).json(results);
  });
});

// Get a single item by ID
app.get('/items/:id', optionalAuth, (req, res) => {
  const itemId = req.params.id;
  const userId = req.user ? req.user.id : null;
  
  const query = `
    SELECT 
      i.id,
      i.name,
      i.type,
      i.description,
      i.review,
      i.image_path,
      i.author_id,
      i.created_at,
      i.updated_at,
      i.version,
      COALESCE(u.Name, u.username, 'Unknown Author') as author,
      (SELECT COUNT(DISTINCT number) FROM chapters WHERE item_id = i.id) as chapters,
      (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
      ${userId ? `(SELECT COUNT(*) > 0 FROM likes WHERE item_id = i.id AND user_id = ${userId})` : 'FALSE'} as is_liked_by_user
    FROM items i
    LEFT JOIN users u ON i.author_id = u.id
    WHERE i.id = ?
  `;
  
  console.log(`📥 GET /items/${itemId} - Fetching single item`);
  
  db.query(query, [itemId], (err, results) => {
    if (err) {
      console.error('Error fetching item:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    
    if (results.length === 0) {
      console.log(`⚠️ GET /items/${itemId} - Item not found`);
      return res.status(404).json({ message: 'Item not found' });
    }
    
    console.log(`✅ GET /items/${itemId} - Returning:`, results[0].name);
    res.status(200).json(results[0]);
  });
});

app.get('/chapters', (req, res) => {
  const { bookId, chapterNumber, metadataOnly } = req.query;
  console.log(`📥 GET /chapters - bookId: ${bookId}, chapterNumber: ${chapterNumber}`);

  // If chapterNumber is provided, get specific chapter; otherwise get all chapters for the book.
  // Use GROUP BY / subquery to deduplicate
  if (chapterNumber) {
    db.query(
      'SELECT *, Text as content FROM chapters WHERE item_id = ? AND number = ? ORDER BY id DESC LIMIT 1',
      [bookId, chapterNumber],
      (err, results) => {
        if (err) {
          console.error('Error fetching chapter:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        // Return a single object instead of an array for single chapter requests
        res.json(results[0] || null);
      }
    );
  } else if (metadataOnly === 'true') {
    // Get chapter metadata without content (for lazy loading)
    db.query(
      `SELECT c.id, c.item_id, c.number, c.name AS title FROM chapters c
       INNER JOIN (
         SELECT MAX(id) AS max_id FROM chapters WHERE item_id = ? GROUP BY number
       ) latest ON c.id = latest.max_id
       ORDER BY c.number`,
      [bookId],
      (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
      }
    );
  } else {
    // Get one row per chapter number — the one with the highest id (most recently inserted)
    db.query(
      `SELECT c.* FROM chapters c
       INNER JOIN (
         SELECT MAX(id) AS max_id FROM chapters WHERE item_id = ? GROUP BY number
       ) latest ON c.id = latest.max_id
       ORDER BY c.number`,
      [bookId],
      (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
      }
    );
  }
});

// Create a new literature item
app.post('/items', authenticateToken, (req, res) => {
  const { name, type, description, review, imageUrl, clientRequestId } = req.body;
  const authorId = req.user.id; // Use logged-in user as author
  const normalizedRequestId = typeof clientRequestId === 'string' && clientRequestId.trim().length > 0
    ? clientRequestId.trim().slice(0, 128)
    : null;

  if (!name || !type) {
    return res.status(400).json({ success: false, message: 'Name and type are required' });
  }

  // If this exact client request was already processed, return the same item.
  if (normalizedRequestId) {
    db.query(
      'SELECT id FROM items WHERE client_request_id = ? LIMIT 1',
      [normalizedRequestId],
      (lookupErr, lookupRows) => {
        if (lookupErr) {
          console.error('Error checking idempotency key:', lookupErr);
          return res.status(500).json({ success: false, message: 'Database error', error: lookupErr.message });
        }

        if (lookupRows.length > 0) {
          return res.status(200).json({
            success: true,
            message: 'Duplicate create request detected, returning existing item',
            itemId: lookupRows[0].id,
            created: false
          });
        }

        const sql = `
          INSERT INTO items (name, author_id, type, description, review, image_path, client_request_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            review = VALUES(review),
            image_path = VALUES(image_path),
            client_request_id = IFNULL(client_request_id, VALUES(client_request_id)),
            updated_at = NOW(),
            id = LAST_INSERT_ID(id)
        `;

        db.query(
          sql,
          [name, authorId, type, description || '', review || 0, imageUrl || null, normalizedRequestId],
          (err, result) => {
            if (err) {
              console.error('Error creating/upserting item:', err);
              return res.status(500).json({ success: false, message: 'Database error', error: err.message });
            }

            const itemId = result.insertId;
            const isNew = result.affectedRows === 1; // 1 = insert, 2 = duplicate hit

            if (isNew) {
              logChange('item', itemId, 'create', authorId);
            }

            res.status(isNew ? 201 : 200).json({
              success: true,
              message: isNew ? 'Item created successfully' : 'Item already exists, returning existing',
              itemId,
              created: isNew
            });
          }
        );
      }
    );
    return;
  }

  const sql = `
    INSERT INTO items (name, author_id, type, description, review, image_path, client_request_id) 
    VALUES (?, ?, ?, ?, ?, ?, NULL)
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      review = VALUES(review),
      image_path = VALUES(image_path),
      updated_at = NOW(),
      id = LAST_INSERT_ID(id)
  `;
  
  db.query(sql, [name, authorId, type, description || '', review || 0, imageUrl || null], 
    (err, result) => {
      if (err) {
        console.error('Error creating/upserting item:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      
      const itemId = result.insertId;
      const isNew = result.affectedRows === 1; // 1 = insert, 2 = duplicate hit

      if (isNew) {
        logChange('item', itemId, 'create', authorId);
      }
      
      res.status(isNew ? 201 : 200).json({ 
        success: true, 
        message: isNew ? 'Item created successfully' : 'Item already exists, returning existing',
        itemId,
        created: isNew
      });
    }
  );
});

// Create chapters for an item
app.post('/chapters', authenticateToken, (req, res) => {
  const { itemId, chapters } = req.body;

  if (!itemId || !chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return res.status(400).json({ success: false, message: 'itemId and chapters array are required' });
  }

  // chapters table columns: id, number, name (title), item_id, Text (content)
  // Use DELETE-then-INSERT to make this endpoint idempotent: if the client
  // retries after a network timeout (the server already committed but the
  // response was lost), we end up with exactly one copy of each chapter
  // instead of creating duplicates.
  const numbers = chapters.map(ch => ch.number);
  db.query('DELETE FROM chapters WHERE item_id = ? AND number IN (?)', [itemId, numbers], (deleteErr) => {
    if (deleteErr) {
      console.error('Error clearing existing chapters before re-insert:', deleteErr);
      return res.status(500).json({ success: false, message: 'Database error', error: deleteErr.message });
    }

    const values = chapters.map(ch => [ch.number, ch.title, itemId, ch.content]);
    const sql = 'INSERT INTO chapters (number, name, item_id, Text) VALUES ?';

    db.query(sql, [values], (err, result) => {
      if (err) {
        console.error('Error creating chapters:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }

      // Log change for each chapter
      chapters.forEach(ch => {
        logChange('chapter', ch.number, 'create', req.user.id, itemId);
      });

      res.status(201).json({
        success: true,
        message: `${result.affectedRows} chapters created successfully`
      });
    });
  });
});

// Update an existing literature item
app.put('/items/:id', authenticateToken, (req, res) => {
  const itemId = req.params.id;
  const { name, type, description, review, imageUrl, version } = req.body;
  const authorId = req.user.id;

  // First verify the user owns this item and get current version
  db.query('SELECT author_id, version, updated_at FROM items WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Error checking item ownership:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (results[0].author_id !== authorId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own works' });
    }

    const currentVersion = results[0].version || 1;
    const clientVersion = version || 1;
    
    // Check for version conflicts
    if (clientVersion !== currentVersion) {
      return res.status(409).json({ 
        success: false, 
        message: 'Version conflict detected',
        conflict: {
          serverVersion: currentVersion,
          clientVersion: clientVersion,
          serverUpdatedAt: results[0].updated_at
        }
      });
    }

    // Update the item with incremented version
    const newVersion = currentVersion + 1;
    const sql = `UPDATE items SET name = ?, type = ?, description = ?, review = ?, image_path = ?, version = ?, updated_at = NOW() WHERE id = ?`;
    
    db.query(sql, [name, type, description || '', review || 0, imageUrl || null, newVersion, itemId], 
      (updateErr, result) => {
        if (updateErr) {
          console.error('Error updating item:', updateErr);
          return res.status(500).json({ success: false, message: 'Database error', error: updateErr.message });
        }
        
        logChange('item', itemId, 'update', authorId);
        
        res.status(200).json({ 
          success: true, 
          message: 'Item updated successfully',
          version: newVersion
        });
      });
    });
  });


// Update chapters for an item (delete old and insert new)
app.put('/chapters/:itemId', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const { chapters } = req.body;
  const authorId = req.user.id;

  if (!chapters || !Array.isArray(chapters)) {
    return res.status(400).json({ success: false, message: 'chapters array is required' });
  }

  // First verify the user owns this item
  db.query('SELECT author_id FROM items WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Error checking item ownership:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (results[0].author_id !== authorId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own works' });
    }

    // Delete chapters that are no longer in the new list
    const newNumbers = chapters.map(ch => ch.number);
    const deleteSql = newNumbers.length > 0
      ? 'DELETE FROM chapters WHERE item_id = ? AND number NOT IN (?)'
      : 'DELETE FROM chapters WHERE item_id = ?';
    const deleteParams = newNumbers.length > 0 ? [itemId, newNumbers] : [itemId];

    db.query(deleteSql, deleteParams, (deleteErr) => {
      if (deleteErr) {
        console.error('Error deleting removed chapters:', deleteErr);
        return res.status(500).json({ success: false, message: 'Database error', error: deleteErr.message });
      }

      if (chapters.length === 0) {
        return res.status(200).json({ success: true, message: 'All chapters deleted' });
      }

      // Upsert: insert new chapters, update existing ones by (item_id, number)
      const values = chapters.map(ch => [ch.number, ch.title, itemId, ch.content]);
      const sql = `INSERT INTO chapters (number, name, item_id, Text) VALUES ?
                   ON DUPLICATE KEY UPDATE name = VALUES(name), Text = VALUES(Text)`;

      db.query(sql, [values], (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting chapters:', insertErr);
          return res.status(500).json({ success: false, message: 'Database error', error: insertErr.message });
        }

        res.status(200).json({
          success: true,
          message: `${result.affectedRows} chapters updated successfully`
        });
      });
    });
  });
});

// Update a single chapter
app.put('/chapters/:itemId/:chapterNumber', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const chapterNumber = req.params.chapterNumber;
  const { title, content, number } = req.body;
  const authorId = req.user.id;

  // First verify the user owns this item
  db.query('SELECT author_id FROM items WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Error checking item ownership:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (results[0].author_id !== authorId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own works' });
    }

    // Update the chapter
    const sql = `UPDATE chapters SET name = ?, Text = ?, number = ? WHERE item_id = ? AND number = ?`;
    
    db.query(sql, [title, content, number || chapterNumber, itemId, chapterNumber], 
      (updateErr, result) => {
        if (updateErr) {
          console.error('Error updating chapter:', updateErr);
          return res.status(500).json({ success: false, message: 'Database error', error: updateErr.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Chapter not found' });
        }

        logChange('chapter', number || chapterNumber, 'update', authorId, itemId);

        res.status(200).json({
          success: true,
          message: 'Chapter updated successfully'
        });
      }
    );
  });
});

// Delete a single chapter
app.delete('/chapters/:itemId/:chapterNumber', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const chapterNumber = req.params.chapterNumber;
  const authorId = req.user.id;

  // First verify the user owns this item
  db.query('SELECT author_id FROM items WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Error checking item ownership:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (results[0].author_id !== authorId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own chapters' });
    }

    // Delete the chapter
    const sql = 'DELETE FROM chapters WHERE item_id = ? AND number = ?';
    
    db.query(sql, [itemId, chapterNumber], (deleteErr, result) => {
      if (deleteErr) {
        console.error('Error deleting chapter:', deleteErr);
        return res.status(500).json({ success: false, message: 'Database error', error: deleteErr.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Chapter not found' });
      }

      logChange('chapter', chapterNumber, 'delete', authorId, itemId);

      res.status(200).json({
        success: true,
        message: 'Chapter deleted successfully'
      });
    });
  });
});

// Get user's own items
app.get('/my-items', authenticateToken, (req, res) => {
  const authorId = req.user.id;
  
  // Query with author name, chapter count, likes, comments and is_liked_by_user for consistency
  const query = `
    SELECT 
      i.id,
      i.name,
      i.type,
      i.description,
      i.review,
      i.image_path,
      i.author_id,
      COALESCE(u.Name, u.username, 'Unknown Author') as author,
      (SELECT COUNT(DISTINCT number) FROM chapters WHERE item_id = i.id) as chapters,
      (SELECT COUNT(*) FROM likes WHERE item_id = i.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE item_id = i.id) as comments_count,
      (SELECT COUNT(*) > 0 FROM likes WHERE item_id = i.id AND user_id = ${authorId}) as is_liked_by_user
    FROM items i
    LEFT JOIN users u ON i.author_id = u.id
    WHERE i.author_id = ?
    ORDER BY i.id DESC
  `;
  
  db.query(query, [authorId], (err, results) => {
    if (err) {
      console.error('Error fetching user items:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.status(200).json(results);
  });
});

// ==================== COMMENTS API ====================

// Get all comments for an item
app.get('/items/:itemId/comments', (req, res) => {
  const itemId = req.params.itemId;
  
  const query = `
    SELECT 
      c.id,
      c.item_id,
      c.user_id,
      c.content,
      c.created_at,
      c.updated_at,
      COALESCE(u.Name, u.username, 'Anonymous') as username
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.item_id = ?
    ORDER BY c.created_at DESC
  `;
  
  db.query(query, [itemId], (err, results) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.status(200).json(results);
  });
});

// Add a comment to an item
app.post('/items/:itemId/comments', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Comment content is required' });
  }

  const sql = 'INSERT INTO comments (item_id, user_id, content) VALUES (?, ?, ?)';
  
  db.query(sql, [itemId, userId, content.trim()], (err, result) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
    
    // Fetch the created comment with user info
    const fetchQuery = `
      SELECT 
        c.id,
        c.item_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        COALESCE(u.Name, u.username, 'Anonymous') as username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    
    db.query(fetchQuery, [result.insertId], (fetchErr, fetchResult) => {
      if (fetchErr || fetchResult.length === 0) {
        return res.status(201).json({ 
          success: true, 
          message: 'Comment added',
          commentId: result.insertId 
        });
      }
      res.status(201).json({ 
        success: true, 
        message: 'Comment added',
        comment: fetchResult[0]
      });
    });
  });
});

// Delete a comment (only owner can delete)
app.delete('/comments/:commentId', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;

  // Verify ownership
  db.query('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, results) => {
    if (err) {
      console.error('Error checking comment ownership:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (results[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    db.query('DELETE FROM comments WHERE id = ?', [commentId], (deleteErr) => {
      if (deleteErr) {
        console.error('Error deleting comment:', deleteErr);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.status(200).json({ success: true, message: 'Comment deleted' });
    });
  });
});

// ==================== LIKES API ====================

// Check if user liked an item
app.get('/items/:itemId/like', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  db.query('SELECT id FROM likes WHERE item_id = ? AND user_id = ?', [itemId, userId], (err, results) => {
    if (err) {
      console.error('Error checking like status:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.status(200).json({ liked: results.length > 0 });
  });
});

// Toggle like for an item
app.post('/items/:itemId/like', authenticateToken, (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  // Check if already liked
  db.query('SELECT id FROM likes WHERE item_id = ? AND user_id = ?', [itemId, userId], (err, results) => {
    if (err) {
      console.error('Error checking like:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length > 0) {
      // Unlike - remove the like
      db.query('DELETE FROM likes WHERE item_id = ? AND user_id = ?', [itemId, userId], (deleteErr) => {
        if (deleteErr) {
          console.error('Error removing like:', deleteErr);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Get new like count
        db.query('SELECT COUNT(*) as count FROM likes WHERE item_id = ?', [itemId], (countErr, countResult) => {
          const count = countErr ? 0 : countResult[0].count;
          res.status(200).json({ success: true, liked: false, likes_count: count });
        });
      });
    } else {
      // Like - add the like
      db.query('INSERT INTO likes (item_id, user_id) VALUES (?, ?)', [itemId, userId], (insertErr) => {
        if (insertErr) {
          console.error('Error adding like:', insertErr);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Get new like count
        db.query('SELECT COUNT(*) as count FROM likes WHERE item_id = ?', [itemId], (countErr, countResult) => {
          const count = countErr ? 0 : countResult[0].count;
          res.status(200).json({ success: true, liked: true, likes_count: count });
        });
      });
    }
  });
});

// Get likes count for an item (public)
app.get('/items/:itemId/likes-count', (req, res) => {
  const itemId = req.params.itemId;

  db.query('SELECT COUNT(*) as count FROM likes WHERE item_id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Error getting likes count:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.status(200).json({ likes_count: results[0].count });
  });
});

// Delete an item (only owner can delete)
app.delete('/items/:id', authenticateToken, (req, res) => {
  const itemId = req.params.id;
  const authorId = req.user.id;

  // First verify the user owns this item
  db.query('SELECT author_id FROM items WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Error checking item ownership:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (results[0].author_id !== authorId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own works' });
    }

    // Delete chapters first (foreign key constraint)
    db.query('DELETE FROM chapters WHERE item_id = ?', [itemId], (deleteChaptersErr) => {
      if (deleteChaptersErr) {
        console.error('Error deleting chapters:', deleteChaptersErr);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      // Delete the item
      db.query('DELETE FROM items WHERE id = ?', [itemId], (deleteItemErr) => {
        if (deleteItemErr) {
          console.error('Error deleting item:', deleteItemErr);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        logChange('item', itemId, 'delete', authorId);

        res.status(200).json({ success: true, message: 'Item deleted successfully' });
      });
    });
  });
});

app.post('/sync-images', (req, res) => {
  const imagesDirectory = path.join(__dirname, './static/images');

  fs.readdir(imagesDirectory, async (err, files) => {
    if (err) {
      console.error('Error reading image directory:', err);
      return res.status(500).json({ message: 'Error reading image directory' });
    }

    const normalize = name =>
      name.trim().toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

    const imageMap = new Map();

    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      const name = path.basename(file, ext);
      const normalized = normalize(name);
      const imagePathForDb = path.join('static/images', file).replace(/\\/g, '/');

      console.log(`[IMAGE] Found file: ${file} → normalized: ${normalized}`);
      imageMap.set(normalized, imagePathForDb);
    });

    db.query('SELECT id, name FROM items', async (err, items) => {
      if (err) {
        console.error('Error fetching items:', err);
        return res.status(500).json({ message: 'Error fetching items' });
      }

      let updated = 0;
      let failed = 0;
      const success = [];
      const failures = [];

      const updatePromises = items.map(item => {
        return new Promise(resolve => {
          const itemKey = normalize(item.name);
          const imagePath = imageMap.get(itemKey);

          console.log(`[ITEM] "${item.name}" → normalized: "${itemKey}"`);
          console.log(`→ Matching image path: ${imagePath || 'NOT FOUND'}`);

          if (imagePath) {
            db.query('UPDATE items SET image_path = ? WHERE id = ?', [imagePath, item.id], (err) => {
              if (err) {
                console.error(`❌ Failed to update "${item.name}":`, err.message);
                failed++;
                failures.push({ item: item.name, error: err.message });
              } else {
                console.log(`✅ Updated "${item.name}" → ${imagePath}`);
                updated++;
                success.push({ item: item.name, path: imagePath });
              }
              resolve();
            });
          } else {
            console.warn(`⚠️ No image found for "${item.name}"`);
            failed++;
            failures.push({ item: item.name, error: 'Image not found' });
            resolve();
          }
        });
      });

      await Promise.all(updatePromises);

      return res.json({ updated, failed, success, failures });
    });
  });
});

// Get changelog - returns all changes since a specific timestamp
app.get('/changelog', authenticateToken, (req, res) => {
  const { since } = req.query;
  
  if (!since) {
    return res.status(400).json({ error: 'since parameter required (ISO timestamp)' });
  }

  const query = `
    SELECT 
      id,
      entity_type,
      entity_id,
      parent_id,
      operation,
      user_id,
      changed_at
    FROM changelog 
    WHERE changed_at > ? 
    ORDER BY changed_at ASC
    LIMIT 1000
  `;
  
  db.query(query, [since], (err, results) => {
    if (err) {
      console.error('Error fetching changelog:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      changes: results,
      count: results.length,
      hasMore: results.length === 1000
    });
  });
});


// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
