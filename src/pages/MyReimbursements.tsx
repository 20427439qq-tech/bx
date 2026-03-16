import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Reimbursement } from '../types';
import { 
  Search, 
  Filter, 
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileEdit,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';

const MyReimbursements: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Reimbursement[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'reimbursements'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reimbursement));
      setRequests(data);
    });

    return unsubscribe;
  }, [profile]);

  const filteredRequests = requests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.reason.toLowerCase().includes(search.toLowerCase()) || r.id.includes(search);
    return matchesFilter && matchesSearch;
  });

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    draft: { label: '草稿', color: 'text-slate-500 bg-slate-50', icon: FileEdit },
    pending: { label: '待审核', color: 'text-amber-500 bg-amber-50', icon: Clock },
    approved: { label: '已通过', color: 'text-emerald-500 bg-emerald-50', icon: CheckCircle2 },
    rejected: { label: '已驳回', color: 'text-rose-500 bg-rose-50', icon: XCircle },
    returned: { label: '退回修改', color: 'text-indigo-500 bg-indigo-50', icon: RotateCcw },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">我的报销单</h2>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="搜索事由或单号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {['all', 'pending', 'approved', 'rejected', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                filter === s ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white text-slate-600 border border-slate-200"
              )}
            >
              {s === 'all' ? '全部' : statusMap[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredRequests.map((req) => {
          const status = statusMap[req.status];
          return (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => navigate(`/detail/${req.id}`)}
              className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", status.color)}>
                <status.icon size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-slate-900 truncate">{req.reason || '未填写事由'}</h4>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", status.color)}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  单号: {req.id.slice(-8)} • {format(new Date(req.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                </p>
              </div>

              <div className="text-right">
                <p className="font-black text-slate-900">¥{req.totalAmount.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">{req.category}</p>
              </div>
              
              <ChevronRight size={16} className="text-slate-300" />
            </motion.div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <FileText className="mx-auto text-slate-200 mb-4" size={64} />
            <p className="text-slate-400">没有找到相关报销单</p>
          </div>
        )}
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default MyReimbursements;
