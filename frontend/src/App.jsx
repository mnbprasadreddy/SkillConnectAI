import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages - Lazy Loading
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Problems = lazy(() => import('./pages/Problems'));
const Workspace = lazy(() => import('./pages/Workspace'));
const Interviews = lazy(() => import('./pages/Interviews'));
const InterviewSetup = lazy(() => import('./pages/InterviewSetup'));
const LiveInterview = lazy(() => import('./pages/LiveInterview'));
const Profile = lazy(() => import('./pages/Profile'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const LearningMaterials = lazy(() => import('./pages/LearningMaterials'));
const Contests = lazy(() => import('./pages/Contests'));
const ContestArena = lazy(() => import('./pages/ContestArena'));
const ReplayCenter = lazy(() => import('./pages/ReplayCenter'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Community = lazy(() => import('./pages/Community'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminProblems = lazy(() => import('./pages/AdminProblems'));
const AdminContests = lazy(() => import('./pages/AdminContests'));
const AdminMaterials = lazy(() => import('./pages/AdminMaterials'));
const AdminAccess = lazy(() => import('./pages/AdminAccess'));
const AdminRoadmaps = lazy(() => import('./pages/AdminRoadmaps'));
const InterviewAnalytics = lazy(() => import('./pages/InterviewAnalytics'));
const DeepgramTest = lazy(() => import('./pages/DeepgramTest'));
import AdminRoute from './components/AdminRoute';

const LoadingFallback = () => (
  <div className="h-screen w-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
      <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] animate-pulse">Syncing Neural Stream</span>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, refreshUser } = useAuth();
  const [recovering, setRecovering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  
  React.useEffect(() => {
    if (!loading && user && !user.dbUser && !recovering && retryCount < MAX_RETRIES) {
      console.warn(`[ProtectedRoute] DB User missing, triggering recovery (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      setRecovering(true);
      setRetryCount(prev => prev + 1);
      refreshUser(true).finally(() => setRecovering(false));
    } else if (!loading && user && !user.dbUser && retryCount >= MAX_RETRIES) {
      console.warn('[ProtectedRoute] Max recovery retries reached. Proceeding with Firebase-only user data.');
    }
  }, [user, loading, user?.dbUser, refreshUser, recovering, retryCount]);

  if (loading || recovering) return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-neon-cyan" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] animate-pulse">Restoring Neural Identity</span>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

// Placeholder Pages
// No longer needed: const Contests = () => <h2 className="text-3xl font-bold">Global Neural Contests</h2>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Main App Routes */}
            <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="problems" element={<Problems />} />
              <Route path="interviews" element={<Interviews />} />
              <Route path="interviews/analytics" element={<InterviewAnalytics />} />
              <Route path="contests" element={<Contests />} />
              <Route path="contests/:id" element={<ContestArena />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="learning" element={<LearningMaterials />} />
              <Route path="replays" element={<ReplayCenter />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="community" element={<Community />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="admin/problems" element={<AdminRoute><AdminProblems /></AdminRoute>} />
              <Route path="admin/contests" element={<AdminRoute><AdminContests /></AdminRoute>} />
              <Route path="admin/materials" element={<AdminRoute><AdminMaterials /></AdminRoute>} />
              <Route path="admin/access" element={<AdminRoute><AdminAccess /></AdminRoute>} />
              <Route path="admin/roadmaps" element={<AdminRoute><AdminRoadmaps /></AdminRoute>} />
            </Route>

            {/* Full Screen Pages */}
            <Route path="/problems/:id" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
            <Route path="/interviews/live/:id" element={<ProtectedRoute><LiveInterview /></ProtectedRoute>} />
            <Route path="/interviews/setup" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
            <Route path="/test/deepgram" element={<DeepgramTest />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
