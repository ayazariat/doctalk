require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Configuration MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Création des tables (à exécuter une fois)
async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        age INT,
        blood_type VARCHAR(5),
        allergies TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_histories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        is_bot BOOLEAN DEFAULT false,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  } finally {
    connection.release();
  }
}
initializeDatabase();

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Accès refusé');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    req.user = user[0];
    next();
  } catch (err) {
    res.status(400).send('Token invalide');
  }
};

// Routes API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, ...profile } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users SET ?',
      { 
        email,
        password: hashedPassword,
        ...profile 
      }
    );

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET);
    res.status(201).json({ 
      id: result.insertId,
      email,
      token 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!users.length || !await bcrypt.compare(password, users[0].password)) {
      return res.status(401).send('Identifiants invalides');
    }

    const token = jwt.sign({ id: users[0].id }, process.env.JWT_SECRET);
    res.json({ user: users[0], token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/chat/save', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO chat_histories (user_id, content, is_bot) VALUES ?',
      [req.body.messages.map(msg => [req.user.id, msg.content, msg.isBot])]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
// Ajouter après le middleware d'authentification
app.use((req, res, next) => {
  res.header('Content-Security-Policy', "default-src 'self'");
  res.header('X-Frame-Options', 'DENY');
  res.header('X-Content-Type-Options', 'nosniff');
  next();
});

// Valider les entrées utilisateur
function sanitizeInput(input) {
  return input.replace(/[^a-zA-Z0-9À-ÿ\s\-.,]/g, '');
}

// Modifier la route d'inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    let { email, password, ...profile } = req.body;
    
    // Validation des entrées
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      throw new Error('Format email invalide');
    }
    
    if (password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Nettoyage des données
    email = sanitizeInput(email);
    profile.full_name = sanitizeInput(profile.full_name);

    // ... reste du code existant ...
  }
});