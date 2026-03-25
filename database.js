const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Usar disco persistente en Render (/mnt/data) o /tmp como fallback
const dbPath = process.env.RENDER ? 
  path.join('/mnt/data', 'database.sqlite') : 
  path.join(__dirname, 'data', 'database.sqlite');

// Asegurar que el directorio de la base de datos exista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

class Database {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async initTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        inviteCode TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        displayName TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        authorId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (authorId) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        newsId TEXT NOT NULL,
        originalName TEXT NOT NULL,
        storedName TEXT NOT NULL,
        mime TEXT NOT NULL,
        size INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (newsId) REFERENCES news(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS forumThreads (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        authorId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (authorId) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS forumReplies (
        id TEXT PRIMARY KEY,
        threadId TEXT NOT NULL,
        body TEXT NOT NULL,
        authorId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (threadId) REFERENCES forumThreads(id),
        FOREIGN KEY (authorId) REFERENCES users(id)
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }
  }

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Métodos específicos para usuarios
  async createUser(user) {
    const query = `INSERT INTO users (id, email, inviteCode, passwordHash, displayName, createdAt) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    return this.run(query, [user.id, user.email, user.inviteCode, user.passwordHash, user.displayName, user.createdAt]);
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    return this.get(query, [email]);
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    return this.get(query, [id]);
  }

  async getAllUsers() {
    const query = 'SELECT * FROM users ORDER BY createdAt DESC';
    return this.all(query);
  }

  // Métodos específicos para noticias
  async createNews(news) {
    const query = `INSERT INTO news (id, title, content, authorId, createdAt) 
                   VALUES (?, ?, ?, ?, ?)`;
    return this.run(query, [news.id, news.title, news.content, news.authorId, news.createdAt]);
  }

  async getAllNews() {
    const query = 'SELECT * FROM news ORDER BY createdAt DESC';
    return this.all(query);
  }

  async getNewsById(id) {
    const query = 'SELECT * FROM news WHERE id = ?';
    return this.get(query, [id]);
  }

  async deleteNews(id) {
    const query = 'DELETE FROM news WHERE id = ?';
    return this.run(query, [id]);
  }

  // Métodos específicos para adjuntos
  async createAttachment(attachment) {
    const query = `INSERT INTO attachments (id, newsId, originalName, storedName, mime, size, createdAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    return this.run(query, [attachment.id, attachment.newsId, attachment.originalName, attachment.storedName, attachment.mime, attachment.size, attachment.createdAt]);
  }

  async getAttachmentsByNewsId(newsId) {
    const query = 'SELECT * FROM attachments WHERE newsId = ?';
    return this.all(query, [newsId]);
  }

  async deleteAttachmentsByNewsId(newsId) {
    const query = 'DELETE FROM attachments WHERE newsId = ?';
    return this.run(query, [newsId]);
  }

  async deleteOldAttachments(cutoffDate) {
    const query = 'DELETE FROM attachments WHERE createdAt < ?';
    return this.run(query, [cutoffDate]);
  }

  // Métodos específicos foro
  async createThread(thread) {
    const query = `INSERT INTO forumThreads (id, title, body, authorId, createdAt) 
                   VALUES (?, ?, ?, ?, ?)`;
    return this.run(query, [thread.id, thread.title, thread.body, thread.authorId, thread.createdAt]);
  }

  async getAllThreads() {
    const query = 'SELECT * FROM forumThreads ORDER BY createdAt DESC';
    return this.all(query);
  }

  async getThreadById(id) {
    const query = 'SELECT * FROM forumThreads WHERE id = ?';
    return this.get(query, [id]);
  }

  async deleteThread(id) {
    const query = 'DELETE FROM forumThreads WHERE id = ?';
    return this.run(query, [id]);
  }

  async createReply(reply) {
    const query = `INSERT INTO forumReplies (id, threadId, body, authorId, createdAt) 
                   VALUES (?, ?, ?, ?, ?)`;
    return this.run(query, [reply.id, reply.threadId, reply.body, reply.authorId, reply.createdAt]);
  }

  async getRepliesByThreadId(threadId) {
    const query = 'SELECT * FROM forumReplies WHERE threadId = ? ORDER BY createdAt ASC';
    return this.all(query, [threadId]);
  }

  async deleteReply(id) {
    const query = 'DELETE FROM forumReplies WHERE id = ?';
    return this.run(query, [id]);
  }

  async deleteRepliesByThreadId(threadId) {
    const query = 'DELETE FROM forumReplies WHERE threadId = ?';
    return this.run(query, [threadId]);
  }

  async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    return this.run(query, [id]);
  }

  async updateUserPassword(id, passwordHash) {
    const query = 'UPDATE users SET passwordHash = ? WHERE id = ?';
    return this.run(query, [passwordHash, id]);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new Database();
