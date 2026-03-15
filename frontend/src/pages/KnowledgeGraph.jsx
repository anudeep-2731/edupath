import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ReactFlow, { 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../utils/api';
import { Book, Play, X } from 'lucide-react';

const TopicNode = ({ data }) => {
    // Subject color mapping
    const subjectStyles = {
        'Maths': { bg: '#EFF6FF', border: '#3B82F6', text: '#1E3A5F' },
        'Science': { bg: '#ECFDF5', border: '#10B981', text: '#064E3B' },
        'English': { bg: '#FFFBEB', border: '#F59E0B', text: '#78350F' },
    };
    
    const style = subjectStyles[data.subject] || { bg: '#F1F5F9', border: '#94A3B8', text: '#334155' };
    
    // Mastery border style
    let borderStyle = '2px solid';
    let opacity = 1;
    let borderColor = style.border;
    let extraBorder = '';
    
    switch (data.masteryLevel) {
        case 'mastered':
            borderStyle = '3px solid';
            borderColor = '#22C55E'; // green
            extraBorder = '0 0 0 2px rgba(34, 197, 94, 0.3)';
            break;
        case 'practicing':
            borderStyle = '3px dashed';
            borderColor = '#3B82F6'; // blue
            break;
        case 'struggling':
            borderStyle = '3px dotted';
            borderColor = '#EF4444'; // red
            break;
        case 'not_started':
        default:
            borderStyle = '2px solid';
            borderColor = style.border;
            opacity = 0.4;
            break;
    }

    // Difficulty size mapping
    const sizeMap = {
        1: { padding: '8px 12px', fontSize: '11px' },
        2: { padding: '10px 14px', fontSize: '12px' },
        3: { padding: '12px 16px', fontSize: '13px', fontWeight: '500' },
        4: { padding: '14px 18px', fontSize: '14px', fontWeight: '600' },
        5: { padding: '16px 20px', fontSize: '14px', fontWeight: '700' }
    };
    
    const size = sizeMap[data.difficulty_level] || sizeMap[3];

    return (
        <div 
            style={{
                backgroundColor: style.bg,
                border: `${borderStyle} ${borderColor}`,
                color: style.text,
                opacity,
                boxShadow: extraBorder ? `${extraBorder}, 0 1px 3px rgba(0,0,0,0.1)` : '0 1px 3px rgba(0,0,0,0.1)',
                borderRadius: '10px',
                minWidth: '130px',
                textAlign: 'center',
                transition: 'all 0.2s',
                ...size
            }}
        >
            <div style={{ fontWeight: size.fontWeight || '400' }}>{data.name}</div>
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.75 }}>{data.chapter}</div>
            {data.masteryLevel && data.masteryLevel !== 'not_started' && (
                <div style={{ 
                    fontSize: '9px', 
                    marginTop: '4px', 
                    padding: '1px 6px', 
                    borderRadius: '9999px',
                    display: 'inline-block',
                    backgroundColor: data.masteryLevel === 'mastered' ? '#DCFCE7' : 
                                     data.masteryLevel === 'practicing' ? '#DBEAFE' : '#FEE2E2',
                    color: data.masteryLevel === 'mastered' ? '#166534' : 
                           data.masteryLevel === 'practicing' ? '#1E40AF' : '#991B1B',
                    fontWeight: '600'
                }}>
                    {data.masteryLevel}
                </div>
            )}
        </div>
    );
};

const nodeTypes = {
  custom: TopicNode,
};

// Auto-layout function
const layoutGraph = (topics) => {
    const nodes = [];
    const edges = [];
    
    const chapters = [...new Set(topics.map(t => t.chapter))];
    
    let currentX = 50;
    
    chapters.forEach((chapter) => {
        const chapterTopics = topics.filter(t => t.chapter === chapter);
        
        let currentY = 100;
        
        chapterTopics.forEach((topic, i) => {
            nodes.push({
                id: topic.id.toString(),
                type: 'custom',
                position: { x: currentX + (i % 2 === 0 ? 0 : 50), y: currentY },
                data: { ...topic }
            });
            
            if (topic.prerequisite_topic_ids && topic.prerequisite_topic_ids.length > 0) {
                topic.prerequisite_topic_ids.forEach(prereqId => {
                    edges.push({
                        id: `e${prereqId}-${topic.id}`,
                        source: prereqId.toString(),
                        target: topic.id.toString(),
                        animated: true,
                        markerEnd: { type: MarkerType.ArrowClosed },
                        style: { stroke: '#9ca3af', strokeWidth: 2 }
                    });
                });
            }
            
            currentY += 120 + (topic.difficulty_level * 10);
        });
        
        currentX += 300;
    });
    
    return { nodes, edges };
};

const KnowledgeGraph = ({ isTeacherView = false }) => {
    const { user } = useContext(AuthContext);
    const [board, setBoard] = useState('CBSE');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentScores, setStudentScores] = useState({});
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    
    const [selectedTopic, setSelectedTopic] = useState(null);
    const navigate = useNavigate();

    const fetchGraph = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/syllabus?board=${board}`);
            let allTopics = res.data;
            
            // Fetch student scores for mastery visualization
            if (user?.id && !isTeacherView) {
                try {
                    const scoresRes = await api.get(`/students/${user.id}/progress`);
                    const scoreMap = {};
                    for (const s of scoresRes.data) {
                        scoreMap[s.topic_id] = {
                            masteryLevel: s.mastery_level || (s.best_score >= 80 ? 'mastered' : s.best_score >= 40 ? 'practicing' : 'struggling'),
                            bestScore: s.best_score,
                            attempts: s.attempts
                        };
                    }
                    setStudentScores(scoreMap);
                    
                    // Enrich topics with mastery data
                    allTopics = allTopics.map(t => ({
                        ...t,
                        masteryLevel: scoreMap[t.id]?.masteryLevel || 'not_started',
                        bestScore: scoreMap[t.id]?.bestScore || 0,
                        attempts: scoreMap[t.id]?.attempts || 0
                    }));
                } catch (e) {
                    console.error('Failed to fetch student scores:', e);
                }
            }
            
            setTopics(allTopics);
            
            // Apply subject filter
            let filteredTopics = allTopics;
            if (subjectFilter !== 'All') {
                filteredTopics = allTopics.filter(t => t.subject === subjectFilter);
            }
            
            const { nodes: newNodes, edges: newEdges } = layoutGraph(filteredTopics);
            setNodes(newNodes);
            setEdges(newEdges);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraph();
        setSelectedTopic(null);
    // eslint-disable-next-line
    }, [board, subjectFilter]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedTopic(node.data);
    }, []);

    const handleBack = () => {
        navigate(isTeacherView ? '/teacher/dashboard' : '/student/home');
    };

    const handlePractice = () => {
        if (!isTeacherView && selectedTopic) {
            navigate(`/student/quiz/${selectedTopic.id}`);
        }
    };

    // Determine available subjects based on board
    const availableSubjects = ['All', ...new Set(topics.map(t => t.subject))];

    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-slate-50 relative">
            <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="text-gray-500 hover:text-gray-900 transition-colors">
                        &larr; Back to Dashboard
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Book className="w-5 h-5 text-blue-500" />
                        Syllabus Knowledge Graph
                    </h1>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                    {/* Board filter */}
                    <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                        <button 
                            onClick={() => setBoard('CBSE')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${board === 'CBSE' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            CBSE
                        </button>
                        <button 
                             onClick={() => setBoard('SSC')}
                             className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${board === 'SSC' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            SSC (AP/TS)
                        </button>
                    </div>
                    
                    {/* Subject filter tabs */}
                    <div className="bg-slate-100 p-1 rounded-lg inline-flex">
                        {availableSubjects.map(subj => {
                            const subjColors = {
                                'All': 'text-gray-700',
                                'Maths': 'text-blue-700',
                                'Science': 'text-emerald-700',
                                'English': 'text-amber-700'
                            };
                            return (
                                <button 
                                    key={subj}
                                    onClick={() => setSubjectFilter(subj)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        subjectFilter === subj 
                                            ? `bg-white shadow ${subjColors[subj] || 'text-gray-700'}` 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {subj}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full h-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
                            <div className="text-lg font-medium text-gray-500">Mapping the knowledge universe...</div>
                        </div>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                        className="bg-slate-50"
                    >
                        <Background color="#cbd5e1" gap={16} />
                        <Controls />
                    </ReactFlow>
                )}
            </div>

            {/* Topic Detail Overlay */}
            {selectedTopic && (
                <div className="absolute bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 z-20 slide-up">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-slate-50">
                        <div className="flex gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                selectedTopic.subject === 'Maths' ? 'bg-blue-100 text-blue-700' : 
                                selectedTopic.subject === 'Science' ? 'bg-green-100 text-green-700' : 
                                'bg-amber-100 text-amber-700'
                            }`}>
                                {selectedTopic.subject}
                            </span>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                Lvl {selectedTopic.difficulty_level}
                            </span>
                            {selectedTopic.masteryLevel && selectedTopic.masteryLevel !== 'not_started' && (
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    selectedTopic.masteryLevel === 'mastered' ? 'bg-green-100 text-green-700' :
                                    selectedTopic.masteryLevel === 'practicing' ? 'bg-blue-100 text-blue-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {selectedTopic.masteryLevel}
                                </span>
                            )}
                        </div>
                        <button onClick={() => setSelectedTopic(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedTopic.name}</h3>
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <Book className="w-4 h-4" /> {selectedTopic.chapter}
                        </p>
                        
                        {/* Mastery info */}
                        {selectedTopic.masteryLevel && (
                            <div className="bg-slate-50 p-3 rounded-lg mb-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Mastery:</span>
                                    <span className={`font-semibold ${
                                        selectedTopic.masteryLevel === 'mastered' ? 'text-green-600' :
                                        selectedTopic.masteryLevel === 'practicing' ? 'text-blue-600' :
                                        selectedTopic.masteryLevel === 'struggling' ? 'text-red-600' :
                                        'text-gray-400'
                                    }`}>
                                        {selectedTopic.masteryLevel === 'not_started' ? 'Not started' : selectedTopic.masteryLevel}
                                    </span>
                                </div>
                                {selectedTopic.attempts > 0 && (
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-500">Attempts:</span>
                                        <span className="font-semibold text-gray-700">{selectedTopic.attempts}</span>
                                    </div>
                                )}
                                {selectedTopic.bestScore > 0 && (
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-500">Best Score:</span>
                                        <span className="font-semibold text-gray-700">{selectedTopic.bestScore}%</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="bg-slate-50 p-3 rounded-lg mb-4">
                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Prerequisites</div>
                            {selectedTopic.prerequisite_topic_ids?.length > 0 ? (
                                <ul className="text-sm text-gray-700 list-disc pl-4">
                                    {selectedTopic.prerequisite_topic_ids.map(pid => {
                                        const pre = topics.find(t => t.id === pid);
                                        return <li key={pid}>{pre ? pre.name : `Topic #${pid}`}</li>;
                                    })}
                                </ul>
                            ) : (
                                <span className="text-sm text-gray-600 italic">None - you can start here!</span>
                            )}
                        </div>
                        
                        {!isTeacherView && (
                            <button 
                                onClick={handlePractice}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Practice This Topic
                            </button>
                        )}
                        
                        {isTeacherView && (
                            <div className="text-sm text-gray-500 italic text-center">
                                View class performance in heatmap.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeGraph;
