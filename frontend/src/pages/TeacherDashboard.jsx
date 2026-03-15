import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, TrendingUp, BookCheck, AlertTriangle, LayoutDashboard, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [heatmapData, setHeatmapData] = useState({ students: [], topics: [], scores: [] });
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [boardFilter, setBoardFilter] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [metricsRes, heatmapRes] = await Promise.all([
                    api.get('/teacher/metrics'),
                    api.get('/teacher/heatmap')
                ]);
                setMetrics(metricsRes.data);
                setHeatmapData(heatmapRes.data);
            } catch (error) {
                console.error("Failed to load teacher dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const getScoreForCell = (studentId, topicId) => {
        return heatmapData.scores.find(s => s.student_id === studentId && s.topic_id === topicId);
    };

    const getCellColor = (scoreRecord) => {
        if (!scoreRecord) return 'bg-gray-100 border-gray-200'; // Not attempted
        if (scoreRecord.best_score >= 80) return 'bg-green-500 border-green-600 text-white'; // Mastered
        if (scoreRecord.best_score >= 40) return 'bg-yellow-400 border-yellow-500 text-yellow-900'; // Practicing
        return 'bg-red-500 border-red-600 text-white'; // Weak
    };

    const filteredTopics = heatmapData.topics.filter(t => boardFilter === 'ALL' || t.board === boardFilter);

    if (loading) {
         return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8 relative">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="text-blue-600" /> Class Overview
                        </h1>
                        <p className="text-gray-500 mt-1">Class 8 Mathematics & Science</p>
                    </div>
                    <button 
                        onClick={() => navigate('/teacher/graph')}
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Share2 className="w-4 h-4" /> Class Knowledge Graph
                    </button>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.totalStudents}</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Average Class Score</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.averageScore}%</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                            <BookCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Topics Completed (Week)</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.topicsCompletedThisWeek}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-600">Needs Attention (<span className="text-xs">&ge;3 weak</span>)</p>
                            <p className="text-2xl font-bold text-red-700">{metrics.studentsNeedingAttention}</p>
                        </div>
                    </div>
                </div>

                {/* Heatmap Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Performance Heatmap</h2>
                            <p className="text-sm text-gray-500">Click a cell to view specific student-topic details.</p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                             <button onClick={() => setBoardFilter('ALL')} className={`px-3 py-1 text-sm font-medium rounded-md ${boardFilter === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>All</button>
                             <button onClick={() => setBoardFilter('CBSE')} className={`px-3 py-1 text-sm font-medium rounded-md ${boardFilter === 'CBSE' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>CBSE</button>
                             <button onClick={() => setBoardFilter('SSC')} className={`px-3 py-1 text-sm font-medium rounded-md ${boardFilter === 'SSC' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>SSC</button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 bg-slate-50 border-b border-gray-200 font-semibold text-gray-700 sticky left-0 z-10 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Student</th>
                                    {filteredTopics.map(t => (
                                        <th key={t.id} className="p-3 bg-slate-50 border-b border-gray-200 text-xs font-medium text-gray-500 whitespace-nowrap" title={`${t.subject} - ${t.board}`}>
                                            <div className="w-24 overflow-hidden text-ellipsis">{t.name}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {heatmapData.students.map((student, i) => (
                                    <tr key={student.id} className="hover:bg-slate-50 border-b border-gray-100">
                                        <td className="p-4 font-medium text-gray-900 sticky left-0 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            {student.name}
                                        </td>
                                        {filteredTopics.map(topic => {
                                            const record = getScoreForCell(student.id, topic.id);
                                            return (
                                                <td key={topic.id} className="p-1 min-w-[100px]">
                                                    <div 
                                                        onClick={() => setSelectedStudent({ student, topic, record })}
                                                        className={`w-full h-10 rounded border ${getCellColor(record)} flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity`}
                                                    >
                                                        {record ? `${record.best_score}%` : '-'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500"></div> Mastered (80%+)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-yellow-400"></div> Practicing (40-79%)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500"></div> Weak (&lt;40%)</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div> Not Attempted</div>
                    </div>
                </div>

            </div>

            {/* Student Detail Panel Overlay */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-md bg-white h-full shadow-2xl animate-fade-in-right flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedStudent.student.name}</h2>
                                <p className="text-sm text-gray-500">Activity Detail</p>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm">
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            <div>
                                <h3 className="font-bold text-gray-900 mb-1">{selectedStudent.topic.name}</h3>
                                <div className="text-sm text-gray-500 mb-4">{selectedStudent.topic.board} • {selectedStudent.topic.subject} • {selectedStudent.topic.chapter}</div>
                                
                                {selectedStudent.record ? (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Best Score</p>
                                                <p className="text-2xl font-bold text-gray-900">{selectedStudent.record.best_score}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Attempts</p>
                                                <p className="text-2xl font-bold text-gray-900">{selectedStudent.record.attempts}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Status</p>
                                            {selectedStudent.record.is_weak_area ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-100 text-red-700 text-sm font-medium">
                                                    <AlertTriangle className="w-4 h-4" /> Weak Area
                                                </span>
                                            ) : selectedStudent.record.best_score >= 80 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm font-medium">
                                                    <TrendingUp className="w-4 h-4" /> Mastered
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-yellow-100 text-yellow-800 text-sm font-medium">
                                                    <BookCheck className="w-4 h-4" /> Practicing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center text-gray-500">
                                        Student hasn't attempted this topic yet.
                                    </div>
                                )}
                            </div>

                            {selectedStudent.record?.is_weak_area ? (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2">
                                        💡 Recommended Intervention
                                    </h4>
                                    <p className="text-sm text-blue-800 mb-4">
                                        Suggest reviewing prerequisites for {selectedStudent.topic.name}. Student has attempted {selectedStudent.record.attempts} times with little improvement.
                                    </p>
                                    <button 
                                        className="w-full bg-white text-blue-600 border border-blue-200 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50 transition-colors"
                                        onClick={() => {
                                            alert(`Sent encouragement via EduPath internal message to ${selectedStudent.student.name}!`);
                                            setSelectedStudent(null);
                                        }}
                                    >
                                        Send Encouragement Message
                                    </button>
                                </div>
                            ) : null}

                        </div>
                    </div>
                </div>
            )}
            
            <style jsx="true">{`
                @keyframes fade-in-right {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default TeacherDashboard;
