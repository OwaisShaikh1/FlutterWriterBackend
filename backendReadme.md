# Backend - Literature Dashboard API Server

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [Authentication System](#authentication-system)
7. [API Endpoints](#api-endpoints)
8. [Middleware](#middleware)
9. [Static File Serving](#static-file-serving)
10. [Utility Scripts](#utility-scripts)
11. [Configuration](#configuration)
12. [Request/Response Examples](#requestresponse-examples)
13. [Error Handling](#error-handling)
14. [Security Considerations](#security-considerations)
15. [Deployment](#deployment)
16. [User Scenarios & Flows](#user-scenarios--flows)

---

## Overview

The **Backend** is a Node.js/Express REST API server that provides:
- User authentication (registration, login, JWT tokens)
- Literature item CRUD operations
- Chapter management for literature items
- Image serving for literature covers
- Ownership-based access control

The server uses **MySQL** for data persistence and **JWT** for stateless authentication.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                            │
│                     (Flutter App, Web Browser, etc.)                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTP/HTTPS
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS SERVER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         MIDDLEWARE                               │    │
│  │  ├── CORS (Cross-Origin Resource Sharing)                       │    │
│  │  ├── Body Parser (JSON parsing)                                 │    │
│  │  └── JWT Authentication (authenticateToken)                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                          ROUTES                                  │    │
│  │                                                                  │    │
│  │  Authentication:                                                 │    │
│  │  ├── POST /register                                             │    │
│  │  ├── POST /login                                                │    │
│  │  └── POST /verify-token                                         │    │
│  │                                                                  │    │
│  │  Items (Literature):                                             │    │
│  │  ├── GET    /items           (Public)                           │    │
│  │  ├── GET    /items/:id       (Public)                           │    │
│  │  ├── POST   /items           (Protected)                        │    │
│  │  ├── PUT    /items/:id       (Protected, Owner only)            │    │
│  │  ├── DELETE /items/:id       (Protected, Owner only)            │    │
│  │  └── GET    /my-items        (Protected)                        │    │
│  │                                                                  │    │
│  │  Chapters:                                                       │    │
│  │  ├── GET    /chapters        (Public, ?bookId=X[&chapterNumber])│    │
│  │  ├── POST   /chapters        (Protected)                        │    │
│  │  └── PUT    /chapters/:itemId (Protected, Owner only)           │    │
│  │                                                                  │    │
│  │  Utilities:                                                      │    │
│  │  ├── GET    /users           (Protected)                        │    │
│  │  └── POST   /sync-images     (Public)                           │    │
│  │                                                                  │    │
│  │  Static Files:                                                   │    │
│  │  └── GET    /static/images/* (Public)                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ mysql2
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MYSQL DATABASE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Tables:                                                                │
│  ├── users         → User accounts                                      │
│  ├── items         → Literature items (novels, poems, etc.)             │
│  └── chapters      → Chapter content for each item                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ Client  │────▶│   Express    │────▶│  Middleware  │────▶│  Route   │
│         │     │   Server     │     │  (CORS,JWT)  │     │ Handler  │
└─────────┘     └──────────────┘     └──────────────┘     └──────────┘
                                                                │
                                                                ▼
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ Client  │◀────│   Express    │◀────│    JSON      │◀────│  MySQL   │
│         │     │   Response   │     │   Response   │     │  Query   │
└─────────┘     └──────────────┘     └──────────────┘     └──────────┘
```

---

## Project Structure

```
backend/
├── index1.js              # Main server file (Express app)
├── index2.js              # MongoDB connection example (unused)
├── package.json           # Node.js dependencies
├── package-lock.json      # Locked dependency versions
├── .env                   # Environment configuration
├── hashpasswords.js       # Utility: Hash existing plaintext passwords
├── imagesSyncer.js        # Utility: Image sync helper
├── node_modules/          # Installed dependencies
└── static/
    └── images/            # Literature cover images
        ├── Beginning after the End.jpg
        ├── Demonic Emperor.jpeg
        ├── Greatest Estate Developer.jpg
        ├── Lord of the Mysteries.jpg
        ├── Omniscient Reader's Viewpoint.jpg
        ├── One Piece.jpg
        └── Solo Leveling.jpg
```

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | Latest | JavaScript runtime |
| Framework | Express | 5.1.0 | Web framework |
| Database | MySQL | - | Relational database |
| DB Driver | mysql2 | 3.14.1 | MySQL connection |
| Auth | jsonwebtoken | 9.0.2 | JWT token handling |
| Security | bcryptjs | 3.0.2 | Password hashing |
| Middleware | cors | 2.8.5 | CORS support |
| Middleware | body-parser | 2.2.0 | JSON body parsing |
| Config | dotenv | 16.5.0 | Environment variables |
| (Optional) | mongoose | 8.16.4 | MongoDB support |

### Package.json

```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "body-parser": "^2.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.16.4",
    "mysql2": "^3.14.1"
  }
}
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│       users         │       │       items         │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │←──────│ author_id (FK)      │
│ Name                │       │ id (PK)             │
│ username (UNIQUE)   │       │ name                │
│ password (bcrypt)   │       │ type                │
│ email               │       │ description         │
└─────────────────────┘       │ review              │
                              │ image_path          │
                              └──────────┬──────────┘
                                         │
                                         │ 1:N
                                         │
                              ┌──────────┴──────────┐
                              │      chapters       │
                              ├─────────────────────┤
                              │ id (PK)             │
                              │ item_id (FK)        │
                              │ number              │
                              │ name (title)        │
                              │ Text (content)      │
                              └─────────────────────┘
```

### Table: `users`

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | User ID |
| `Name` | VARCHAR | - | Display name |
| `username` | VARCHAR | UNIQUE, NOT NULL | Login username |
| `password` | VARCHAR | NOT NULL | bcrypt hashed password |
| `email` | VARCHAR | - | Email address |

### Table: `items`

Stores literature items (novels, poems, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Item ID |
| `name` | VARCHAR | NOT NULL | Literature title |
| `author_id` | INT | FOREIGN KEY → users.id | Creator user ID |
| `type` | VARCHAR | NOT NULL | Type (Novel, Poetry, Drama, etc.) |
| `description` | TEXT | - | Synopsis/description |
| `review` | FLOAT | DEFAULT 0 | Rating (0-5) |
| `image_path` | VARCHAR | - | Path to cover image |

### Table: `chapters`

Stores chapter content for literature items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Chapter ID |
| `item_id` | INT | FOREIGN KEY → items.id | Parent item ID |
| `number` | INT | NOT NULL | Chapter number (1-based) |
| `name` | VARCHAR | - | Chapter title |
| `Text` | LONGTEXT | - | Full chapter content |

### Database Creation SQL

```sql
-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255)
);

-- Items table
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    author_id INT,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    review FLOAT DEFAULT 0,
    image_path VARCHAR(500),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Chapters table
CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    number INT NOT NULL,
    name VARCHAR(255),
    Text LONGTEXT,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
```

---

## Authentication System

### JWT Token System

The server uses **JSON Web Tokens (JWT)** for stateless authentication.

#### Token Generation

```javascript
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d',  // Token valid for 30 days
  });

  return token;
};
```

#### Token Payload Structure

```json
{
  "id": 42,
  "username": "johndoe",
  "iat": 1677123456,
  "exp": 1679715456
}
```

### Password Hashing

Passwords are hashed using **bcryptjs** with 10 salt rounds:

```javascript
// Registration
const hashedPassword = await bcrypt.hash(password, 10);

// Login verification
const isMatch = await bcrypt.compare(password, user.password);
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Client                    Server                     Database          │
│    │                         │                           │              │
│    │ POST /register          │                           │              │
│    │ {Name, username,        │                           │              │
│    │  password, email}       │                           │              │
│    │ ──────────────────────▶ │                           │              │
│    │                         │                           │              │
│    │                         │ Hash password (bcrypt)    │              │
│    │                         │ ──────────────────────────┤              │
│    │                         │                           │              │
│    │                         │ Check username exists     │              │
│    │                         │ ─────────────────────────▶│              │
│    │                         │ ◀─────────────────────────│              │
│    │                         │                           │              │
│    │                         │ INSERT INTO users         │              │
│    │                         │ ─────────────────────────▶│              │
│    │                         │ ◀───── {insertId} ────────│              │
│    │                         │                           │              │
│    │                         │ Generate JWT token        │              │
│    │                         │ ──────────────────────────┤              │
│    │                         │                           │              │
│    │ {success: true, token}  │                           │              │
│    │ ◀────────────────────── │                           │              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Client                    Server                     Database          │
│    │                         │                           │              │
│    │ POST /login             │                           │              │
│    │ {username, password}    │                           │              │
│    │ ──────────────────────▶ │                           │              │
│    │                         │                           │              │
│    │                         │ SELECT * FROM users       │              │
│    │                         │ WHERE username = ?        │              │
│    │                         │ ─────────────────────────▶│              │
│    │                         │ ◀───── {user} ────────────│              │
│    │                         │                           │              │
│    │                         │ bcrypt.compare(password)  │              │
│    │                         │ ──────────────────────────┤              │
│    │                         │                           │              │
│    │                         │ Generate JWT token        │              │
│    │                         │ ──────────────────────────┤              │
│    │                         │                           │              │
│    │ {success, user, token}  │                           │              │
│    │ ◀────────────────────── │                           │              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/register`
Register a new user account.

**Request Body:**
```json
{
  "Name": "John Doe",
  "username": "johndoe",
  "password": "securepassword123",
  "email": "john@example.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- 400: Username and password required
- 409: Username already exists
- 500: Database error

---

#### POST `/login`
Authenticate and obtain JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 42,
    "username": "johndoe",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- 401: Invalid username or password
- 500: Database error

---

#### POST `/verify-token`
Validate an existing JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 42,
    "username": "johndoe",
    "iat": 1677123456,
    "exp": 1679715456
  }
}
```

**Error Responses:**
- 401: Token missing
- 403: Invalid or expired token

---

### Items (Literature) Endpoints

#### GET `/items`
List all literature items with author info and chapter count.

**Authentication:** Not required

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Solo Leveling",
    "type": "Novel",
    "description": "A fantasy web novel about...",
    "review": 4.5,
    "image_path": "static/images/Solo Leveling.jpg",
    "author_id": 42,
    "author": "Chugong",
    "chapters": 179
  },
  ...
]
```

**SQL Query:**
```sql
SELECT 
  i.id, i.name, i.type, i.description, i.review, i.image_path, i.author_id,
  COALESCE(u.Name, u.username, 'Unknown Author') as author,
  (SELECT COUNT(*) FROM chapters WHERE item_id = i.id) as chapters
FROM items i
LEFT JOIN users u ON i.author_id = u.id
ORDER BY i.id DESC
```

---

#### POST `/items`
Create a new literature item.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "name": "My Novel",
  "type": "Novel",
  "description": "A story about...",
  "review": 0,
  "imageUrl": null
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Item created successfully",
  "itemId": 123
}
```

**Notes:**
- `author_id` is automatically set from JWT token
- Author name derived from logged-in user

---

#### PUT `/items/:id`
Update an existing item.

**Authentication:** Required (JWT) + Owner only

**Request Body:**
```json
{
  "name": "Updated Title",
  "type": "Novel",
  "description": "Updated description",
  "review": 4.0,
  "imageUrl": "path/to/image.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item updated successfully"
}
```

**Error Responses:**
- 404: Item not found
- 403: You can only edit your own works

---

#### DELETE `/items/:id`
Delete an item and all its chapters.

**Authentication:** Required (JWT) + Owner only

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

**Process:**
1. Verify ownership
2. Delete all chapters (foreign key cascade)
3. Delete item

---

#### GET `/my-items`
Get items created by the authenticated user.

**Authentication:** Required (JWT)

**Success Response (200):**
```json
[
  {
    "id": 5,
    "name": "My First Novel",
    "type": "Novel",
    "description": "...",
    "review": 0,
    "image_path": null,
    "author_id": 42,
    "author": "John Doe",
    "chapters": 5
  }
]
```

---

### Chapters Endpoints

#### GET `/chapters`
Get chapters for a literature item.

**Authentication:** Not required

**Query Parameters:**
- `bookId` (required): Item ID
- `chapterNumber` (optional): Specific chapter number

**Example: All chapters**
```
GET /chapters?bookId=1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "item_id": 1,
    "number": 1,
    "name": "Chapter 1: The Beginning",
    "Text": "It was a dark and stormy night..."
  },
  {
    "id": 2,
    "item_id": 1,
    "number": 2,
    "name": "Chapter 2: The Journey",
    "Text": "The hero set out on his journey..."
  }
]
```

**Example: Specific chapter**
```
GET /chapters?bookId=1&chapterNumber=1
```

**Response (200):**
```json
[
  {
    "id": 1,
    "item_id": 1,
    "number": 1,
    "name": "Chapter 1: The Beginning",
    "Text": "It was a dark and stormy night..."
  }
]
```

---

#### POST `/chapters`
Create chapters for an item.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "itemId": 1,
  "chapters": [
    {
      "number": 1,
      "title": "Chapter 1: Beginning",
      "content": "The story begins..."
    },
    {
      "number": 2,
      "title": "Chapter 2: Rising Action",
      "content": "Events unfold..."
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "2 chapters created successfully"
}
```

**Database Mapping:**
- `title` → `name` column
- `content` → `Text` column

---

#### PUT `/chapters/:itemId`
Replace all chapters for an item (delete existing, insert new).

**Authentication:** Required (JWT) + Owner only

**Request Body:**
```json
{
  "chapters": [
    {
      "number": 1,
      "title": "Revised Chapter 1",
      "content": "New content..."
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "3 chapters updated successfully"
}
```

**Process:**
1. Verify item ownership
2. DELETE all existing chapters
3. INSERT new chapters

---

### Utility Endpoints

#### GET `/users`
List all usernames (admin/debug endpoint).

**Authentication:** Required (JWT)

**Response (200):**
```json
[
  { "username": "johndoe" },
  { "username": "janedoe" }
]
```

---

#### POST `/sync-images`
Synchronize item cover images by matching item names to image files.

**Authentication:** Not required

**Process:**
1. Read all files from `static/images/`
2. Normalize filenames (lowercase, remove spaces/special chars)
3. For each item in database:
   - Normalize item name
   - Find matching image file
   - Update `image_path` in database

**Response (200):**
```json
{
  "updated": 5,
  "failed": 2,
  "success": [
    { "item": "Solo Leveling", "path": "static/images/Solo Leveling.jpg" }
  ],
  "failures": [
    { "item": "Unknown Novel", "error": "Image not found" }
  ]
}
```

---

#### GET `/`
Health check endpoint.

**Response (200):**
```
API is running
```

---

## Middleware

### CORS Middleware

Enables Cross-Origin Resource Sharing for all origins:

```javascript
app.use(cors());
```

### Body Parser Middleware

Parses JSON request bodies:

```javascript
app.use(bodyParser.json());
```

### JWT Authentication Middleware

Protects routes requiring authentication:

```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = user;  // Attach decoded token to request
    next();
  });
}
```

**Usage:**
```javascript
app.get('/protected-route', authenticateToken, (req, res) => {
  // req.user contains { id, username, iat, exp }
  res.json({ userId: req.user.id });
});
```

---

## Static File Serving

### Image Serving

Cover images are served from the `static/images` directory:

```javascript
app.use('/static/images', express.static(path.join(__dirname, 'static', 'images')));
```

**Access URL:**
```
GET http://server:5000/static/images/Solo%20Leveling.jpg
```

### Image Files

Current cover images:
- `Beginning after the End.jpg`
- `Demonic Emperor.jpeg`
- `Greatest Estate Developer.jpg`
- `Lord of the Mysteries.jpg`
- `Omniscient Reader's Viewpoint.jpg`
- `One Piece.jpg`
- `Solo Leveling.jpg`

---

## Utility Scripts

### hashpasswords.js

**Purpose:** One-time migration script to hash existing plaintext passwords.

**Usage:**
```bash
cd backend
node hashpasswords.js
```

**Process:**
1. Connect to database
2. Select all users
3. Hash each password with bcrypt (10 rounds)
4. Update user record

```javascript
function hashPasswords() {
  const selectQuery = 'SELECT id, password FROM users';

  db.query(selectQuery, async (err, results) => {
    for (const user of results) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
      db.query(updateQuery, [hashedPassword, user.id], ...);
    }
  });
}
```

**Note:** Only run once after importing plaintext passwords.

### imagesSyncer.js

**Purpose:** Helper module for image synchronization (reference only, main logic in index1.js).

---

## Configuration

### Environment Variables (.env)

```dotenv
# Database Configuration
DB_NAME = "writer"
DB_USER = owais
DB_PASSWORD = "owais20!"
DB_HOST = "localhost"
DB_PORT = "3306"

# Server Configuration
API_BASE_URL = "http://172.23.128.1:5000"

# JWT Configuration
JWT_SECRET = owais20!
JWT_EXPIRES_IN = 1d
```

### Configuration Notes

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_NAME` | MySQL database name | `writer` |
| `DB_USER` | MySQL username | `owais` |
| `DB_PASSWORD` | MySQL password | `owais20!` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `JWT_SECRET` | Secret for signing tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration | `30d` |

### Database Connection

```javascript
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
```

---

## Request/Response Examples

### Example: Complete User Registration Flow

**1. Register**
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Alice Writer",
    "username": "alice",
    "password": "password123",
    "email": "alice@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDIxLCJ1c2VybmFtZSI6ImFsaWNlIiwiaWF0IjoxNjc3MTIzNDU2LCJleHAiOjE2Nzk3MTU0NTZ9.xyz"
}
```

---

### Example: Create Literature with Chapters

**1. Create Item**
```bash
curl -X POST http://localhost:5000/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "name": "The Great Adventure",
    "type": "Novel",
    "description": "An epic tale of...",
    "review": 0
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Item created successfully",
  "itemId": 50
}
```

**2. Create Chapters**
```bash
curl -X POST http://localhost:5000/chapters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "itemId": 50,
    "chapters": [
      {
        "number": 1,
        "title": "Chapter 1: The Beginning",
        "content": "Once upon a time..."
      },
      {
        "number": 2,
        "title": "Chapter 2: The Quest",
        "content": "Our hero sets forth..."
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "2 chapters created successfully"
}
```

---

### Example: Fetch and Read

**1. Get All Items**
```bash
curl http://localhost:5000/items
```

**2. Get Chapters for Book ID 50**
```bash
curl http://localhost:5000/chapters?bookId=50
```

**3. Get Specific Chapter**
```bash
curl "http://localhost:5000/chapters?bookId=50&chapterNumber=1"
```

---

## Error Handling

### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "message": "Error description"
}
```

Or for simple errors:

```json
{
  "message": "Error description"
}
```

### Common Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Token expired or insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate username |
| 500 | Server Error | Database error, unexpected exception |

### Error Handling Examples

**Missing Token (401):**
```json
{
  "message": "Access token missing"
}
```

**Invalid Token (403):**
```json
{
  "message": "Invalid or expired token"
}
```

**Ownership Violation (403):**
```json
{
  "success": false,
  "message": "You can only edit your own works"
}
```

**Username Exists (409):**
```json
{
  "success": false,
  "message": "Username already exists"
}
```

---

## Security Considerations

### Implemented Security Measures

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Authentication**: Stateless, expires in 30 days
3. **Ownership Validation**: Users can only modify their own items
4. **CORS**: Enabled (configure for production)

### Security Recommendations for Production

1. **Use HTTPS**: SSL/TLS encryption for all traffic
2. **Restrict CORS**: Specify allowed origins
3. **Rate Limiting**: Prevent brute force attacks
4. **Input Validation**: Sanitize all user inputs
5. **SQL Parameterization**: Already using prepared statements
6. **Secure JWT Secret**: Use strong, unique secret
7. **Environment Variables**: Never commit `.env` to version control
8. **Error Messages**: Avoid leaking internal details

### JWT Security Notes

- Secret stored in environment variable
- Token expiration: 30 days
- Payload contains only `id` and `username`
- Passwords never included in responses

---

## Deployment

### Development Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with database credentials
# (copy from .env.example and modify)

# Start MySQL server
# Create database and tables

# Run server
node index1.js
```

### Server Output

```
Connected to MySQL!
Server running on http://localhost:5000
```

### Production Considerations

1. **Process Manager**: Use PM2 or similar
   ```bash
   pm2 start index1.js --name "writer-backend"
   ```

2. **Reverse Proxy**: Use Nginx for SSL termination

3. **Database**: Use managed MySQL service

4. **Logging**: Add structured logging (Winston, Morgan)

5. **Environment**: Set `NODE_ENV=production`

### Port Configuration

Default port: `5000`

Can be overridden via `PORT` environment variable:
```bash
PORT=3000 node index1.js
```

### Network Binding

Server binds to all interfaces:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## User Scenarios & Flows

### Scenario 1: New User Registration & First Post

```
1. POST /register
   → User created, JWT token returned

2. POST /items (with JWT)
   → Literature item created with user as author

3. POST /chapters (with JWT)
   → Chapters added to the item

4. GET /my-items (with JWT)
   → User sees their created item
```

### Scenario 2: Reader Browsing Content

```
1. GET /items
   → List of all literature items

2. Select item ID 5

3. GET /chapters?bookId=5
   → All chapters for item 5

4. GET /chapters?bookId=5&chapterNumber=1
   → Read Chapter 1

5. GET /chapters?bookId=5&chapterNumber=2
   → Read Chapter 2 (and so on)
```

### Scenario 3: Author Editing Their Work

```
1. POST /login
   → Authenticate, get JWT

2. GET /my-items (with JWT)
   → See list of own items

3. PUT /items/5 (with JWT)
   → Update item metadata

4. PUT /chapters/5 (with JWT)
   → Replace all chapters with new content
```

### Scenario 4: Attempting Unauthorized Edit

```
1. POST /login (as User A)
   → Get JWT for User A

2. PUT /items/7 (item owned by User B)
   → Response: 403 "You can only edit your own works"
```

### Scenario 5: Mobile App Sync

```
1. App creates item locally (offline)

2. User goes online, taps Sync

3. App POST /items (with JWT)
   → Backend creates item, returns itemId

4. App POST /chapters (with JWT)
   → Chapters created on backend

5. App GET /items
   → Pull all items including new remote ones

6. App GET /chapters?bookId=X
   → Download chapters for offline reading
```

---

## API Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Health check |
| POST | `/register` | No | User registration |
| POST | `/login` | No | User login |
| POST | `/verify-token` | Yes | Validate token |
| GET | `/users` | Yes | List usernames |
| GET | `/items` | No | List all items |
| POST | `/items` | Yes | Create item |
| PUT | `/items/:id` | Yes* | Update item |
| DELETE | `/items/:id` | Yes* | Delete item |
| GET | `/my-items` | Yes | User's items |
| GET | `/chapters` | No | Get chapters |
| POST | `/chapters` | Yes | Create chapters |
| PUT | `/chapters/:itemId` | Yes* | Update chapters |
| POST | `/sync-images` | No | Sync cover images |
| GET | `/static/images/*` | No | Serve images |

*Yes\* = Requires authentication AND ownership

---

## Future Enhancements

- [ ] Add comments endpoint
- [ ] Implement rating submission
- [ ] Add pagination for items list
- [ ] Implement search endpoint
- [ ] Add user profile endpoint
- [ ] Implement refresh tokens
- [ ] Add file upload for images
- [ ] Implement soft delete
- [ ] Add activity logging
- [ ] Implement rate limiting

---

*Documentation generated for Backend v1.0.0*
