import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Reimbursement } from '../types';
import { 
  Camera, 
  Upload, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Plus,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const EmployeeHome: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [recentRequests, setRecentRequests] = useState<Reimbursement[]>([]);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'reimbursements'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reimbursement));
      setRecentRequests(data);
    });

    return unsubscribe;
  }, [profile]);

  const stats = [
    { label: '待审核', count: recentRequests.filter(r => r.status === 'pending').length, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: '已通过', count: recentRequests.filter(r => r.status === 'approved').length, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: '已驳回', count: recentRequests.filter(r => r.status === 'rejected').length, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900">你好, {profile?.name}</h2>
        <p className="text-slate-500">欢迎回来，今天需要报销什么？</p>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/new?source=camera')}
          className="flex flex-col items-center justify-center p-6 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100"
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <Camera size={28} />
          </div>
          <span className="font-semibold">拍照报销</span>
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/new?source=gallery')}
          className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-3xl text-slate-700 shadow-sm"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-indigo-600">
            <Upload size={28} />
          </div>
          <span className="font-semibold">相册上传</span>
        </motion.button>
      </section>

      {/* Stats Summary */}
      <section className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} p-4 rounded-2xl text-center`}>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">最近报销</h3>
          <button onClick={() => navigate('/my-list')} className="text-sm text-indigo-600 font-medium">查看全部</button>
        </div>

        <div className="space-y-3">
          {recentRequests.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center">
              <FileText className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-400 text-sm">暂无报销记录</p>
            </div>
          ) : (
            recentRequests.map((req) => (
              <motion.div
                key={req.id}
                whileHover={{ x: 4 }}
                onClick={() => navigate(`/detail/${req.id}`)}
                className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 cursor-pointer shadow-sm shadow-slate-100"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  req.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                  req.status === 'rejected' ? "bg-rose-50 text-rose-600" :
                  "bg-amber-50 text-amber-600"
                )}>
                  {req.status === 'approved' ? <CheckCircle2 size={24} /> :
                   req.status === 'rejected' ? <XCircle size={24} /> :
                   <Clock size={24} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">{req.reason || '未填写事由'}</h4>
                  <p className="text-xs text-slate-500">
                    {format(new Date(req.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-slate-900">¥{req.totalAmount.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">{req.category}</p>
                </div>
                
                <ChevronRight size={16} className="text-slate-300" />
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Floating Add Button for Mobile */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/new')}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center z-40"
      >
        <Plus size={32} />
      </motion.button>
    </div>
  );
};

export default EmployeeHome;
