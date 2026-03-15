import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import { Play, TrendingUp, Compass, Award, Star, Shield, Flame, Target, BookOpen, Beaker, PenTool, ArrowRight, AlertCircle, Unlock } from 'lucide-react';

const StudentHome = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ resume: null, focusAreas: [], streakDays: 0, continueFrom: null, readyToUnlock: [], masteryStats: null });
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                if (user?.id) {
                    const [recRes, progRes] = await Promise.all([
                        api.get(`/students/${user.id}/recommendations`),
                        api.get(`/students/${user.id}/progress`)
                    ]);
                    setStats(recRes.data);
                    setProgress(progRes.data);
                }
            } catch (error) {
                console.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [user?.id]);

    const handleContinueLearning = () => {
        if (stats.continueFrom) {
            navigate(`/student/quiz/${stats.continueFrom.topicId}`);
        } else if (stats.resume) {
            navigate(`/student/quiz/${stats.resume.id}`);
        } else {
            navigate('/student/graph');
        }
    };
    
    // Calculate progress per subject
    const mathsProgress = progress.filter(p => p.subject === 'Maths');
    const scienceProgress = progress.filter(p => p.subject === 'Science');
    const englishProgress = progress.filter(p => p.subject === 'English');
    
    const calculateCompletion = (items) => {
        if (items.length === 0) return 0;
        const totalScore = items.reduce((acc, curr) => acc + curr.best_score, 0);
        return Math.round(totalScore / items.length);
    };

    const mathsAvg = calculateCompletion(mathsProgress);
    const scienceAvg = calculateCompletion(scienceProgress);
    const englishAvg = calculateCompletion(englishProgress);
    const overallAvg = calculateCompletion(progress);

    // Get topic counts from mastery stats if available
    const mStats = stats.masteryStats?.bySubject || {};
    const getTotal = (subj) => {
        if (!mStats[subj]) return 0;
        return mStats[subj].mastered + mStats[subj].practicing + mStats[subj].struggling + mStats[subj].notStarted;
    };
    const getMastery = (subj) => {
        const t = getTotal(subj);
        if (t === 0) return 0;
        return Math.round((mStats[subj]?.mastered || 0) / t * 100);
    };

    // Get last activity date per subject
    const getLastActivity = (subjectProgress) => {
        if (subjectProgress.length === 0) return 'Not started';
        const dates = subjectProgress
            .filter(p => p.last_attempt_at || p.last_attempt_date)
            .map(p => new Date(p.last_attempt_at || p.last_attempt_date));
        if (dates.length === 0) return 'No activity';
        const latest = new Date(Math.max(...dates));
        const now = new Date();
        const diffDays = Math.floor((now - latest) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} days ago`;
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const subjectCards = [
        {
            name: 'Mathematics',
            color: '#3B82F6',
            bgLight: 'bg-blue-50',
            borderColor: 'border-blue-200',
            icon: <BookOpen className="w-6 h-6 text-blue-600" />,
            iconBg: 'bg-blue-100',
            avg: mathsAvg,
            mastery: getMastery('Maths'),
            total: getTotal('Maths'),
            progressData: mathsProgress,
            barColor: 'bg-blue-500',
        },
        {
            name: 'Science',
            color: '#10B981',
            bgLight: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            icon: <Beaker className="w-6 h-6 text-emerald-600" />,
            iconBg: 'bg-emerald-100',
            avg: scienceAvg,
            mastery: getMastery('Science'),
            total: getTotal('Science'),
            progressData: scienceProgress,
            barColor: 'bg-emerald-500',
        },
        {
            name: 'English',
            color: '#F59E0B',
            bgLight: 'bg-amber-50',
            borderColor: 'border-amber-200',
            icon: <PenTool className="w-6 h-6 text-amber-600" />,
            iconBg: 'bg-amber-100',
            avg: englishAvg,
            mastery: getMastery('English'),
            total: getTotal('English'),
            progressData: englishProgress,
            barColor: 'bg-amber-500',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Good morning, {user?.name.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                             Ready to learn today?
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-xl border border-orange-100 font-bold shadow-sm">
                            <Flame className="w-5 h-5 fill-current" />
                            {stats.streakDays} Day Streak!
                        </div>
                        <button 
                            onClick={handleContinueLearning}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-transform transform hover:scale-105 shadow-md"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            Continue
                        </button>
                    </div>
                </div>

                {/* Subject Cards Row */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Your Subjects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {subjectCards.map((card) => (
                            <div 
                                key={card.name}
                                className={`bg-white rounded-2xl p-6 shadow-sm border ${card.borderColor} hover:shadow-md transition-shadow cursor-pointer`}
                                onClick={() => navigate('/student/progress')}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                                        {card.icon}
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">{card.mastery || card.avg}%</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{card.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">{card.total || card.progressData.length} topics • Last: {getLastActivity(card.progressData)}</p>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className={`${card.barColor} h-2.5 rounded-full transition-all duration-500`} 
                                        style={{ width: `${card.mastery || card.avg}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Your Learning Path Today */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-blue-500" />
                                Your learning path today
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Continue Card */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-300 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                                        <Play className="w-5 h-5 text-blue-600 fill-current" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-1">Continue</h3>
                                    {stats.continueFrom ? (
                                        <>
                                            <p className="text-gray-600 text-sm font-medium mb-1">{stats.continueFrom.topicName}</p>
                                            <p className="text-gray-400 text-xs mb-3">Last score: {stats.continueFrom.lastScore}%</p>
                                        </>
                                    ) : stats.resume ? (
                                        <>
                                            <p className="text-gray-600 text-sm font-medium mb-1">{stats.resume.name}</p>
                                            <p className="text-gray-400 text-xs mb-3">{stats.resume.subject}</p>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-xs mb-3">Start your first topic!</p>
                                    )}
                                    <button 
                                        onClick={handleContinueLearning}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                        Resume <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Fix Weak Area Card */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-orange-300 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-1">Fix weak area</h3>
                                    {stats.focusAreas && stats.focusAreas.length > 0 ? (
                                        <>
                                            <p className="text-gray-600 text-sm font-medium mb-1">{stats.focusAreas[0].name}</p>
                                            <p className="text-gray-400 text-xs mb-3">{stats.focusAreas[0].attempts || 0} attempts • {stats.focusAreas[0].best_score}%</p>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-xs mb-3">No weak areas! Great job!</p>
                                    )}
                                    <button 
                                        onClick={() => {
                                            if (stats.focusAreas?.length > 0) {
                                                navigate(`/student/quiz/${stats.focusAreas[0].id}`);
                                            }
                                        }}
                                        disabled={!stats.focusAreas?.length}
                                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                        Practice <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Unlock Next Card */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-green-300 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                                        <Unlock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-1">Unlock next</h3>
                                    {stats.readyToUnlock && stats.readyToUnlock.length > 0 ? (
                                        <>
                                            <p className="text-gray-600 text-sm font-medium mb-1">{stats.readyToUnlock[0].topicName}</p>
                                            <p className="text-gray-400 text-xs mb-3">{stats.readyToUnlock[0].subject}</p>
                                        </>
                                    ) : (
                                        <p className="text-gray-400 text-xs mb-3">Complete prerequisites to unlock</p>
                                    )}
                                    <button 
                                        onClick={() => {
                                            if (stats.readyToUnlock?.length > 0) {
                                                navigate(`/student/quiz/${stats.readyToUnlock[0].topicId}`);
                                            } else {
                                                navigate('/student/graph');
                                            }
                                        }}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                        {stats.readyToUnlock?.length > 0 ? 'Start' : 'Explore'} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Resume Card */}
                        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10 filter blur-3xl">
                                <div className="w-64 h-64 bg-white rounded-full"></div>
                            </div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-100 mb-2 flex items-center gap-2">
                                <Compass className="w-4 h-4" /> Pick up where you left off
                            </h2>
                            {stats.resume ? (
                                <>
                                    <h3 className="text-2xl font-bold mb-1">{stats.resume.name}</h3>
                                    <p className="text-indigo-100 mb-6">{stats.resume.subject} • Class 8</p>
                                    <button 
                                        onClick={handleContinueLearning}
                                        className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm inline-flex items-center gap-2"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        Resume Quiz
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold mb-1">Explore the Syllabus</h3>
                                    <p className="text-indigo-100 mb-6">You haven't started any topics yet. Let's begin!</p>
                                    <button 
                                        onClick={() => navigate('/student/graph')}
                                        className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm inline-flex items-center gap-2"
                                    >
                                        View Knowledge Graph
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* Overall Ring */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center py-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Overall Mastery</h2>
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" className="stroke-current text-gray-100" strokeWidth="12" fill="none" />
                                    <circle cx="80" cy="80" r="70" className="stroke-current text-blue-500" strokeWidth="12" fill="none" strokeDasharray={`${2 * Math.PI * 70}`} strokeDashoffset={`${2 * Math.PI * 70 * (1 - overallAvg/100)}`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                                    <span className="text-4xl font-extrabold text-gray-900">{overallAvg}%</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/student/graph')}
                                className="mt-6 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                            >
                                View full syllabus map &rarr;
                            </button>
                        </div>

                        {/* Focus Areas */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-red-500" /> Focus Areas
                            </h2>
                            {stats.focusAreas && stats.focusAreas.length > 0 ? (
                                <ul className="space-y-4">
                                    {stats.focusAreas.map(area => (
                                        <li key={area.id} className="p-3 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center group cursor-pointer hover:bg-red-100 transition-colors" onClick={() => navigate(`/student/quiz/${area.id}`)}>
                                            <div>
                                                <div className="font-semibold text-red-900 text-sm group-hover:underline">{area.name}</div>
                                                <div className="text-xs text-red-700">{area.subject} • Best Score: {area.best_score}%</div>
                                            </div>
                                            <Play className="w-4 h-4 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <Shield className="w-12 h-12 mx-auto text-green-300 mb-2" />
                                    <p className="text-sm">No weak areas identified. Good job!</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Achievements / Badges Preview */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                             <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500" /> Recent Badges
                            </h2>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center opacity-100">
                                     <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-xl shadow-sm border border-yellow-200">
                                        🚀
                                     </div>
                                     <span className="text-[10px] font-bold text-gray-600 mt-2 text-center">First<br/>Quiz</span>
                                </div>
                                <div className="flex flex-col items-center opacity-100">
                                     <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl shadow-sm border border-orange-200">
                                        🔥
                                     </div>
                                     <span className="text-[10px] font-bold text-gray-600 mt-2 text-center">3 Day<br/>Streak</span>
                                </div>
                                <div className="flex flex-col items-center opacity-40 grayscale">
                                     <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl shadow-sm">
                                        ➗
                                     </div>
                                     <span className="text-[10px] font-bold text-gray-600 mt-2 text-center">Maths<br/>Master</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentHome;
