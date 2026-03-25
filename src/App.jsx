import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppShell from './components/AppShell';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import OrgChart from './pages/OrgChart';
import AgentProfile from './pages/AgentProfile';
import Chat from './pages/Chat';
import Directives from './pages/Directives';
import Projects from './pages/Projects';
import Brain from './pages/Brain';
import Core from './pages/Core';
import Outputs from './pages/Outputs';
import Memory from './pages/Memory';
import SettingsPage from './pages/SettingsPage';

import Tasks from './pages/Tasks';
import ChatHistory from './pages/ChatHistory';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AppShell>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/org-chart" element={<OrgChart />} />
          <Route path="/agent/:id" element={<AgentProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/directives" element={<Directives />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/brain" element={<Brain />} />
          <Route path="/core" element={<Core />} />
          <Route path="/outputs" element={<Outputs />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/board-chat" element={<Chat />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/chat-history" element={<ChatHistory />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AppShell>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App