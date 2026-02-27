

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
// const uri = "mongodb+srv://323mohammed0050:d14fcVdkzeeReZzi@flinn.tqooslh.mongodb.net/?retryWrites=true&w=majority&appName=Flinn";

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

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Access token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });

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

app.get('/items', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  
  // Query items with author name, chapter count, likes count, comments count, and is_liked_by_user
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
      ${userId ? `(SELECT COUNT(*) > 0 FROM likes WHERE item_id = i.id AND user_id = ${userId})` : 'FALSE'} as is_liked_by_user
    FROM items i
    LEFT JOIN users u ON i.author_id = u.id
    ORDER BY i.id DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching items:', err);
      return res.status(500).json({ message: 'Server error', error: err });
    }
    res.status(200).json(results);
  });
});

app.get('/chapters', (req, res) => {
  const { bookId, chapterNumber } = req.query;

  // If chapterNumber is provided, get specific chapter; otherwise get all chapters for the book.
  // Use GROUP BY / subquery to deduplicate: if duplicate rows exist for the same
  // (item_id, number) (created by retried syncs), return only the latest one.
  if (chapterNumber) {
    db.query(
      'SELECT * FROM chapters WHERE item_id = ? AND number = ? ORDER BY id DESC LIMIT 1',
      [bookId, chapterNumber],
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
  const { name, type, description, review, imageUrl } = req.body;
  const authorId = req.user.id; // Use logged-in user as author

  if (!name || !type) {
    return res.status(400).json({ success: false, message: 'Name and type are required' });
  }

  const sql = `INSERT INTO items (name, author_id, type, description, review, image_path) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.query(sql, [name, authorId, type, description || '', review || 0, imageUrl || null], 
    (err, result) => {
      if (err) {
        console.error('Error creating item:', err);
        return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      }
      
      res.status(201).json({ 
        success: true, 
        message: 'Item created successfully',
        itemId: result.insertId 
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
  const { name, type, description, review, imageUrl } = req.body;
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

    // Update the item
    const sql = `UPDATE items SET name = ?, type = ?, description = ?, review = ?, image_path = ? WHERE id = ?`;
    
    db.query(sql, [name, type, description || '', review || 0, imageUrl || null, itemId], 
      (updateErr, result) => {
        if (updateErr) {
          console.error('Error updating item:', updateErr);
          return res.status(500).json({ success: false, message: 'Database error', error: updateErr.message });
        }
        
        res.status(200).json({ 
          success: true, 
          message: 'Item updated successfully'
        });
      }
    );
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

    // Delete existing chapters
    db.query('DELETE FROM chapters WHERE item_id = ?', [itemId], (deleteErr) => {
      if (deleteErr) {
        console.error('Error deleting chapters:', deleteErr);
        return res.status(500).json({ success: false, message: 'Database error', error: deleteErr.message });
      }

      if (chapters.length === 0) {
        return res.status(200).json({ success: true, message: 'All chapters deleted' });
      }

      // Insert new chapters
      const values = chapters.map(ch => [ch.number, ch.title, itemId, ch.content]);
      const sql = 'INSERT INTO chapters (number, name, item_id, Text) VALUES ?';

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


// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
