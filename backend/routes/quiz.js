const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateQuestions, generateHint, getHintInEnglish } = require('../services/ai');
const { getNextTopic, checkPrerequisiteReadiness } = require('../services/adaptiveEngine');
const { runAsync, allAsync, getAsync } = require('../services/dbHelpers');

const dbPath = path.resolve(__dirname, '../db/database.sqlite');

// Start quiz — check prerequisite readiness first
router.get('/start/:topicId/:studentId', async (req, res) => {
    const topicId = parseInt(req.params.topicId);
    const studentId = parseInt(req.params.studentId);
    
    if (!topicId || !studentId) {
        return res.status(400).json({ error: 'Valid topic ID and student ID required' });
    }

    const db = new sqlite3.Database(dbPath);

    try {
        const topic = await getAsync(db, "SELECT * FROM topics WHERE id = ?", [topicId]);
        if (!topic) {
            db.close();
            return res.status(404).json({ error: 'Topic not found' });
        }

        // Check prerequisite readiness
        const readiness = await checkPrerequisiteReadiness(db, studentId, topicId);
        
        if (!readiness.ready) {
            db.close();
            return res.json({
                ready: false,
                message: `Complete ${readiness.missingTopics[0].name} first to unlock this topic`,
                suggestedTopic: readiness.missingTopics[0]
            });
        }

        // Fetch questions from both tables
        let questions = await allAsync(db, "SELECT * FROM questions WHERE topic_id = ?", [topicId]);
        
        // Also fetch from generated_questions
        const genQuestions = await allAsync(db, "SELECT * FROM generated_questions WHERE topic_id = ?", [topicId]);
        
        // Convert generated_questions to same format
        const convertedGenQs = genQuestions.map(q => ({
            id: q.id + 100000, // offset to avoid id conflicts
            topic_id: q.topic_id,
            question_text: q.question_text,
            options: JSON.stringify([q.option_a, q.option_b, q.option_c, q.option_d]),
            correct_index: q.correct_index,
            explanation: q.explanation_english
        }));
        
        questions = [...questions, ...convertedGenQs];

        // If fewer than 5 questions, generate more using Gemini
        if (questions.length < 5) {
            const newQuestionsCount = 5 - questions.length;
            console.log(`Topic ${topic.name} has only ${questions.length} questions. Generating ${newQuestionsCount} more...`);
            
            const generatedQs = await generateQuestions(topic.board, topic.subject, topic.name);
            
            if (generatedQs && generatedQs.length > 0) {
                for (const q of generatedQs) {
                    await runAsync(db, 
                        "INSERT INTO questions (topic_id, question_text, options, correct_index, explanation) VALUES (?, ?, ?, ?, ?)",
                        [topicId, q.question || q.question_text, JSON.stringify(q.options), q.correct_index, q.explanation]
                    );
                }
                const newQs = await allAsync(db, "SELECT * FROM questions WHERE topic_id = ?", [topicId]);
                questions = [...newQs, ...convertedGenQs];
            }
        }

        db.close();
        
        // Parse options JSON strings back to arrays
        const parsedQuestions = questions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
        
        // Shuffle and take top 5
        const shuffled = parsedQuestions.sort(() => 0.5 - Math.random());
        res.json({
            ready: true,
            questions: shuffled.slice(0, 5),
            topic: { id: topic.id, name: topic.name, subject: topic.subject, chapter: topic.chapter }
        });

    } catch (error) {
        console.error(error);
        db.close();
        res.status(500).json({ error: 'Database or AI generation error' });
    }
});

// Legacy route — get questions directly (backward compatible)
router.get('/:topicId', async (req, res) => {
    const topicId = parseInt(req.params.topicId);
    
    if (!topicId) {
        return res.status(400).json({ error: 'Valid topic ID required' });
    }

    const db = new sqlite3.Database(dbPath);

    try {
        const topic = await getAsync(db, "SELECT * FROM topics WHERE id = ?", [topicId]);
        
        if (!topic) {
             db.close();
             return res.status(404).json({ error: 'Topic not found' });
        }

        let questions = await allAsync(db, "SELECT * FROM questions WHERE topic_id = ?", [topicId]);
        
        // Also fetch from generated_questions
        const genQuestions = await allAsync(db, "SELECT * FROM generated_questions WHERE topic_id = ?", [topicId]);
        const convertedGenQs = genQuestions.map(q => ({
            id: q.id + 100000,
            topic_id: q.topic_id,
            question_text: q.question_text,
            options: JSON.stringify([q.option_a, q.option_b, q.option_c, q.option_d]),
            correct_index: q.correct_index,
            explanation: q.explanation_english
        }));
        
        questions = [...questions, ...convertedGenQs];

        // If fewer than 5 questions, generate more using Gemini
        if (questions.length < 5) {
            const newQuestionsCount = 5 - questions.length;
            console.log(`Topic ${topic.name} has only ${questions.length} questions. Generating ${newQuestionsCount} more...`);
            
            const generatedQs = await generateQuestions(topic.board, topic.subject, topic.name);
            
            if (generatedQs && generatedQs.length > 0) {
                 for (const q of generatedQs) {
                     await runAsync(db, 
                         "INSERT INTO questions (topic_id, question_text, options, correct_index, explanation) VALUES (?, ?, ?, ?, ?)",
                         [topicId, q.question || q.question_text, JSON.stringify(q.options), q.correct_index, q.explanation]
                     );
                 }
                 const newQs = await allAsync(db, "SELECT * FROM questions WHERE topic_id = ?", [topicId]);
                 questions = [...newQs, ...convertedGenQs];
            }
        }

        db.close();
        
        const parsedQuestions = questions.map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
        
        const shuffled = parsedQuestions.sort(() => 0.5 - Math.random());
        res.json(shuffled.slice(0, 5));

    } catch (error) {
        console.error(error);
        db.close();
        res.status(500).json({ error: 'Database or AI generation error' });
    }
});

router.post('/hint', async (req, res) => {
    const { questionText, correctAnswer, topicName } = req.body;
    
    if (!questionText) {
        return res.status(400).json({ error: 'Question text required' });
    }

    try {
        let hint;
        if (correctAnswer && topicName) {
            hint = await getHintInEnglish(questionText, correctAnswer, topicName);
        } else {
            hint = await generateHint(questionText);
        }
        res.json({ hint });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate hint' });
    }
});

// Complete quiz — adaptive engine integration
router.post('/complete', express.json(), async (req, res) => {
    const { studentId, topicId, score, totalQuestions, correctAnswers } = req.body;
    
    if (!studentId || !topicId || score === undefined) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const percentage = typeof score === 'number' && score <= 100 ? score : 
        (totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : score);
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        // Use adaptive engine to determine next topic
        const nextTopic = await getNextTopic(db, studentId, topicId, percentage);
        
        // Get weak areas
        const { getWeakTopics } = require('../services/adaptiveEngine');
        const weakAreas = await getWeakTopics(db, studentId);
        
        // Get mastery level
        const scoreRecord = await getAsync(db,
            `SELECT mastery_level FROM student_topic_scores WHERE student_id = ? AND topic_id = ?`,
            [studentId, topicId]
        );
        
        // Encouragement message
        let encouragementMessage;
        if (percentage >= 80) {
            encouragementMessage = "Excellent work! You have mastered this topic. Keep going!";
        } else if (percentage >= 60) {
            encouragementMessage = "Good effort! A little more practice and you will master this.";
        } else if (percentage >= 40) {
            encouragementMessage = "You are making progress. Let's strengthen your foundation first.";
        } else {
            encouragementMessage = "Don't worry — everyone struggles sometimes. Let's go back to basics.";
        }
        
        db.close();
        
        res.json({
            masteryLevel: scoreRecord ? scoreRecord.mastery_level : 'not_started',
            nextTopic: nextTopic ? {
                id: nextTopic.nextTopicId,
                name: nextTopic.nextTopicName,
                reason: nextTopic.reason,
                type: nextTopic.type
            } : null,
            weakAreas: weakAreas.slice(0, 3).map(w => ({
                id: w.topic_id,
                name: w.name,
                subject: w.subject,
                bestScore: w.best_score,
                attempts: w.attempts
            })),
            encouragementMessage,
            score: percentage
        });
    } catch (error) {
        console.error(error);
        db.close();
        res.status(500).json({ error: 'Failed to process quiz completion' });
    }
});

// Legacy result saving (backward compatible)
router.post('/result', express.json(), async (req, res) => {
    const { studentId, topicId, score, maxScore } = req.body;
    
    if (!studentId || !topicId || score === undefined || !maxScore) {
       return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const percentage = Math.round((score / maxScore) * 100);
    const db = new sqlite3.Database(dbPath);
    
    try {
        const existingRecord = await getAsync(db, "SELECT * FROM student_topic_scores WHERE student_id = ? AND topic_id = ?", [studentId, topicId]);
        
        let masteryLevel = 'not_started';
        if (percentage >= 80) masteryLevel = 'mastered';
        else if (percentage >= 40) masteryLevel = 'practicing';
        else masteryLevel = 'struggling';
        
        if (existingRecord) {
            const bestScore = Math.max(existingRecord.best_score, percentage);
            if (bestScore >= 80) masteryLevel = 'mastered';
            else if (bestScore >= 40) masteryLevel = 'practicing';
            else masteryLevel = 'struggling';
            
            const isWeak = bestScore < 60 ? 1 : 0;
            const attempts = existingRecord.attempts + 1;
            
            await runAsync(db, 
                "UPDATE student_topic_scores SET attempts = ?, best_score = ?, last_score = ?, is_weak_area = ?, mastery_level = ?, last_attempt_at = CURRENT_TIMESTAMP WHERE student_id = ? AND topic_id = ?",
                [attempts, bestScore, percentage, isWeak, masteryLevel, studentId, topicId]
            );
        } else {
            const isWeak = percentage < 60 ? 1 : 0;
            await runAsync(db,
                "INSERT INTO student_topic_scores (student_id, topic_id, attempts, best_score, last_score, is_weak_area, mastery_level, last_attempt_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                [studentId, topicId, 1, percentage, percentage, isWeak, masteryLevel]
            );
        }
        res.json({ success: true, newPercentage: percentage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save score' });
    } finally {
        db.close();
    }
});


module.exports = router;
