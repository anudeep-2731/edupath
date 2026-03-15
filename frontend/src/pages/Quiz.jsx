import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import { Check, X, HelpCircle, ArrowRight, Zap, RefreshCw, Lock, ChevronRight } from 'lucide-react';

const Quiz = () => {
    const { topicId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [topicInfo, setTopicInfo] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [hint, setHint] = useState(null);
    const [hintLoading, setHintLoading] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    
    const [pointsEarned, setPointsEarned] = useState(0);
    const [pointsAnimation, setPointsAnimation] = useState(false);

    // Prerequisite gate states
    const [blocked, setBlocked] = useState(false);
    const [blockMessage, setBlockMessage] = useState('');
    const [suggestedTopic, setSuggestedTopic] = useState(null);

    // Adaptive result states
    const [adaptiveResult, setAdaptiveResult] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [scoreAnimated, setScoreAnimated] = useState(0);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                // Try new start endpoint first
                const res = await api.get(`/quiz/start/${topicId}/${user?.id || 3}`);
                
                if (res.data && res.data.ready === false) {
                    // Prerequisite blocked
                    setBlocked(true);
                    setBlockMessage(res.data.message);
                    setSuggestedTopic(res.data.suggestedTopic);
                    setLoading(false);
                    return;
                }
                
                if (res.data && res.data.questions && res.data.questions.length > 0) {
                    setQuestions(res.data.questions);
                    setTopicInfo(res.data.topic);
                } else if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    // Legacy format
                    setQuestions(res.data);
                } else {
                    // Fallback to legacy endpoint
                    const legacyRes = await api.get(`/quiz/${topicId}`);
                    if (legacyRes.data && legacyRes.data.length > 0) {
                        setQuestions(legacyRes.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch questions:", error);
                // Fallback to legacy endpoint
                try {
                    const legacyRes = await api.get(`/quiz/${topicId}`);
                    if (legacyRes.data && legacyRes.data.length > 0) {
                        setQuestions(legacyRes.data);
                    }
                } catch (e) {
                    console.error("Legacy fetch also failed:", e);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [topicId, user?.id]);

    const handleAnswer = (optionIndex) => {
        if (isAnswered) return;
        
        setSelectedOption(optionIndex);
        setIsAnswered(true);
        setHint(null);
        
        const currentQ = questions[currentIndex];
        
        if (optionIndex === currentQ.correct_index) {
            setScore(prev => prev + 1);
            setPointsEarned(prev => prev + 10);
            
            setPointsAnimation(true);
            setTimeout(() => setPointsAnimation(false), 1000);
            
            setTimeout(handleNext, 1500);
        }
    };

    const requestHint = async () => {
        if (hintLoading || hint) return;
        setHintLoading(true);
        try {
            const currentQ = questions[currentIndex];
            const correctAnswer = currentQ.options[currentQ.correct_index];
            const res = await api.post('/quiz/hint', { 
                questionText: currentQ.question_text,
                correctAnswer: correctAnswer,
                topicName: topicInfo?.name || ''
            });
            setHint(res.data.hint);
        } catch (error) {
            console.error("Hint failed:", error);
            setHint("Read the question carefully and try to eliminate the wrong options.");
        } finally {
            setHintLoading(false);
        }
    };

    const finishQuiz = async () => {
        setQuizFinished(true);
        const percentage = Math.round((score / questions.length) * 100);
        
        // Animate score ring
        let animVal = 0;
        const interval = setInterval(() => {
            animVal += 2;
            if (animVal >= percentage) {
                animVal = percentage;
                clearInterval(interval);
            }
            setScoreAnimated(animVal);
        }, 20);

        try {
            const res = await api.post('/quiz/complete', {
                studentId: user.id,
                topicId: parseInt(topicId),
                score: percentage,
                totalQuestions: questions.length,
                correctAnswers: score
            });
            
            setAdaptiveResult(res.data);
            
            // Show confetti for unlocked topics
            if (res.data.nextTopic?.type === 'next_topic') {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
            }
        } catch (e) {
            console.error("Failed to save result:", e);
            // Fallback — save via legacy
            try {
                await api.post('/quiz/result', {
                    studentId: user.id,
                    topicId: parseInt(topicId),
                    score: score,
                    maxScore: questions.length
                });
            } catch (e2) {
                console.error("Legacy save also failed");
            }
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsAnswered(false);
            setSelectedOption(null);
            setHint(null);
        } else {
            finishQuiz();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-white text-lg font-medium animate-pulse">Generating your adaptive quiz...</p>
            </div>
        );
    }

    // Prerequisite blocked screen
    if (blocked) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Topic Locked</h2>
                    <p className="text-gray-500 mb-6">{blockMessage}</p>
                    
                    {suggestedTopic && (
                        <button 
                            onClick={() => navigate(`/student/quiz/${suggestedTopic.id}`)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors mb-3 flex items-center justify-center gap-2"
                        >
                            Go to {suggestedTopic.name}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                    
                    <button 
                        onClick={() => navigate('/student/home')}
                        className="w-full bg-slate-100 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                    <p className="text-gray-500 mb-6">We couldn't generate questions for this topic right now.</p>
                    <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (quizFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        const nextTopic = adaptiveResult?.nextTopic;
        
        // Mastery badge config
        let badgeColor, badgeText, badgeBg;
        if (percentage >= 80) {
            badgeColor = 'text-green-700'; badgeBg = 'bg-green-100 border-green-300'; badgeText = 'Mastered ✓';
        } else if (percentage >= 60) {
            badgeColor = 'text-yellow-700'; badgeBg = 'bg-yellow-100 border-yellow-300'; badgeText = 'Keep Practicing';
        } else if (percentage >= 40) {
            badgeColor = 'text-orange-700'; badgeBg = 'bg-orange-100 border-orange-300'; badgeText = 'Almost There';
        } else {
            badgeColor = 'text-red-700'; badgeBg = 'bg-red-100 border-red-300'; badgeText = 'Needs More Practice';
        }

        // Next step card config
        let cardBorder, cardTitle, cardSubtitle, cardBtnText, cardBtnAction;
        if (nextTopic) {
            switch (nextTopic.type) {
                case 'prerequisite_gap':
                    cardBorder = 'border-orange-400'; cardTitle = 'Build your foundation first';
                    cardSubtitle = nextTopic.name; cardBtnText = `Go to ${nextTopic.name}`;
                    cardBtnAction = () => navigate(`/student/quiz/${nextTopic.id}`);
                    break;
                case 'continue_current':
                    cardBorder = 'border-yellow-400'; cardTitle = 'Almost mastered!';
                    cardSubtitle = 'A little more practice will get you there.'; cardBtnText = 'Try Again';
                    cardBtnAction = () => window.location.reload();
                    break;
                case 'next_topic':
                    cardBorder = 'border-green-400'; cardTitle = `You unlocked ${nextTopic.name}!`;
                    cardSubtitle = 'Great job mastering this topic!'; cardBtnText = `Start ${nextTopic.name}`;
                    cardBtnAction = () => navigate(`/student/quiz/${nextTopic.id}`);
                    break;
                case 'review_weak':
                    cardBorder = 'border-red-400'; cardTitle = "Let's fix this gap";
                    cardSubtitle = nextTopic.name; cardBtnText = `Go to ${nextTopic.name}`;
                    cardBtnAction = () => navigate(`/student/quiz/${nextTopic.id}`);
                    break;
                default:
                    cardBorder = 'border-blue-400'; cardTitle = 'Continue Learning';
                    cardSubtitle = ''; cardBtnText = 'Back to Home';
                    cardBtnAction = () => navigate('/student/home');
            }
        }

        return (
            <div className="min-h-screen bg-slate-900 py-8 px-4 flex items-center justify-center relative overflow-hidden">
                {/* Confetti animation */}
                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                        {[...Array(50)].map((_, i) => (
                            <div
                                key={i}
                                className="confetti-piece"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][Math.floor(Math.random() * 6)]
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative z-10">
                    {/* Score Ring */}
                    <div className="relative w-36 h-36 mx-auto mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="72" cy="72" r="62" className="stroke-current text-gray-100" strokeWidth="10" fill="none" />
                            <circle 
                                cx="72" cy="72" r="62" 
                                className={`stroke-current ${percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : percentage >= 40 ? 'text-orange-500' : 'text-red-500'}`}
                                strokeWidth="10" fill="none" 
                                strokeDasharray={`${2 * Math.PI * 62}`} 
                                strokeDashoffset={`${2 * Math.PI * 62 * (1 - scoreAnimated / 100)}`} 
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                            />
                        </svg>
                        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                            <span className="text-4xl font-extrabold text-gray-900">{scoreAnimated}%</span>
                            <span className="text-xs text-gray-500 font-medium">{score}/{questions.length}</span>
                        </div>
                    </div>
                    
                    {/* Mastery Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${badgeBg} border ${badgeColor} font-bold text-sm mb-6`}>
                        {badgeText}
                    </div>
                    
                    {/* Points */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-xl">
                            <span className="text-2xl font-bold text-blue-600">+{pointsEarned}</span>
                            <span className="text-sm text-gray-500 font-medium ml-2 uppercase tracking-wide">Points</span>
                        </div>
                    </div>

                    {/* Adaptive Next Step Card */}
                    {nextTopic && (
                        <div className={`border-2 ${cardBorder} rounded-2xl p-5 mb-4 text-left`}>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{cardTitle}</h3>
                            {cardSubtitle && <p className="text-gray-500 text-sm mb-4">{cardSubtitle}</p>}
                            <button 
                                onClick={cardBtnAction}
                                className={`w-full font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-white
                                    ${nextTopic.type === 'next_topic' ? 'bg-green-500 hover:bg-green-600' : 
                                      nextTopic.type === 'prerequisite_gap' ? 'bg-orange-500 hover:bg-orange-600' :
                                      nextTopic.type === 'continue_current' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                      'bg-red-500 hover:bg-red-600'}`}
                            >
                                {cardBtnText}
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Encouragement Message */}
                    {adaptiveResult?.encouragementMessage && (
                        <p className="text-gray-400 italic text-sm mb-6">{adaptiveResult.encouragementMessage}</p>
                    )}

                    {/* Back to Home */}
                    <button 
                        onClick={() => navigate('/student/home')}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                        ← Back to Home
                    </button>
                </div>

                <style jsx="true">{`
                    .confetti-piece {
                        position: absolute;
                        width: 10px;
                        height: 10px;
                        top: -10px;
                        border-radius: 2px;
                        animation: confetti-fall 3s ease-out forwards;
                    }
                    @keyframes confetti-fall {
                        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                    }
                `}</style>
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-900 flex flex-col relative text-white">
            
            {/* Top Bar */}
            <div className="p-4 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur z-10 w-full">
                <button onClick={() => navigate('/student/home')} className="text-slate-400 hover:text-white flex items-center gap-2 font-medium">
                    <X className="w-5 h-5" /> Quit
                </button>
                
                <div className="flex-1 max-w-md mx-8 hidden sm:block">
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                    <div className="text-center text-xs text-slate-400 mt-1 font-medium tracking-wider uppercase">
                        Question {currentIndex + 1} of {questions.length}
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full font-bold text-yellow-500 border border-slate-700 relative">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{pointsEarned} pt</span>
                    {pointsAnimation && (
                        <span className="absolute -top-6 right-2 text-green-400 font-bold animate-bounce">+10</span>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 w-full max-w-4xl mx-auto z-10">
                
                {/* Mobile Progress */}
                <div className="w-full sm:hidden mb-8 text-center">
                    <div className="text-sm text-slate-400 mb-2 font-medium tracking-wider uppercase">
                        Question {currentIndex + 1} of {questions.length}
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question */}
                <div className="w-full text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                        {currentQ.question_text}
                    </h2>
                </div>

                {/* Options */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((opt, i) => {
                        let btnStyle = "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-white";
                        let icon = null;
                        
                        if (isAnswered) {
                            if (i === currentQ.correct_index) {
                                btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                                icon = <Check className="w-5 h-5 ml-auto text-emerald-500" />;
                            } else if (i === selectedOption) {
                                btnStyle = "bg-red-500/10 border-red-500 text-red-400 opacity-80";
                                icon = <X className="w-5 h-5 ml-auto text-red-500" />;
                            } else {
                                btnStyle = "bg-slate-900 border-slate-800 text-slate-500 opacity-50";
                            }
                        }

                        return (
                            <button
                                key={i}
                                disabled={isAnswered}
                                onClick={() => handleAnswer(i)}
                                className={`text-left p-5 sm:p-6 rounded-2xl border-2 text-lg sm:text-xl transition-all duration-200 flex items-center ${btnStyle} disabled:cursor-default`}
                            >
                                <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full mr-4 text-sm font-bold border ${isAnswered ? 'border-current' : 'border-slate-600 bg-slate-900'}`}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {icon}
                            </button>
                        );
                    })}
                </div>

                {/* After Answer Actions */}
                {isAnswered && (
                    <div className="w-full mt-8 animate-fade-in-up">
                        
                        {/* Explanation block */}
                        <div className={`p-4 sm:p-6 rounded-2xl border ${selectedOption === currentQ.correct_index ? 'bg-emerald-900/30 border-emerald-800/50' : 'bg-red-900/30 border-red-800/50'} mb-6`}>
                            <h3 className={`font-bold mb-2 flex items-center gap-2 ${selectedOption === currentQ.correct_index ? 'text-emerald-400' : 'text-red-400'}`}>
                                {selectedOption === currentQ.correct_index ? 'Excellent!' : 'Not quite.'}
                            </h3>
                            <p className="text-slate-300">
                                {currentQ.explanation}
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            
                            {/* AI Hint Button (only if wrong) */}
                            {selectedOption !== currentQ.correct_index ? (
                                <div className="w-full sm:w-auto">
                                    {!hint ? (
                                        <button 
                                            onClick={requestHint}
                                            disabled={hintLoading}
                                            className="w-full sm:w-auto bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/50 px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {hintLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <HelpCircle className="w-5 h-5" />}
                                            {hintLoading ? 'AI Thinking...' : 'Ask AI for a Hint'}
                                        </button>
                                    ) : (
                                        <div className="bg-indigo-900/40 border border-indigo-500/30 p-4 rounded-xl text-indigo-200">
                                            <div className="font-bold text-indigo-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Zap className="w-3 h-3 fill-current" /> AI HINT</div>
                                            {hint}
                                        </div>
                                    )}
                                </div>
                            ) : <div></div>}

                            <button
                                onClick={handleNext}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800 hover:border-blue-600 active:border-b-0 active:mt-4 px-10 py-3 rounded-xl font-extrabold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <style jsx="true">{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Quiz;
