import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';

import Login from './pages/Login';
import Navbar from './components/Navbar';

import StudentHome from './pages/StudentHome';
import Quiz from './pages/Quiz';
import Progress from './pages/Progress';
import KnowledgeGraph from './pages/KnowledgeGraph';

import TeacherDashboard from './pages/TeacherDashboard';
const TeacherGraph = () => <KnowledgeGraph isTeacherView={true} />;

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-stretch">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                
                {/* Student Routes */}
                <Route path="/student/home" element={
                    <ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>
                } />
                <Route path="/student/quiz/:topicId" element={
                    <ProtectedRoute allowedRoles={['student']}><Quiz /></ProtectedRoute>
                } />
                <Route path="/student/progress" element={
                    <ProtectedRoute allowedRoles={['student']}><Progress /></ProtectedRoute>
                } />
                <Route path="/student/graph" element={
                    <ProtectedRoute allowedRoles={['student']}><KnowledgeGraph /></ProtectedRoute>
                } />

                {/* Teacher Routes */}
                <Route path="/teacher/dashboard" element={
                    <ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>
                } />
                <Route path="/teacher/graph" element={
                    <ProtectedRoute allowedRoles={['teacher']}><TeacherGraph /></ProtectedRoute>
                } />
                
            </Routes>
        </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
