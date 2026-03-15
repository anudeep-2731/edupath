const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// Remove existing DB to ensure a clean seed
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Removed existing database.');
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
});

const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
    console.log('Creating database schema...');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error executing schema', err.message);
            process.exit(1);
        }
        console.log('Schema created successfully.');
        seedData();
    });
});

function seedData() {
    console.log('Seeding demo accounts...');
    
    // Seed users
    const stmtUsers = db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    const users = [
        ['Admin', 'admin@demo.com', 'password123', 'admin'],
        ['Mrs. Sharma', 'teacher@demo.com', 'password123', 'teacher'],
        ['Ravi Kumar', 'ravi@demo.com', 'password123', 'student'],
        ['Priya Sharma', 'priya@demo.com', 'password123', 'student'],
        ['Aakash Reddy', 'aakash@demo.com', 'password123', 'student'],
        ['Meena Rao', 'meena@demo.com', 'password123', 'student'],
        ['Vikram Singh', 'vikram@demo.com', 'password123', 'student'],
        ['Ananya Das', 'ananya@demo.com', 'password123', 'student']
    ];
    
    for (const u of users) {
        stmtUsers.run(u, (err) => {
            if (err) console.error('Error inserting user:', u[1], err.message);
        });
    }
    stmtUsers.finalize();

    console.log('Seeding topics...');
    
    // Seed topics (using manual IDs to simplify prerequisite mapping)
    const topics = [
        // CBSE Class 8 — Mathematics
        [1, 'Rational Numbers', 'CBSE', 'Maths', 'Number System', 2, '[]'],
        [2, 'Integers', 'CBSE', 'Maths', 'Number System', 1, '[1]'],
        [3, 'Fractions', 'CBSE', 'Maths', 'Number System', 3, '[2]'],
        
        [4, 'Linear Equations in One Variable', 'CBSE', 'Maths', 'Algebra', 3, '[]'],
        [5, 'Algebra Basics', 'CBSE', 'Maths', 'Algebra', 2, '[4]'],

        [6, 'Understanding Quadrilaterals', 'CBSE', 'Maths', 'Geometry', 2, '[]'],
        [7, 'Polygons', 'CBSE', 'Maths', 'Geometry', 3, '[6]'],
        [8, 'Triangles', 'CBSE', 'Maths', 'Geometry', 2, '[7]'],

        [9, 'Data Handling', 'CBSE', 'Maths', 'Statistics', 2, '[]'],
        [10, 'Bar Graphs', 'CBSE', 'Maths', 'Statistics', 1, '[9]'],
        [11, 'Pie Charts', 'CBSE', 'Maths', 'Statistics', 3, '[10]'],
        [12, 'Probability', 'CBSE', 'Maths', 'Statistics', 4, '[11]'],

        [13, 'Squares and Square Roots', 'CBSE', 'Maths', 'Number System', 3, '[]'],
        [14, 'Cubes and Cube Roots', 'CBSE', 'Maths', 'Number System', 4, '[13]'],
        [15, 'Exponents', 'CBSE', 'Maths', 'Number System', 5, '[14]'],

        // CBSE Class 8 — Science
        [16, 'Crop Production and Management', 'CBSE', 'Science', 'Biology', 2, '[]'],
        [17, 'Microorganisms', 'CBSE', 'Science', 'Biology', 3, '[16]'],

        [18, 'Coal and Petroleum', 'CBSE', 'Science', 'Chemistry', 2, '[]'],
        [19, 'Combustion and Flame', 'CBSE', 'Science', 'Chemistry', 3, '[18]'],
        [20, 'Conservation of Natural Resources', 'CBSE', 'Science', 'General', 2, '[19]'],

        [21, 'Force and Pressure', 'CBSE', 'Science', 'Physics', 3, '[]'],
        [22, 'Friction', 'CBSE', 'Science', 'Physics', 2, '[21]'],
        [23, 'Sound', 'CBSE', 'Science', 'Physics', 3, '[22]'],
        [24, 'Light', 'CBSE', 'Science', 'Physics', 4, '[23]'],

        [25, 'Cell Structure and Functions', 'CBSE', 'Science', 'Biology', 4, '[]'],
        [26, 'Reproduction in Animals', 'CBSE', 'Science', 'Biology', 4, '[25]'],
        [27, 'Reaching the Age of Adolescence', 'CBSE', 'Science', 'Biology', 3, '[26]'],

        [28, 'Stars and the Solar System', 'CBSE', 'Science', 'Physics', 3, '[]'],
        [29, 'Pollution of Air and Water', 'CBSE', 'Science', 'General', 2, '[]'],

        // SSC (AP/Telangana) Class 8 — Mathematics
        [30, 'Real Numbers', 'SSC', 'Maths', 'Number System', 3, '[]'],
        [31, 'Exponents and Powers', 'SSC', 'Maths', 'Number System', 4, '[30]'],
        [32, 'Sets', 'SSC', 'Maths', 'Algebra', 5, '[31]'],

        [33, 'Algebraic Expressions', 'SSC', 'Maths', 'Algebra', 3, '[]'],
        [34, 'Linear Equations', 'SSC', 'Maths', 'Algebra', 4, '[33]'],
        [35, 'Factorisation', 'SSC', 'Maths', 'Algebra', 5, '[34]'],

        [36, 'Lines and Angles', 'SSC', 'Maths', 'Geometry', 2, '[]'],
        [37, 'Triangle and its Properties', 'SSC', 'Maths', 'Geometry', 3, '[36]'],
        [38, 'Congruence', 'SSC', 'Maths', 'Geometry', 4, '[37]'],

        [39, 'Data Handling', 'SSC', 'Maths', 'Statistics', 2, '[]'],
        [40, 'Statistics', 'SSC', 'Maths', 'Statistics', 3, '[39]'],
        [41, 'Graphs', 'SSC', 'Maths', 'Statistics', 2, '[40]'],

        [42, 'Mensuration', 'SSC', 'Maths', 'Geometry', 4, '[]'],
        [43, 'Area and Perimeter', 'SSC', 'Maths', 'Geometry', 3, '[42]'],
        [44, 'Volume', 'SSC', 'Maths', 'Geometry', 5, '[43]'],

        // SSC Class 8 — Science (16 topics)
        [45, 'Is Matter Around Us Pure', 'SSC', 'Science', 'Matter', 2, '[]'],
        [46, 'Mixtures and Solutions', 'SSC', 'Science', 'Matter', 2, '[45]'],
        [47, 'Separation of Substances', 'SSC', 'Science', 'Matter', 3, '[46]'],
        [48, 'Atoms and Molecules', 'SSC', 'Science', 'Atoms', 3, '[45]'],
        [49, 'Structure of Atom', 'SSC', 'Science', 'Atoms', 4, '[48]'],
        [50, 'Atomic Number and Mass Number', 'SSC', 'Science', 'Atoms', 3, '[49]'],
        [51, 'Force and Laws of Motion', 'SSC', 'Science', 'Force', 3, '[]'],
        [52, 'Gravitation', 'SSC', 'Science', 'Force', 3, '[51]'],
        [53, 'Work and Energy', 'SSC', 'Science', 'Force', 4, '[52]'],
        [54, 'Pressure', 'SSC', 'Science', 'Force', 3, '[51]'],
        [55, 'Cell: Fundamental Unit of Life', 'SSC', 'Science', 'Biology', 2, '[]'],
        [56, 'Tissues', 'SSC', 'Science', 'Biology', 3, '[55]'],
        [57, 'Plant and Animal Cells', 'SSC', 'Science', 'Biology', 2, '[55]'],
        [58, 'Natural Resources', 'SSC', 'Science', 'Environment', 2, '[]'],
        [59, 'Improvement in Food Resources', 'SSC', 'Science', 'Environment', 3, '[58]'],
        [60, 'Conservation of Natural Resources', 'SSC', 'Science', 'Environment', 3, '[58]'],

        // SSC Class 8 — English (19 topics)
        [61, 'Parts of Speech', 'SSC', 'English', 'Grammar', 1, '[]'],
        [62, 'Nouns and Pronouns', 'SSC', 'English', 'Grammar', 1, '[61]'],
        [63, 'Adjectives and Adverbs', 'SSC', 'English', 'Grammar', 2, '[61]'],
        [64, 'Verbs and Tenses', 'SSC', 'English', 'Grammar', 2, '[61]'],
        [65, 'Simple Present and Past Tense', 'SSC', 'English', 'Grammar', 2, '[64]'],
        [66, 'Present Perfect and Past Perfect', 'SSC', 'English', 'Grammar', 3, '[65]'],
        [67, 'Future Tense', 'SSC', 'English', 'Grammar', 2, '[65]'],
        [68, 'Active and Passive Voice', 'SSC', 'English', 'Grammar', 4, '[64]'],
        [69, 'Direct and Indirect Speech', 'SSC', 'English', 'Grammar', 4, '[64]'],
        [70, 'Sentence Types', 'SSC', 'English', 'Sentences', 2, '[]'],
        [71, 'Subject and Predicate', 'SSC', 'English', 'Sentences', 2, '[61]'],
        [72, 'Clauses and Phrases', 'SSC', 'English', 'Sentences', 3, '[70]'],
        [73, 'Conjunctions', 'SSC', 'English', 'Sentences', 2, '[61]'],
        [74, 'Prepositions', 'SSC', 'English', 'Sentences', 2, '[61]'],
        [75, 'Comprehension Skills', 'SSC', 'English', 'Reading', 3, '[]'],
        [76, 'Vocabulary Building', 'SSC', 'English', 'Reading', 2, '[61]'],
        [77, 'Letter Writing', 'SSC', 'English', 'Writing', 3, '[]'],
        [78, 'Essay Writing', 'SSC', 'English', 'Writing', 4, '[]'],
        [79, 'Paragraph Writing', 'SSC', 'English', 'Writing', 3, '[]'],
    ];

    const stmtTopics = db.prepare("INSERT OR IGNORE INTO topics (id, name, board, subject, chapter, difficulty_level, prerequisite_topic_ids) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const t of topics) {
        stmtTopics.run(t, (err) => {
             if (err) console.error('Error inserting topic:', t[1], err.message);
        });
    }
    stmtTopics.finalize(() => {
        console.log(`Inserted ${topics.length} topics.`);
        seedPrerequisites();
    });
}

function seedPrerequisites() {
    // SSC Maths prerequisites
    const mathsPrerequisites = [
        ["Linear Equations", "Algebraic Expressions", 3],
        ["Algebraic Expressions", "Real Numbers", 2],
        ["Factorisation", "Algebraic Expressions", 3],
        ["Factorisation", "Linear Equations", 2],
        ["Triangle and its Properties", "Lines and Angles", 3],
        ["Congruence", "Triangle and its Properties", 3],
        ["Area and Perimeter", "Lines and Angles", 2],
        ["Volume", "Area and Perimeter", 3],
        ["Mensuration", "Volume", 2],
        ["Mensuration", "Area and Perimeter", 3],
        ["Exponents and Powers", "Real Numbers", 2],
        ["Sets", "Real Numbers", 1],
        ["Statistics", "Data Handling", 2],
        ["Graphs", "Statistics", 2],
    ];

    // SSC Science prerequisites
    const sciencePrerequisites = [
        ["Mixtures and Solutions", "Is Matter Around Us Pure", 3],
        ["Separation of Substances", "Mixtures and Solutions", 3],
        ["Atoms and Molecules", "Is Matter Around Us Pure", 2],
        ["Structure of Atom", "Atoms and Molecules", 3],
        ["Atomic Number and Mass Number", "Structure of Atom", 3],
        ["Atomic Number and Mass Number", "Atoms and Molecules", 2],
        ["Gravitation", "Force and Laws of Motion", 3],
        ["Work and Energy", "Force and Laws of Motion", 3],
        ["Work and Energy", "Gravitation", 2],
        ["Pressure", "Force and Laws of Motion", 2],
        ["Plant and Animal Cells", "Cell: Fundamental Unit of Life", 3],
        ["Tissues", "Cell: Fundamental Unit of Life", 3],
        ["Tissues", "Plant and Animal Cells", 2],
        ["Conservation of Natural Resources", "Natural Resources", 3],
        ["Improvement in Food Resources", "Natural Resources", 2],
        ["Conservation of Natural Resources", "Improvement in Food Resources", 1],
    ];

    // SSC English prerequisites
    const englishPrerequisites = [
        ["Nouns and Pronouns", "Parts of Speech", 3],
        ["Adjectives and Adverbs", "Parts of Speech", 3],
        ["Adjectives and Adverbs", "Nouns and Pronouns", 2],
        ["Verbs and Tenses", "Parts of Speech", 3],
        ["Verbs and Tenses", "Nouns and Pronouns", 2],
        ["Simple Present and Past Tense", "Verbs and Tenses", 3],
        ["Present Perfect and Past Perfect", "Simple Present and Past Tense", 3],
        ["Future Tense", "Simple Present and Past Tense", 2],
        ["Active and Passive Voice", "Verbs and Tenses", 3],
        ["Active and Passive Voice", "Simple Present and Past Tense", 3],
        ["Direct and Indirect Speech", "Verbs and Tenses", 3],
        ["Direct and Indirect Speech", "Simple Present and Past Tense", 2],
        ["Direct and Indirect Speech", "Active and Passive Voice", 1],
        ["Subject and Predicate", "Parts of Speech", 3],
        ["Subject and Predicate", "Nouns and Pronouns", 2],
        ["Sentence Types", "Subject and Predicate", 2],
        ["Clauses and Phrases", "Sentence Types", 3],
        ["Clauses and Phrases", "Conjunctions", 2],
        ["Conjunctions", "Parts of Speech", 2],
        ["Prepositions", "Parts of Speech", 2],
        ["Prepositions", "Nouns and Pronouns", 1],
        ["Vocabulary Building", "Parts of Speech", 2],
        ["Comprehension Skills", "Vocabulary Building", 2],
        ["Comprehension Skills", "Sentence Types", 2],
        ["Paragraph Writing", "Sentence Types", 3],
        ["Paragraph Writing", "Vocabulary Building", 2],
        ["Letter Writing", "Paragraph Writing", 3],
        ["Letter Writing", "Sentence Types", 2],
        ["Essay Writing", "Paragraph Writing", 3],
        ["Essay Writing", "Letter Writing", 2],
        ["Essay Writing", "Comprehension Skills", 1],
    ];

    const allPrereqs = [...mathsPrerequisites, ...sciencePrerequisites, ...englishPrerequisites];
    
    // We need to look up topic IDs by name. Build a map from the topics array.
    db.all("SELECT id, name FROM topics WHERE board = 'SSC'", [], (err, rows) => {
        if (err) {
            console.error('Error fetching SSC topics:', err.message);
            return;
        }
        
        const topicMap = {};
        for (const row of rows) {
            topicMap[row.name] = row.id;
        }
        
        const stmt = db.prepare("INSERT OR IGNORE INTO topic_prerequisites (topic_id, requires_topic_id, strength) VALUES (?, ?, ?)");
        
        for (const [topicName, reqName, strength] of allPrereqs) {
            const topicId = topicMap[topicName];
            const reqId = topicMap[reqName];
            
            if (topicId && reqId) {
                stmt.run([topicId, reqId, strength], (err) => {
                    if (err) console.error(`Error inserting prerequisite ${topicName} -> ${reqName}:`, err.message);
                });
            } else {
                console.warn(`Warning: Could not find topic IDs for prerequisite: ${topicName} -> ${reqName}`);
            }
        }
        
        stmt.finalize(() => {
            console.log('Prerequisites seeded successfully.');
            seedMockScores();
        });
    });
}

function seedMockScores() {
    console.log('Seeding mock scores...');
    
    const studentIds = [3, 4, 5, 6, 7, 8];
    
    db.all("SELECT id FROM topics", [], (err, topicRows) => {
        if (err) {
            console.error('Error fetching topics for scores:', err.message);
            return;
        }
        
        const topicIds = topicRows.map(t => t.id);
        
        const stmtScores = db.prepare(`
            INSERT OR IGNORE INTO student_topic_scores 
            (student_id, topic_id, attempts, best_score, last_score, is_weak_area, mastery_level, last_attempt_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
        `);

        for (const sid of studentIds) {
            for (const tid of topicIds) {
                const r = Math.random();
                if (r < 0.1) continue; // Not attempted
                
                let best_score, last_score, attempts, is_weak, mastery_level;
                const dayOffset = '-' + Math.floor(Math.random() * 10) + ' days';
                
                attempts = Math.floor(Math.random() * 4) + 1;
                
                if (r < 0.4) { // 30% Mastered
                    best_score = Math.floor(Math.random() * (95 - 75 + 1)) + 75;
                    is_weak = 0;
                    mastery_level = best_score >= 80 ? 'mastered' : 'practicing';
                } else if (r < 0.8) { // 40% Practicing
                    best_score = Math.floor(Math.random() * (74 - 45 + 1)) + 45;
                    is_weak = 0;
                    mastery_level = 'practicing';
                } else { // 20% Weak
                    best_score = Math.floor(Math.random() * (44 - 20 + 1)) + 20;
                    if (Math.random() > 0.5) {
                        attempts = Math.floor(Math.random() * 3) + 3;
                    }
                    is_weak = best_score < 60 ? 1 : 0;
                    mastery_level = 'struggling';
                }
                last_score = best_score - Math.floor(Math.random() * 10);
                if (last_score < 0) last_score = 0;
                
                stmtScores.run([sid, tid, attempts, best_score, last_score, is_weak, mastery_level, dayOffset], (err) => {
                     if (err && !err.message.includes('UNIQUE')) console.error('Error inserting score for sid/tid:', sid, tid, err.message);
                });
            }
        }
        stmtScores.finalize(() => {
            console.log('Mock scores seeded.');
            seedInitialQuestions();
        });
    });
}

function seedInitialQuestions() {
    console.log('Seeding initial questions for CBSE...');
    
    const sqlQuestions = `
        INSERT OR IGNORE INTO questions (topic_id, question_text, options, correct_index, explanation) VALUES 
        (1, 'Which of the following is a rational number?', '["√2", "π", "3/4", "e"]', 2, 'A rational number can be expressed as a fraction p/q where p and q are integers and q is not zero.'),
        (1, 'What is the additive inverse of -5/9?', '["5/9", "9/5", "-9/5", "1"]', 0, 'The additive inverse of a number a is -a, such that their sum is 0.'),
        (1, 'Which property is represented by a × b = b × a?', '["Associative", "Distributive", "Commutative", "Closure"]', 2, 'The commutative property states that changing the order of the operands does not change the result.'),
        (1, 'The multiplicative identity for rational numbers is:', '["0", "1", "-1", "None of these"]', 1, 'Multiplying any rational number by 1 gives the number itself.'),
        (1, 'Evaluate: 1/2 + 1/3', '["2/5", "5/6", "1/6", "1"]', 1, 'LCM of 2 and 3 is 6. 3/6 + 2/6 = 5/6.')
    `;
    
    db.exec(sqlQuestions, (err) => {
        if (err) console.error('Error inserting initial questions:', err.message);
        console.log('Initial CBSE questions seeded.');
        seedGeneratedQuestions();
    });
}

function seedGeneratedQuestions() {
    console.log('Seeding generated questions for SSC Science and English...');
    
    // We need topic IDs by name
    db.all("SELECT id, name, subject FROM topics WHERE board = 'SSC'", [], (err, rows) => {
        if (err) {
            console.error('Error fetching SSC topics:', err.message);
            return;
        }
        
        const topicMap = {};
        for (const row of rows) {
            topicMap[row.name] = row.id;
        }
        
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO generated_questions 
            (topic_id, question_text, option_a, option_b, option_c, option_d, correct_index, explanation_english, explanation_telugu, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 'seeded')
        `);
        
        // ===== SSC SCIENCE QUESTIONS =====
        
        // Is Matter Around Us Pure (id: 45)
        const scienceQuestions = [
            // Is Matter Around Us Pure
            [topicMap["Is Matter Around Us Pure"], "Which of the following is a pure substance?", "Salt water", "Gold", "Air", "Milk", 1, "Gold is a pure substance because it consists of only one type of atom. Salt water, air, and milk are all mixtures."],
            [topicMap["Is Matter Around Us Pure"], "A substance that contains only one type of particle is called:", "Mixture", "Compound", "Solution", "Pure substance", 3, "A pure substance has uniform composition throughout and contains only one type of particle, either an element or a compound."],
            [topicMap["Is Matter Around Us Pure"], "Which property helps us identify whether matter is pure or impure?", "Color only", "Fixed melting and boiling point", "Size of the sample", "Shape of container", 1, "Pure substances have fixed melting and boiling points, while impure substances have variable ones."],
            
            // Mixtures and Solutions
            [topicMap["Mixtures and Solutions"], "Which of the following is a homogeneous mixture?", "Sand and water", "Oil and water", "Sugar solution", "Chalk powder in water", 2, "A sugar solution is homogeneous because sugar dissolves completely in water, making the composition uniform throughout."],
            [topicMap["Mixtures and Solutions"], "The substance that dissolves in a solvent is called:", "Solute", "Solution", "Suspension", "Colloid", 0, "The solute is the substance that gets dissolved in a solvent to form a solution."],
            [topicMap["Mixtures and Solutions"], "Which is NOT a characteristic of a solution?", "Homogeneous", "Transparent", "Particles settle down over time", "Cannot be separated by filtration", 2, "In a true solution, particles do not settle down. If particles settle, it is a suspension, not a solution."],
            
            // Separation of Substances
            [topicMap["Separation of Substances"], "Which method is used to separate salt from sea water?", "Filtration", "Evaporation", "Distillation", "Sedimentation", 1, "Evaporation is used to separate salt from sea water. When water evaporates, salt crystals are left behind."],
            [topicMap["Separation of Substances"], "Chromatography is used to separate:", "Insoluble solids from liquids", "Different colored dyes in a mixture", "Sand from water", "Oil from water", 1, "Chromatography separates components that move at different speeds through a medium, commonly used to separate colored dyes."],
            [topicMap["Separation of Substances"], "Which separation technique works based on differences in boiling point?", "Filtration", "Sedimentation", "Distillation", "Magnetic separation", 2, "Distillation separates mixtures based on differences in boiling points of the components."],
            
            // Atoms and Molecules
            [topicMap["Atoms and Molecules"], "What is the smallest particle of an element that retains its chemical properties?", "Molecule", "Atom", "Electron", "Compound", 1, "An atom is the smallest particle of an element that still has the chemical properties of that element. Molecules are made up of two or more atoms."],
            [topicMap["Atoms and Molecules"], "The chemical formula of water is H2O. How many atoms are in one molecule of water?", "2", "3", "1", "4", 1, "H2O contains 2 hydrogen atoms and 1 oxygen atom, making a total of 3 atoms in one molecule of water."],
            [topicMap["Atoms and Molecules"], "Who proposed the atomic theory?", "Rutherford", "Bohr", "Dalton", "Thomson", 2, "John Dalton proposed the modern atomic theory in 1808, stating that all matter is made up of tiny indivisible particles called atoms."],
            
            // Structure of Atom
            [topicMap["Structure of Atom"], "The nucleus of an atom contains:", "Electrons and protons", "Protons and neutrons", "Only electrons", "Only neutrons", 1, "The nucleus contains protons (positively charged) and neutrons (neutral). Electrons orbit around the nucleus."],
            [topicMap["Structure of Atom"], "Who discovered the electron?", "Rutherford", "J.J. Thomson", "Niels Bohr", "Dalton", 1, "J.J. Thomson discovered the electron in 1897 through his cathode ray tube experiments."],
            [topicMap["Structure of Atom"], "Which subatomic particle has no electric charge?", "Proton", "Electron", "Neutron", "All have charge", 2, "Neutrons are electrically neutral particles found in the nucleus of an atom."],
            
            // Atomic Number and Mass Number
            [topicMap["Atomic Number and Mass Number"], "The atomic number of an element is equal to the number of:", "Neutrons", "Protons", "Electrons in outer shell", "Protons and neutrons", 1, "The atomic number equals the number of protons in the nucleus of an atom."],
            [topicMap["Atomic Number and Mass Number"], "Mass number is the sum of:", "Protons and electrons", "Protons and neutrons", "Neutrons and electrons", "All subatomic particles", 1, "Mass number = number of protons + number of neutrons in the nucleus."],
            [topicMap["Atomic Number and Mass Number"], "If an atom has 11 protons and 12 neutrons, its mass number is:", "11", "12", "23", "1", 2, "Mass number = protons + neutrons = 11 + 12 = 23."],
            
            // Force and Laws of Motion
            [topicMap["Force and Laws of Motion"], "Newton's first law of motion is also known as the law of:", "Acceleration", "Action and reaction", "Inertia", "Gravitation", 2, "Newton's first law states that an object remains at rest or in uniform motion unless acted upon by an external force. This is the law of inertia."],
            [topicMap["Force and Laws of Motion"], "The SI unit of force is:", "Watt", "Joule", "Newton", "Pascal", 2, "The SI unit of force is Newton (N), named after Sir Isaac Newton."],
            [topicMap["Force and Laws of Motion"], "According to Newton's third law, for every action there is:", "No reaction", "An equal and opposite reaction", "A greater reaction", "A delayed reaction", 1, "Newton's third law states that for every action, there is an equal and opposite reaction."],
            
            // Gravitation
            [topicMap["Gravitation"], "The value of acceleration due to gravity on Earth is approximately:", "8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "7.8 m/s²", 1, "The acceleration due to gravity on Earth's surface is approximately 9.8 m/s²."],
            [topicMap["Gravitation"], "Gravitational force between two objects depends on:", "Only their masses", "Only the distance between them", "Both their masses and distance", "Their shapes", 2, "According to Newton's law of gravitation, the force depends on both the masses of the objects and the distance between them."],
            [topicMap["Gravitation"], "Weight of an object on the moon is:", "Same as on Earth", "More than on Earth", "About 1/6th of weight on Earth", "Zero", 2, "The moon has about 1/6th the gravitational acceleration of Earth, so objects weigh about 1/6th of their Earth weight."],
            
            // Work and Energy
            [topicMap["Work and Energy"], "Work is done when a force:", "Is applied but object does not move", "Moves an object in the direction of force", "Is applied perpendicular to motion", "Is balanced by another force", 1, "Work is done when a force causes displacement in the direction of the applied force. W = F × d."],
            [topicMap["Work and Energy"], "The SI unit of energy is:", "Newton", "Watt", "Joule", "Pascal", 2, "The SI unit of energy is Joule (J). It is the same as the unit of work."],
            [topicMap["Work and Energy"], "Kinetic energy depends on:", "Mass only", "Velocity only", "Both mass and velocity", "Shape of object", 2, "Kinetic energy = ½mv². It depends on both the mass and the velocity of the object."],
            
            // Pressure
            [topicMap["Pressure"], "Pressure is defined as:", "Force × Area", "Force / Area", "Force + Area", "Force - Area", 1, "Pressure = Force / Area. It is the force exerted per unit area on a surface."],
            [topicMap["Pressure"], "The SI unit of pressure is:", "Newton", "Joule", "Pascal", "Watt", 2, "The SI unit of pressure is Pascal (Pa), which equals 1 Newton per square meter."],
            [topicMap["Pressure"], "Why do sharp knives cut better than blunt ones?", "They have more force", "They apply more pressure on smaller area", "They are heavier", "They are longer", 1, "Sharp knives have a smaller contact area, which increases the pressure (Force/Area) for the same applied force."],
            
            // Cell: Fundamental Unit of Life
            [topicMap["Cell: Fundamental Unit of Life"], "Who discovered cells?", "Leeuwenhoek", "Robert Hooke", "Schleiden", "Schwann", 1, "Robert Hooke discovered cells in 1665 while examining a thin slice of cork under his microscope."],
            [topicMap["Cell: Fundamental Unit of Life"], "The cell membrane is:", "Fully permeable", "Selectively permeable", "Completely impermeable", "Not present in all cells", 1, "The cell membrane is selectively permeable, allowing only certain substances to pass through while blocking others."],
            [topicMap["Cell: Fundamental Unit of Life"], "Which organelle is called the powerhouse of the cell?", "Nucleus", "Ribosome", "Mitochondria", "Golgi body", 2, "Mitochondria are called the powerhouse of the cell because they produce energy (ATP) through cellular respiration."],
            
            // Tissues
            [topicMap["Tissues"], "A group of cells that are similar in structure and work together is called:", "Organ", "Tissue", "Organ system", "Organism", 1, "A tissue is a group of similar cells that work together to perform a specific function in the body."],
            [topicMap["Tissues"], "Which tissue provides support and protection in plants?", "Meristematic tissue", "Permanent tissue", "Sclerenchyma", "Parenchyma", 2, "Sclerenchyma is a type of permanent tissue that provides mechanical support and protection. Its cells have thick, lignified walls."],
            [topicMap["Tissues"], "Muscular tissue is responsible for:", "Carrying messages", "Movement of the body", "Making food", "Storing water", 1, "Muscular tissue is specialized for contraction and is responsible for all types of movement in the body."],
            
            // Plant and Animal Cells
            [topicMap["Plant and Animal Cells"], "Which structure is present in plant cells but absent in animal cells?", "Nucleus", "Cell membrane", "Cell wall", "Mitochondria", 2, "Plant cells have a rigid cell wall made of cellulose outside the cell membrane. Animal cells do not have a cell wall."],
            [topicMap["Plant and Animal Cells"], "Chloroplasts are found in:", "All plant cells", "Only green parts of plants", "Animal cells", "Both plant and animal cells", 1, "Chloroplasts are found only in the green parts of plants where photosynthesis occurs."],
            [topicMap["Plant and Animal Cells"], "The large central vacuole in a plant cell is used for:", "Energy production", "Protein synthesis", "Storage of water and nutrients", "Cell division", 2, "The large central vacuole in plant cells stores water, nutrients, and waste products, and helps maintain cell shape."],
            
            // Natural Resources
            [topicMap["Natural Resources"], "Which of the following is a renewable resource?", "Coal", "Petroleum", "Solar energy", "Natural gas", 2, "Solar energy is renewable because it is continuously available from the sun and will not run out."],
            [topicMap["Natural Resources"], "The major component of air is:", "Oxygen", "Carbon dioxide", "Nitrogen", "Water vapor", 2, "Nitrogen makes up about 78% of the atmosphere, making it the most abundant gas in air."],
            [topicMap["Natural Resources"], "Which layer of the atmosphere protects us from UV rays?", "Troposphere", "Stratosphere (ozone layer)", "Mesosphere", "Thermosphere", 1, "The ozone layer in the stratosphere absorbs most of the sun's harmful ultraviolet (UV) radiation."],
            
            // Improvement in Food Resources
            [topicMap["Improvement in Food Resources"], "Which farming practice helps restore soil fertility?", "Monoculture", "Crop rotation", "Deforestation", "Overgrazing", 1, "Crop rotation helps restore soil fertility by alternating different types of crops, which prevents nutrient depletion."],
            [topicMap["Improvement in Food Resources"], "Manure is better than chemical fertilizers because:", "It costs more", "It improves soil structure and provides organic matter", "It works faster", "It contains more nitrogen", 1, "Manure improves soil structure, adds organic matter, and releases nutrients slowly, making it better for long-term soil health."],
            [topicMap["Improvement in Food Resources"], "The practice of growing two or more crops simultaneously is called:", "Crop rotation", "Mixed cropping", "Monoculture", "Harvesting", 1, "Mixed cropping involves growing two or more crops together in the same field to reduce risk of crop failure."],
            
            // Conservation of Natural Resources
            [topicMap["Conservation of Natural Resources"], "The 3R principle for conservation stands for:", "Read, Review, Recite", "Reduce, Reuse, Recycle", "Rest, Relax, Repeat", "Run, Ride, Row", 1, "The 3R principle — Reduce, Reuse, Recycle — helps conserve natural resources and reduce waste."],
            [topicMap["Conservation of Natural Resources"], "Deforestation leads to:", "More rainfall", "Soil erosion", "Cooler temperatures", "Cleaner air", 1, "Deforestation removes trees that hold soil in place, leading to soil erosion, loss of habitat, and climate change."],
            [topicMap["Conservation of Natural Resources"], "Which is an example of water conservation?", "Leaving taps running", "Rainwater harvesting", "Dumping waste in rivers", "Using more plastic", 1, "Rainwater harvesting collects and stores rainwater for later use, helping conserve water resources."],
        ];
        
        // ===== SSC ENGLISH QUESTIONS =====
        const englishQuestions = [
            // Parts of Speech
            [topicMap["Parts of Speech"], "How many parts of speech are there in English?", "6", "7", "8", "9", 2, "There are 8 parts of speech in English: noun, pronoun, verb, adjective, adverb, preposition, conjunction, and interjection."],
            [topicMap["Parts of Speech"], "Which part of speech describes an action?", "Noun", "Verb", "Adjective", "Adverb", 1, "A verb is a word that describes an action (run, eat, write) or a state of being (is, am, are)."],
            [topicMap["Parts of Speech"], "In the sentence 'She runs quickly', what part of speech is 'quickly'?", "Adjective", "Verb", "Adverb", "Noun", 2, "Quickly is an adverb because it describes how the action (runs) is performed."],
            
            // Nouns and Pronouns
            [topicMap["Nouns and Pronouns"], "Which of the following is a proper noun?", "city", "river", "Mumbai", "school", 2, "A proper noun names a specific person, place, or thing and begins with a capital letter. Mumbai is a specific city name."],
            [topicMap["Nouns and Pronouns"], "A pronoun is a word that:", "Describes a noun", "Replaces a noun", "Connects two sentences", "Shows action", 1, "A pronoun replaces a noun to avoid repetition. For example, 'he' replaces a boy's name."],
            [topicMap["Nouns and Pronouns"], "Which word is a pronoun in: 'They went to the park'?", "went", "the", "park", "They", 3, "They is a pronoun that replaces the names of the people who went to the park."],
            
            // Adjectives and Adverbs
            [topicMap["Adjectives and Adverbs"], "An adjective describes a:", "Verb", "Noun", "Preposition", "Conjunction", 1, "An adjective describes or modifies a noun, giving more information about it (big, red, happy)."],
            [topicMap["Adjectives and Adverbs"], "Which word is an adverb: 'The cat moved silently'?", "cat", "moved", "silently", "The", 2, "Silently is an adverb that tells us how the cat moved. Adverbs modify verbs, adjectives, or other adverbs."],
            [topicMap["Adjectives and Adverbs"], "Choose the correct adjective: 'This is the ___ building in the city.'", "taller", "tall", "tallest", "more tall", 2, "Tallest is the superlative form of tall, used when comparing three or more things."],
            
            // Verbs and Tenses
            [topicMap["Verbs and Tenses"], "A verb shows:", "The name of a person", "An action or state of being", "A description of a noun", "A connection between words", 1, "Verbs are words that express actions (run, write) or states of being (is, are, was)."],
            [topicMap["Verbs and Tenses"], "How many main tenses are there in English?", "2", "3", "4", "5", 1, "There are 3 main tenses in English: Past, Present, and Future. Each has four forms."],
            [topicMap["Verbs and Tenses"], "Which is an irregular verb?", "walked", "played", "went", "jumped", 2, "Went is the past tense of go. It is irregular because it does not follow the regular -ed pattern."],
            
            // Simple Present and Past Tense
            [topicMap["Simple Present and Past Tense"], "Which sentence is in simple present tense?", "She walked to school.", "She walks to school.", "She will walk to school.", "She was walking to school.", 1, "Simple present tense describes habitual actions or general truths. 'She walks to school' shows a regular habit."],
            [topicMap["Simple Present and Past Tense"], "The simple past of 'eat' is:", "eats", "eating", "ate", "eaten", 2, "Ate is the simple past form of the irregular verb eat."],
            [topicMap["Simple Present and Past Tense"], "Choose the correct simple past form: 'I ___ a letter yesterday.'", "write", "wrote", "written", "writing", 1, "Wrote is the simple past form of write. We use simple past for completed actions in the past."],
            
            // Present Perfect and Past Perfect
            [topicMap["Present Perfect and Past Perfect"], "Which sentence uses present perfect tense?", "I ate lunch.", "I have eaten lunch.", "I eat lunch.", "I will eat lunch.", 1, "Present perfect uses have/has + past participle. 'I have eaten lunch' shows an action completed at an unspecified time."],
            [topicMap["Present Perfect and Past Perfect"], "Past perfect tense uses:", "has + past participle", "had + past participle", "will + past participle", "is + past participle", 1, "Past perfect tense uses had + past participle to describe an action completed before another past action."],
            [topicMap["Present Perfect and Past Perfect"], "Choose the correct form: 'She ___ already ___ her homework before dinner.'", "has...finished", "had...finished", "will...finish", "is...finishing", 1, "Had finished is past perfect, used because the homework was completed before dinner (another past event)."],
            
            // Future Tense
            [topicMap["Future Tense"], "Which sentence is in simple future tense?", "I played cricket.", "I am playing cricket.", "I will play cricket.", "I play cricket.", 2, "Simple future tense uses will + base verb to describe actions that will happen in the future."],
            [topicMap["Future Tense"], "Another way to express future tense is:", "I am going to study.", "I studied.", "I have studied.", "I was studying.", 0, "Going to + base verb is another way to express future plans or intentions."],
            [topicMap["Future Tense"], "Fill in the blank: 'Tomorrow, we ___ visit the museum.'", "shall", "had", "have", "are", 0, "Shall/will is used with the base verb to form the simple future tense."],
            
            // Active and Passive Voice
            [topicMap["Active and Passive Voice"], "Which sentence is in passive voice?", "The dog chased the cat.", "The cat was chased by the dog.", "The dog runs fast.", "She is chasing the ball.", 1, "In passive voice the subject receives the action. 'The cat was chased by the dog' shows the cat (subject) receiving the action of being chased."],
            [topicMap["Active and Passive Voice"], "Convert to passive: 'She writes a letter.'", "A letter is written by she.", "A letter is written by her.", "A letter was written by her.", "A letter writes her.", 1, "In passive voice: object becomes subject + is/are + past participle + by + original subject (in object form)."],
            [topicMap["Active and Passive Voice"], "In active voice, the subject:", "Receives the action", "Performs the action", "Is absent", "Is always a pronoun", 1, "In active voice, the subject of the sentence performs the action expressed by the verb."],
            
            // Direct and Indirect Speech
            [topicMap["Direct and Indirect Speech"], "Direct speech uses:", "No quotation marks", "Quotation marks around exact words", "Only past tense", "Third person only", 1, "Direct speech uses quotation marks to show the exact words spoken by someone."],
            [topicMap["Direct and Indirect Speech"], "Convert to indirect: He said, 'I am happy.'", "He said that he is happy.", "He said that he was happy.", "He says that he is happy.", "He said I am happy.", 1, "In indirect speech, present tense changes to past tense, and first person changes to third person."],
            [topicMap["Direct and Indirect Speech"], "In indirect speech, 'this' usually changes to:", "that", "these", "those", "here", 0, "When converting direct to indirect speech, 'this' changes to 'that' as part of the pronoun and demonstrative changes."],
            
            // Sentence Types
            [topicMap["Sentence Types"], "A sentence that asks a question is called:", "Declarative", "Imperative", "Interrogative", "Exclamatory", 2, "An interrogative sentence asks a question and ends with a question mark."],
            [topicMap["Sentence Types"], "Which is an exclamatory sentence?", "Close the door.", "Is it raining?", "What a beautiful day!", "The sun is shining.", 2, "An exclamatory sentence expresses strong emotion and ends with an exclamation mark."],
            [topicMap["Sentence Types"], "An imperative sentence:", "Asks a question", "Makes a statement", "Gives a command or request", "Shows surprise", 2, "An imperative sentence gives a command, makes a request, or offers an invitation. Example: 'Please sit down.'"],
            
            // Subject and Predicate
            [topicMap["Subject and Predicate"], "In the sentence 'The tall boy plays football', what is the subject?", "plays football", "The tall boy", "football", "plays", 1, "The subject is who or what the sentence is about. 'The tall boy' is the complete subject."],
            [topicMap["Subject and Predicate"], "The predicate of a sentence:", "Names what the sentence is about", "Tells something about the subject", "Is always a noun", "Comes before the subject", 1, "The predicate tells what the subject does or is. It includes the verb and all words related to it."],
            [topicMap["Subject and Predicate"], "Find the predicate: 'My little sister sings beautifully.'", "My little sister", "sings beautifully", "little sister", "beautifully", 1, "Sings beautifully is the predicate because it tells what the subject (My little sister) does."],
            
            // Clauses and Phrases
            [topicMap["Clauses and Phrases"], "A clause is different from a phrase because a clause:", "Has no meaning", "Contains a subject and a verb", "Is always short", "Never has a verb", 1, "A clause contains both a subject and a verb, while a phrase does not have both."],
            [topicMap["Clauses and Phrases"], "Which is a phrase?", "She runs daily", "in the morning", "When it rains", "He is tall", 1, "In the morning is a phrase because it has no subject-verb combination. It functions as an adverb of time."],
            [topicMap["Clauses and Phrases"], "An independent clause:", "Cannot stand alone", "Can stand alone as a sentence", "Has no verb", "Must be joined to another clause", 1, "An independent clause has a subject and verb and expresses a complete thought. It can stand alone as a sentence."],
            
            // Conjunctions
            [topicMap["Conjunctions"], "A conjunction is a word that:", "Describes a noun", "Joins words, phrases, or clauses", "Shows action", "Takes the place of a noun", 1, "Conjunctions connect words, phrases, or clauses together. Examples include and, but, or, because."],
            [topicMap["Conjunctions"], "Which word is a conjunction: 'I like tea and coffee'?", "like", "tea", "and", "coffee", 2, "And is a coordinating conjunction that joins two words (tea and coffee) of equal grammatical importance."],
            [topicMap["Conjunctions"], "Choose the correct conjunction: 'She was tired ___ she kept working.'", "and", "but", "or", "so", 1, "But is used here because it shows contrast — she was tired yet continued working."],
            
            // Prepositions
            [topicMap["Prepositions"], "A preposition shows the relationship between:", "Two verbs", "A noun/pronoun and another word", "Two sentences", "An adjective and adverb", 1, "A preposition shows the relationship of a noun or pronoun to another word in the sentence."],
            [topicMap["Prepositions"], "Which word is a preposition: 'The book is on the table'?", "book", "is", "on", "table", 2, "On is a preposition showing the relationship between the book and the table (position/location)."],
            [topicMap["Prepositions"], "Choose the correct preposition: 'She arrived ___ Monday.'", "in", "at", "on", "by", 2, "We use 'on' with days of the week. 'She arrived on Monday.'"],
            
            // Comprehension Skills
            [topicMap["Comprehension Skills"], "The main idea of a passage is:", "The first sentence always", "What the passage is mostly about", "The last sentence always", "A random detail from the passage", 1, "The main idea is the central point or message that the passage is mostly about."],
            [topicMap["Comprehension Skills"], "When reading for comprehension, you should:", "Read as fast as possible", "Skip difficult words", "Read carefully and think about meaning", "Only read the first paragraph", 2, "Good comprehension requires careful reading, thinking about meaning, and connecting ideas in the text."],
            [topicMap["Comprehension Skills"], "A synonym is a word that:", "Means the opposite", "Sounds the same", "Has a similar meaning", "Is spelled the same", 2, "A synonym is a word that has the same or similar meaning as another word. Example: happy and glad."],
            
            // Vocabulary Building
            [topicMap["Vocabulary Building"], "An antonym is a word that means:", "The same", "The opposite", "A similar thing", "A related thing", 1, "An antonym is a word that means the opposite of another word. Example: hot and cold."],
            [topicMap["Vocabulary Building"], "The prefix 'un-' in 'unhappy' means:", "Very", "More", "Not", "Again", 2, "The prefix 'un-' means 'not' or 'opposite of'. Unhappy means not happy."],
            [topicMap["Vocabulary Building"], "Which word means 'to make something better'?", "Worsen", "Improve", "Destroy", "Ignore", 1, "Improve means to make something better or enhance its quality."],
            
            // Letter Writing
            [topicMap["Letter Writing"], "A formal letter should begin with:", "Hey there!", "Dear friend,", "The sender's address", "A joke", 2, "A formal letter begins with the sender's address at the top right, followed by the date and recipient's address."],
            [topicMap["Letter Writing"], "Which is the correct closing for a formal letter?", "Love,", "See ya!", "Yours faithfully,", "XOXO,", 2, "Yours faithfully is the appropriate formal closing when you do not know the recipient's name personally."],
            [topicMap["Letter Writing"], "The body of a letter should be:", "Very long and detailed", "Clear, concise, and to the point", "Written in all capital letters", "Without any greeting", 1, "The body of a letter should clearly communicate its purpose in a well-organized, concise manner."],
            
            // Essay Writing
            [topicMap["Essay Writing"], "An essay typically has:", "Only one paragraph", "An introduction, body, and conclusion", "No structure", "Only bullet points", 1, "A well-structured essay has three main parts: introduction, body paragraphs, and conclusion."],
            [topicMap["Essay Writing"], "The introduction of an essay should:", "Summarize the conclusion", "Present the main topic and thesis", "List all references", "Be the longest paragraph", 1, "The introduction presents the topic, provides background, and states the thesis or main argument."],
            [topicMap["Essay Writing"], "A thesis statement is:", "The first sentence of every paragraph", "The main argument or point of the essay", "A summary of the conclusion", "An optional part of writing", 1, "A thesis statement expresses the main argument or central idea that the essay will support."],
            
            // Paragraph Writing
            [topicMap["Paragraph Writing"], "A good paragraph should have:", "Random unrelated sentences", "A topic sentence and supporting details", "Only one sentence", "No main idea", 1, "A good paragraph starts with a topic sentence followed by supporting details that develop the main idea."],
            [topicMap["Paragraph Writing"], "The topic sentence of a paragraph:", "Comes at the end always", "States the main idea", "Is optional", "Should be very long", 1, "The topic sentence states the main idea of the paragraph and guides the reader about what to expect."],
            [topicMap["Paragraph Writing"], "Transition words in a paragraph help to:", "Make it shorter", "Connect ideas smoothly", "Confuse the reader", "End the paragraph", 1, "Transition words like 'however', 'furthermore', and 'therefore' connect ideas and improve the flow of writing."],
        ];
        
        const allQuestions = [...scienceQuestions, ...englishQuestions];
        
        let completed = 0;
        const total = allQuestions.length;
        
        for (const q of allQuestions) {
            if (!q[0]) {
                console.warn('Skipping question with undefined topic_id:', q[1]);
                completed++;
                continue;
            }
            stmt.run(q, (err) => {
                if (err) console.error('Error inserting question:', q[1]?.substring(0, 50), err.message);
                completed++;
                if (completed === total) {
                    stmt.finalize(() => {
                        console.log(`Seeded ${total} generated questions for Science and English.`);
                        console.log('Database seeding complete!');
                        db.close();
                    });
                }
            });
        }
    });
}
