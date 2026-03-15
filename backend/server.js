require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const syllabusRoutes = require('./routes/syllabus');
const quizRoutes = require('./routes/quiz');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teacher');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'EduPath API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
