
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Tests from './pages/Tests';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import Accounts from './pages/Accounts';
import ClientDashboard from './pages/ClientDashboard';
import HomeTestRequest from './pages/HomeTestRequest';
import Layout from './components/Layout';
import { User, AuthState, UserRole } from './types';
import { getCurrentUser, saveData, getUserProfile } from './services/firebaseService';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth from Firebase on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // حاول تحميل ملف البروفايل من قاعدة البيانات ليحصل المستخدم على دوره الصحيح
          const profile = await getUserProfile(currentUser.uid);
          const user: User = {
            id: currentUser.uid,
            name: profile?.displayName || currentUser.displayName || 'User',
            username: currentUser.email?.split('@')[0] || 'user',
            email: currentUser.email || '',
            role: (profile?.role as UserRole) || UserRole.CLIENT
          };
          setAuth({ user, isAuthenticated: true });
        } else {
          setAuth({ user: null, isAuthenticated: false });
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
        setAuth({ user: null, isAuthenticated: false });
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  useEffect(() => {
    if (auth.user && auth.isAuthenticated) {
      try {
        saveData(`users/${auth.user.id}/authState`, auth);
      } catch (e) {
        console.error("Auth save error:", e);
      }
    }
  }, [auth]);

  const handleLogin = (user: User) => {
    setAuth({ user, isAuthenticated: true });
    navigate('/');
  };

  const handleLogout = async () => {
    const { logoutUser } = await import('./services/firebaseService');
    await logoutUser();
    setAuth({ user: null, isAuthenticated: false });
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // إذا كان المستخدم عميلاً، نوجهه لصفحة العميل فقط
  if (auth.user?.role === UserRole.CLIENT) {
    return (
      <Layout user={auth.user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<ClientDashboard user={auth.user} />} />
          <Route path="/home-test" element={<HomeTestRequest user={auth.user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout user={auth.user} onLogout={handleLogout}>
      <Routes>
        {/* Admin routes - Full access */}
        {auth.user?.role === UserRole.ADMIN && (
          <>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Employee routes - Limited access */}
        {auth.user?.role === UserRole.EMPLOYEE && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
