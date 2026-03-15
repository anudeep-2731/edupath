import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Award, ShieldAlert, BookOpen, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Progress = () => {
    const { user } = useContext(AuthContext);
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                if (user?.id) {
                    const res = await api.get(`/students/${user.id}/progress`);
                    setProgress(res.data);
                }
            } catch (error) {
                console.error("Failed to load progress data");
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, [user?.id]);

    // Group by chapter for the chart
    const chapterData = progress.reduce((acc, curr) => {
        const chapter = curr.chapter;
        if (!acc[chapter]) {
            acc[chapter] = { name: chapter, totalScore: 0, count: 0 };
        }
        acc[chapter].totalScore += curr.best_score;
        acc[chapter].count += 1;
        return acc;
    }, {});

    const chartData = Object.values(chapterData).map(c => ({
        name: c.name,
        score: Math.round(c.totalScore / c.count)
    }));

    // Lists for mastery
    const mastered = progress.filter(p => p.best_score >= 80);
    const practicing = progress.filter(p => p.best_score >= 40 && p.best_score < 80);
    const needsWork = progress.filter(p => p.best_score < 40);

    const TopicCard = ({ topic, icon, color }) => (
        <div 
            onClick={() => navigate(`/student/quiz/${topic.topic_id}`)}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group"
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color.bg} ${color.text}`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{topic.name}</h4>
                    <p className="text-xs text-gray-500">{topic.subject} • {topic.chapter}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-bold text-gray-900">{topic.best_score}%</div>
                    <div className="text-xs text-gray-500">{topic.attempts} attempts</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">My Progress</h1>
                    <p className="text-gray-500">Track your mastery across all subjects and chapters.</p>
                </div>

                {chartData.length > 0 ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Chapter Performance</h2>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        angle={-25}
                                        textAnchor="end"
                                    />
                                    <YAxis 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 40 ? '#3b82f6' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">No data yet</h3>
                        <p className="text-gray-500">Complete some quizzes to see your progress charts.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Needs Work */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" /> Needs Work (<span className="text-red-500">&lt;40%</span>)
                        </h3>
                        {needsWork.length > 0 ? needsWork.map(p => (
                            <TopicCard key={p.topic_id} topic={p} icon={<ShieldAlert className="w-5 h-5" />} color={{bg:'bg-red-50', text:'text-red-500'}} />
                        )) : <p className="text-sm text-gray-500 italic">No topics need work. Great job!</p>}
                    </div>

                    {/* Practicing */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                            <BookOpen className="w-5 h-5 text-blue-500" /> Practicing (<span className="text-blue-500">40-79%</span>)
                        </h3>
                        {practicing.length > 0 ? practicing.map(p => (
                            <TopicCard key={p.topic_id} topic={p} icon={<BookOpen className="w-5 h-5" />} color={{bg:'bg-blue-50', text:'text-blue-500'}} />
                        )) : <p className="text-sm text-gray-500 italic">No topics in progress.</p>}
                    </div>

                    {/* Mastered */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2">
                            <Award className="w-5 h-5 text-green-500" /> Mastered (<span className="text-green-500">&ge;80%</span>)
                        </h3>
                        {mastered.length > 0 ? mastered.map(p => (
                            <TopicCard key={p.topic_id} topic={p} icon={<Award className="w-5 h-5" />} color={{bg:'bg-green-50', text:'text-green-500'}} />
                        )) : <p className="text-sm text-gray-500 italic">Keep practicing to master topics.</p>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Progress;
