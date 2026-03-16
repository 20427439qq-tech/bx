import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Reimbursement, ReimbursementItem } from '../types';
import { 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  User,
  Building2,
  Calendar,
  Tag,
  MessageSquare,
  ExternalLink,
  Loader2,
  Printer,
  Maximize2
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

import PrintView from '../components/PrintView';

const AuditDetail: React.FC = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null);
  const [items, setItems] = useState<ReimbursementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opinion, setOpinion] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'reimbursements', id));
        if (docSnap.exists()) {
          setReimbursement({ id: docSnap.id, ...docSnap.data() } as Reimbursement);
          const itemsSnap = await getDocs(collection(db, `reimbursements/${id}/items`));
          setItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReimbursementItem)));
        }
      } catch (error) {
        console.error('Fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAudit = async (status: 'approved' | 'rejected' | 'returned') => {
    if (!id || !profile) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'reimbursements', id), {
        status,
        auditOpinion: opinion,
        auditorId: profile.uid,
        auditorName: profile.name,
        updatedAt: new Date().toISOString()
      });
      navigate('/finance/audit');
    } catch (error) {
      console.error('Audit failed:', error);
      alert('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!reimbursement) return <div>未找到报销单</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">审核详情</h2>
        </div>
        <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-indigo-600"><Printer size={20} /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Receipt Preview */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 px-2">票据核对 ({items.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, idx) => (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="h-48 bg-slate-100 relative group">
                  <img src={item.image} alt="Receipt" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => setSelectedImage(item.image)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40">
                      <Maximize2 size={20} />
                    </button>
                    <button onClick={() => window.open(item.image)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40">
                      <ExternalLink size={20} />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[10px] text-white">
                    #{idx + 1} {item.type}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-slate-900">¥ {item.total.toFixed(2)}</span>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{item.merchant}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{item.category}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">税额: ¥{item.tax.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Audit Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 sticky top-8">
            <div className="pb-4 border-b border-slate-100">
              <p className="text-sm text-slate-500">报销总额</p>
              <p className="text-3xl font-black text-indigo-600">¥ {reimbursement.totalAmount.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <InfoItem icon={User} label="申请人" value={reimbursement.userName} />
              <InfoItem icon={Building2} label="部门" value={reimbursement.department} />
              <InfoItem icon={Calendar} label="申请时间" value={format(new Date(reimbursement.createdAt), 'yyyy-MM-dd HH:mm')} />
              <InfoItem icon={Tag} label="主类别" value={reimbursement.category} />
              <InfoItem icon={MessageSquare} label="事由" value={reimbursement.reason || '无'} />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">审核意见</label>
              <textarea
                value={opinion}
                onChange={(e) => setOpinion(e.target.value)}
                placeholder="填写通过理由或驳回原因..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                disabled={isSubmitting || reimbursement.status !== 'pending'}
                onClick={() => handleAudit('approved')}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={20} /> 审核通过
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={isSubmitting || reimbursement.status !== 'pending'}
                  onClick={() => handleAudit('returned')}
                  className="py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw size={18} /> 退回修改
                </button>
                <button
                  disabled={isSubmitting || reimbursement.status !== 'pending'}
                  onClick={() => handleAudit('rejected')}
                  className="py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={18} /> 驳回申请
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={selectedImage}
              className="max-w-full max-h-full rounded-lg shadow-2xl"
            />
            <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full">
              <XCircle size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PrintView reimbursement={reimbursement} items={items} />
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
      <Icon size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-400 uppercase font-bold">{label}</p>
      <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
    </div>
  </div>
);

export default AuditDetail;
