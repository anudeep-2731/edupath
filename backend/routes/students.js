const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getMasteryStats, getWeakTopics, checkPrerequisiteReadiness } = require('../services/adaptiveEngine');
const { runAsync, allAsync, getAsync } = require('../services/dbHelpers');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');

router.get('/:studentId/progress', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'Valid student ID required' });
    
    const db = new sqlite3.Database(dbPath);
    try {
        const scores = await allAsync(db, `
            SELECT s.*, t.name, t.board, t.subject, t.chapter 
            FROM student_topic_scores s 
            JOIN topics t ON s.topic_id = t.id 
            WHERE s.student_id = ?
        `, [studentId]);
        
        db.close();
        res.json(scores);
    } catch (e) {
        db.close();
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/:studentId/recommendations', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'Valid student ID required' });

    const db = new sqlite3.Database(dbPath);
    
    try {
        // Last attempted topic — continueFrom
        const lastSession = await getAsync(db, `
            SELECT t.id as topicId, t.name as topicName, s.last_score as lastScore, t.subject
            FROM student_topic_scores s
            JOIN topics t ON s.topic_id = t.id
            WHERE s.student_id = ?
            ORDER BY datetime(s.last_attempt_at) DESC
            LIMIT 1
        `, [studentId]);

        // Top 3 weak topics — focusAreas
        const weakAreas = await getWeakTopics(db, studentId);
        const focusAreas = weakAreas.slice(0, 3).map(w => ({
            id: w.topic_id,
            name: w.name,
            subject: w.subject,
            best_score: w.best_score,
            attempts: w.attempts
        }));

        // readyToUnlock — topics whose strength=3 prerequisites are all mastered
        const allTopics = await allAsync(db, `SELECT id, name, subject FROM topics`, []);
        const readyToUnlock = [];
        
        for (const topic of allTopics) {
            // Check if student hasn't mastered it yet
            const score = await getAsync(db, 
                `SELECT mastery_level FROM student_topic_scores WHERE student_id = ? AND topic_id = ?`,
                [studentId, topic.id]
            );
            if (score && score.mastery_level === 'mastered') continue;
            
            // Check prerequisites
            const readiness = await checkPrerequisiteReadiness(db, studentId, topic.id);
            if (readiness.ready) {
                // Check if there ARE prerequisites (otherwise it's just an open topic, not "unlocked")
                const hasPrereqs = await getAsync(db, 
                    `SELECT COUNT(*) as cnt FROM topic_prerequisites WHERE topic_id = ? AND strength = 3`,
                    [topic.id]
                );
                if (hasPrereqs && hasPrereqs.cnt > 0) {
                    readyToUnlock.push({ topicId: topic.id, topicName: topic.name, subject: topic.subject });
                }
            }
            if (readyToUnlock.length >= 5) break;
        }

        // Mastery stats
        const masteryStats = await getMasteryStats(db, studentId);

        // resume (backward compat) + streakDays
        let resume = null;
        if (lastSession) {
            resume = { id: lastSession.topicId, name: lastSession.topicName, subject: lastSession.subject };
        } else {
            const firstTopic = await getAsync(db, "SELECT id, name, subject FROM topics ORDER BY id ASC LIMIT 1");
            resume = firstTopic;
        }

        db.close();
        
        res.json({
            // New format
            continueFrom: lastSession || null,
            focusAreas,
            readyToUnlock,
            masteryStats,
            // Backward compatible
            resume,
            streakDays: 3
        });

    } catch (e) {
        console.error(e);
        db.close();
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
