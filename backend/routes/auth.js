const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('jsonwebtoken');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'edupath_super_secret_jwt_key_for_demo';

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = new sqlite3.Database(dbPath);

    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
        db.close();
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

module.exports = router;
