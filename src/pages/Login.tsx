import React from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FileText, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleQuickLogin = async () => {
    // For demo/testing purposes in the preview environment
    // In a real app, this would be a full email/password flow
    try {
      // We'll use a simple sign-in or just navigate if we want to mock it, 
      // but the user wants to "login". 
      // Let's use anonymous login as a fallback if Google fails.
      const { signInAnonymously } = await import('firebase/auth');
      await signInAnonymously(auth);
      navigate('/');
    } catch (error) {
      console.error('Quick login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-indigo-200">
          <FileText size={40} />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">智能报销系统</h1>
        <p className="text-slate-500 mb-8">企业级票据识别与报销管理平台</p>
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            使用 Google 账号登录
          </button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">快速访问</span>
            </div>
          </div>

          <button
            onClick={handleQuickLogin}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <LogIn size={20} />
            游客/测试登录
          </button>
        </div>
        
        <p className="mt-8 text-xs text-slate-400">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
