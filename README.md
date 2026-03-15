# EduPath - AI Adaptive Learning Platform

EduPath is an AI-powered adaptive learning platform designed for Class 8 students covering both SSC (Andhra Pradesh / Telangana State Board) and CBSE syllabuses. It includes a frontend built with React, Vite, and Tailwind CSS, and a Node.js/Express backend using SQLite for the database.

## Features Let's you Explore
1. **Student Dashboard**: Includes overall mastery ring, subject progress cards, and weak area focus recommendations.
2. **Adaptive AI Quiz Engine**: Automatically uses the Gemini API to ask new questions if the database questions for a topic run out, and uses AI to generate on-demand personalized hints if the student gets a question wrong.
3. **Syllabus Knowledge Graph**: Interactive visual tree built with React Flow showing topics and prerequisites for CBSE and SSC boards based on the Class 8 syllabus.
4. **Teacher Class Dashboard**: Features a class performance Heatmap to easily visualize strong and weak students across topics, with a student drill-down view showing their personalized knowledge graph stats and AI-recommended interventions.

## Setup Instructions

### 1. Prerequisites
- Node.js installed (v16+ recommended).
- Add a Google Gemini API Key to your `.env` file as `GEMINI_API_KEY`.

### 2. Backend Setup
The database is already seeded during initialization, but you can reset it anytime.

\`\`\`bash
cd edupath/backend
# Install dependencies
npm install
# Keep the server running
npm start
\`\`\`

The API server will run on `http://localhost:3000`.

### 3. Frontend Setup
In a new terminal:

\`\`\`bash
cd edupath/frontend
# Install dependencies
npm install
# Start the Vite dev server
npm run dev
\`\`\`

The frontend will run on `http://localhost:5173`.

## Demo Walkthrough
1. **Log in as Student**: 
   - Click "Student" on the demo accounts bar.
   - This logs you in as Ravi Kumar. Check out the dashboard stats and recommendations.
   - Click **Resume Quiz** or **Practice This Topic** in the Knowledge graph to take a quiz.
   - Answer a question incorrectly to test the "Need a hint?" AI feature.
2. **Log in as Teacher**:
   - Log out and click "Teacher" on the demo accounts bar.
   - View the class overview metrics.
   - Scroll down to the Heatmap and click on any colored block to open the Student Detail Panel on the right and view AI recommended interventions.
   - Click "Class Knowledge Graph" at the top right to see the Syllabus graph overlay.
