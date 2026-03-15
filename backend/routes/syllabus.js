const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');

// Get all topics (used for knowledge graph)
router.get('/', (req, res) => {
    const board = req.query.board; // Optional filter
    const db = new sqlite3.Database(dbPath);
    
    let query = "SELECT * FROM topics";
    let params = [];
    
    if (board === 'CBSE' || board === 'SSC') {
        query += " WHERE board = ?";
        params.push(board);
    }
    
    db.all(query, params, (err, topics) => {
        db.close();
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse JSON strings back to arrays
        const parsedTopics = topics.map(t => ({
            ...t,
            prerequisite_topic_ids: JSON.parse(t.prerequisite_topic_ids)
        }));
        
        res.json(parsedTopics);
    });
});

module.exports = router;
