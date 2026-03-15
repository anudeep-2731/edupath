const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateQuestions = async (board, subject, topicName) => {
    const prompt = `Generate 3 multiple choice questions for Class 8 ${board} ${subject} topic: ${topicName}. Each question must have 4 options, 1 correct answer, and a brief explanation. Return exactly as a JSON array with fields: question, options[4], correct_index, explanation. No markdown formatting, just pure JSON array string.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
            }
        });
        
        let text = response.text;
        
        try {
            const result = JSON.parse(text);
            return result;
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", text);
            return [];
        }

    } catch (error) {
        console.error("Gemini API Error in generateQuestions:", error);
        return [];
    }
};

const generateHint = async (questionText) => {
    const prompt = `Give a simple, encouraging hint for a Class 8 student who got this wrong: "${questionText}". Keep it under 50 words and don't give the answer directly.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error in generateHint:", error);
        return "Think about the definitions we learned in this chapter. You can do it!";
    }
};

// Enhanced function for adaptive engine - checks DB cache first
const generateQuestionsForTopic = async (db, topicId, topicName, board, subject, count = 5) => {
    const { allAsync } = require('./dbHelpers');
    
    // Check DB cache first
    const existing = await allAsync(db, 
        `SELECT * FROM generated_questions WHERE topic_id = ?`, [topicId]
    );
    
    if (existing && existing.length >= count) {
        return existing.slice(0, count).map(q => ({
            question: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correct_index: q.correct_index,
            explanation: q.explanation_english
        }));
    }
    
    const needed = count - (existing ? existing.length : 0);
    
    const prompt = `Generate ${needed} multiple choice questions for Class 8 ${board} ${subject} topic: "${topicName}".
Rules:
- Test conceptual understanding, not memorization
- Simple clear English that a Class 8 AP SSC English medium student understands
- Each question has exactly 4 options (A, B, C, D)
- Return ONLY a JSON array, no other text, no markdown backticks
Format: [{"question":"...","options":["A...","B...","C...","D..."],"correct_index":0,"explanation_english":"..."}]
correct_index is 0-based (0=A, 1=B, 2=C, 3=D).
explanation_english must be 1-2 clear sentences explaining why the answer is correct.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const result = JSON.parse(response.text);
        
        if (result && result.length > 0) {
            const { runAsync } = require('./dbHelpers');
            for (const q of result) {
                await runAsync(db,
                    `INSERT INTO generated_questions (topic_id, question_text, option_a, option_b, option_c, option_d, correct_index, explanation_english, explanation_telugu, source)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 'ai_generated')`,
                    [topicId, q.question, q.options[0], q.options[1], q.options[2], q.options[3], q.correct_index, q.explanation_english || q.explanation || '']
                );
            }
        }
        
        // Return all questions including cached
        const allQs = await allAsync(db, `SELECT * FROM generated_questions WHERE topic_id = ?`, [topicId]);
        return allQs.slice(0, count).map(q => ({
            question: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correct_index: q.correct_index,
            explanation: q.explanation_english
        }));
    } catch (error) {
        console.error("Gemini API Error in generateQuestionsForTopic:", error);
        return existing ? existing.map(q => ({
            question: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            correct_index: q.correct_index,
            explanation: q.explanation_english
        })) : [];
    }
};

const getHintInEnglish = async (questionText, correctAnswer, topicName) => {
    const prompt = `A Class 8 AP SSC English medium student got this question wrong: "${questionText}"
The correct answer is: "${correctAnswer}"
Topic: ${topicName}

Write a helpful hint in simple English that:
- Does NOT directly give the answer
- Gives a clue or simpler explanation to help them think
- Is warm and encouraging in tone
- Is maximum 3 sentences
- Uses simple language a Class 8 student understands
Return only the hint text, nothing else.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error in getHintInEnglish:", error);
        return "Think carefully about what you learned in this topic. Try to eliminate the options you know are wrong. You can do it!";
    }
};

module.exports = {
    generateQuestions,
    generateHint,
    generateQuestionsForTopic,
    getHintInEnglish
};
