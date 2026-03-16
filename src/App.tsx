import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import EmployeeHome from './pages/EmployeeHome';
import NewReimbursement from './pages/NewReimbursement';
import MyReimbursements from './pages/MyReimbursements';
import ReimbursementDetail from './pages/ReimbursementDetail';
import FinanceDashboard from './pages/FinanceDashboard';
import AuditList from './pages/AuditList';
import AuditDetail from './pages/AuditDetail';

const PrivateRoute: React.FC<{ children: React.ReactNode, role?: string }> = ({ children, role }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
  if (role && profile?.role !== role && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            {/* Employee Routes */}
            <Route index element={<EmployeeHome />} />
            <Route path="new" element={<NewReimbursement />} />
            <Route path="my-list" element={<MyReimbursements />} />
            <Route path="detail/:id" element={<ReimbursementDetail />} />
            <Route path="profile" element={<div className="p-8 text-center text-slate-500">个人中心模块开发中...</div>} />

            {/* Finance Routes */}
            <Route path="finance" element={<PrivateRoute role="finance"><FinanceDashboard /></PrivateRoute>} />
            <Route path="finance/audit" element={<PrivateRoute role="finance"><AuditList /></PrivateRoute>} />
            <Route path="finance/audit/:id" element={<PrivateRoute role="finance"><AuditDetail /></PrivateRoute>} />
            <Route path="finance/stats" element={<div className="p-8 text-center text-slate-500">统计分析模块开发中...</div>} />
            <Route path="finance/settings" element={<div className="p-8 text-center text-slate-500">系统设置模块开发中...</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
