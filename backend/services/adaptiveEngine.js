const { runAsync, allAsync, getAsync } = require('./dbHelpers');

/**
 * Decides what topic to serve next after a student completes a quiz
 * Returns: { nextTopicId, nextTopicName, reason, type }
 * type: 'prerequisite_gap' | 'continue_current' | 'next_topic' | 'review_weak'
 */
async function getNextTopic(db, studentId, completedTopicId, score) {
    // Get completed topic info
    const completedTopic = await getAsync(db, `SELECT * FROM topics WHERE id = ?`, [completedTopicId]);
    if (!completedTopic) return null;

    // Update student_topic_scores
    const existingScore = await getAsync(db,
        `SELECT * FROM student_topic_scores WHERE student_id = ? AND topic_id = ?`,
        [studentId, completedTopicId]
    );

    let masteryLevel = 'not_started';
    if (score >= 80) masteryLevel = 'mastered';
    else if (score >= 40) masteryLevel = 'practicing';
    else masteryLevel = 'struggling';

    if (existingScore) {
        const bestScore = Math.max(existingScore.best_score, score);
        if (bestScore >= 80) masteryLevel = 'mastered';
        else if (bestScore >= 40) masteryLevel = 'practicing';
        else masteryLevel = 'struggling';

        await runAsync(db,
            `UPDATE student_topic_scores SET attempts = attempts + 1, best_score = ?, last_score = ?, 
             is_weak_area = ?, mastery_level = ?, last_attempt_at = CURRENT_TIMESTAMP 
             WHERE student_id = ? AND topic_id = ?`,
            [bestScore, score, bestScore < 60 ? 1 : 0, masteryLevel, studentId, completedTopicId]
        );
    } else {
        await runAsync(db,
            `INSERT INTO student_topic_scores (student_id, topic_id, attempts, best_score, last_score, is_weak_area, mastery_level, last_attempt_at)
             VALUES (?, ?, 1, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [studentId, completedTopicId, score, score, score < 60 ? 1 : 0, masteryLevel]
        );
    }

    // score < 60: mark weak, find unmastered prerequisites (strength=3 first)
    if (score < 60) {
        // Find unmastered prerequisites sorted by strength desc
        const unmasteredPrereqs = await allAsync(db,
            `SELECT t.id, t.name, tp.strength 
             FROM topic_prerequisites tp
             JOIN topics t ON tp.requires_topic_id = t.id
             LEFT JOIN student_topic_scores sts ON sts.student_id = ? AND sts.topic_id = t.id
             WHERE tp.topic_id = ? AND (sts.mastery_level IS NULL OR sts.mastery_level != 'mastered')
             ORDER BY tp.strength DESC, t.difficulty_level ASC`,
            [studentId, completedTopicId]
        );

        if (unmasteredPrereqs.length > 0) {
            return {
                nextTopicId: unmasteredPrereqs[0].id,
                nextTopicName: unmasteredPrereqs[0].name,
                reason: `Let's strengthen ${unmasteredPrereqs[0].name} before continuing`,
                type: 'prerequisite_gap'
            };
        }

        // No unmastered prereqs, review weak areas
        const weakTopics = await getWeakTopics(db, studentId);
        if (weakTopics.length > 0 && weakTopics[0].topic_id !== completedTopicId) {
            return {
                nextTopicId: weakTopics[0].topic_id,
                nextTopicName: weakTopics[0].name,
                reason: `Let's revisit ${weakTopics[0].name} — you scored low here earlier`,
                type: 'review_weak'
            };
        }

        // Fall through to continue current
        return {
            nextTopicId: completedTopicId,
            nextTopicName: completedTopic.name,
            reason: "Almost mastered! Practice this topic once more",
            type: 'continue_current'
        };
    }

    // score 60-79: mark practicing, return same topic for more practice
    if (score < 80) {
        return {
            nextTopicId: completedTopicId,
            nextTopicName: completedTopic.name,
            reason: "Almost mastered! Practice this topic once more",
            type: 'continue_current'
        };
    }

    // score >= 80: mark mastered, find next topic in chapter by difficulty order
    const nextInChapter = await getAsync(db,
        `SELECT t.id, t.name FROM topics t
         LEFT JOIN student_topic_scores sts ON sts.student_id = ? AND sts.topic_id = t.id
         WHERE t.board = ? AND t.subject = ? AND t.chapter = ? 
         AND t.difficulty_level > ? 
         AND (sts.mastery_level IS NULL OR sts.mastery_level != 'mastered')
         ORDER BY t.difficulty_level ASC
         LIMIT 1`,
        [studentId, completedTopic.board, completedTopic.subject, completedTopic.chapter, completedTopic.difficulty_level]
    );

    if (nextInChapter) {
        return {
            nextTopicId: nextInChapter.id,
            nextTopicName: nextInChapter.name,
            reason: `Well done! You have unlocked ${nextInChapter.name}`,
            type: 'next_topic'
        };
    }

    // No next topic in chapter: find any unmastered topic in same subject
    const nextInSubject = await getAsync(db,
        `SELECT t.id, t.name FROM topics t
         LEFT JOIN student_topic_scores sts ON sts.student_id = ? AND sts.topic_id = t.id
         WHERE t.board = ? AND t.subject = ?
         AND (sts.mastery_level IS NULL OR sts.mastery_level != 'mastered')
         ORDER BY t.difficulty_level ASC
         LIMIT 1`,
        [studentId, completedTopic.board, completedTopic.subject]
    );

    if (nextInSubject) {
        return {
            nextTopicId: nextInSubject.id,
            nextTopicName: nextInSubject.name,
            reason: `Well done! You have unlocked ${nextInSubject.name}`,
            type: 'next_topic'
        };
    }

    // All topics mastered in this subject — check other subjects
    const nextAnywhere = await getAsync(db,
        `SELECT t.id, t.name FROM topics t
         LEFT JOIN student_topic_scores sts ON sts.student_id = ? AND sts.topic_id = t.id
         WHERE t.board = ?
         AND (sts.mastery_level IS NULL OR sts.mastery_level != 'mastered')
         ORDER BY t.difficulty_level ASC
         LIMIT 1`,
        [studentId, completedTopic.board]
    );

    if (nextAnywhere) {
        return {
            nextTopicId: nextAnywhere.id,
            nextTopicName: nextAnywhere.name,
            reason: `Well done! You have unlocked ${nextAnywhere.name}`,
            type: 'next_topic'
        };
    }

    return null; // All topics mastered!
}

/**
 * Returns top 5 weak topics for a student sorted by attempts (most stuck first)
 */
async function getWeakTopics(db, studentId) {
    return await allAsync(db,
        `SELECT sts.*, t.name, t.subject, t.chapter, t.board
         FROM student_topic_scores sts
         JOIN topics t ON sts.topic_id = t.id
         WHERE sts.student_id = ? AND sts.is_weak_area = 1
         ORDER BY sts.attempts DESC, sts.best_score ASC
         LIMIT 5`,
        [studentId]
    );
}

/**
 * Returns mastery stats overall and broken down per subject
 */
async function getMasteryStats(db, studentId) {
    // Get all topics for the student's board
    const allTopics = await allAsync(db,
        `SELECT t.id, t.subject, 
                COALESCE(sts.mastery_level, 'not_started') as mastery_level
         FROM topics t
         LEFT JOIN student_topic_scores sts ON sts.topic_id = t.id AND sts.student_id = ?`,
        [studentId]
    );

    const countMastery = (topics) => {
        const stats = { mastered: 0, practicing: 0, struggling: 0, notStarted: 0 };
        for (const t of topics) {
            switch (t.mastery_level) {
                case 'mastered': stats.mastered++; break;
                case 'practicing': stats.practicing++; break;
                case 'struggling': stats.struggling++; break;
                default: stats.notStarted++; break;
            }
        }
        return stats;
    };

    const subjects = ['Maths', 'Science', 'English'];
    const bySubject = {};
    for (const subj of subjects) {
        bySubject[subj] = countMastery(allTopics.filter(t => t.subject === subj));
    }

    return {
        overall: countMastery(allTopics),
        bySubject
    };
}

/**
 * Checks if student has completed all strength=3 prerequisites for a topic
 * Returns: { ready: boolean, missingTopics: [{id, name}] }
 */
async function checkPrerequisiteReadiness(db, studentId, topicId) {
    const criticalPrereqs = await allAsync(db,
        `SELECT tp.requires_topic_id, t.name,
                COALESCE(sts.mastery_level, 'not_started') as mastery_level
         FROM topic_prerequisites tp
         JOIN topics t ON tp.requires_topic_id = t.id
         LEFT JOIN student_topic_scores sts ON sts.student_id = ? AND sts.topic_id = tp.requires_topic_id
         WHERE tp.topic_id = ? AND tp.strength = 3`,
        [studentId, topicId]
    );

    const missingTopics = criticalPrereqs
        .filter(p => p.mastery_level !== 'mastered')
        .map(p => ({ id: p.requires_topic_id, name: p.name }));

    return {
        ready: missingTopics.length === 0,
        missingTopics
    };
}

module.exports = { getNextTopic, getWeakTopics, getMasteryStats, checkPrerequisiteReadiness };
