CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin'))
);

CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    board TEXT NOT NULL CHECK(board IN ('CBSE', 'SSC')),
    subject TEXT NOT NULL CHECK(subject IN ('Maths', 'Science', 'English')),
    chapter TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL CHECK(difficulty_level BETWEEN 1 AND 5),
    prerequisite_topic_ids TEXT DEFAULT '[]' -- JSON array of topic IDs
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON array of 4 options
    correct_index INTEGER NOT NULL CHECK(correct_index BETWEEN 0 AND 3),
    explanation TEXT,
    FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_topic_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    last_score INTEGER DEFAULT 0,
    is_weak_area BOOLEAN DEFAULT FALSE,
    mastery_level TEXT DEFAULT 'not_started',
    last_attempt_at DATETIME,
    UNIQUE(student_id, topic_id),
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS topic_prerequisites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    requires_topic_id INTEGER NOT NULL,
    strength INTEGER DEFAULT 1,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (requires_topic_id) REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS generated_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation_english TEXT,
    explanation_telugu TEXT DEFAULT '',
    source TEXT DEFAULT 'ai_generated',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);
