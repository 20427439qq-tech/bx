import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Reimbursement, ReimbursementItem } from '../types';
import { 
  ChevronLeft, 
  Printer, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Calendar,
  User,
  Building2,
  Tag,
  MessageSquare,
  ExternalLink,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';

import PrintView from '../components/PrintView';

const ReimbursementDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reimbursement, setReimbursement] = useState<Reimbursement | null>(null);
  const [items, setItems] = useState<ReimbursementItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex items-center justify-center h-64"><Clock className="animate-spin text-indigo-600" /></div>;
  if (!reimbursement) return <div>未找到报销单</div>;

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    draft: { label: '草稿', color: 'text-slate-500 bg-slate-50', icon: Clock },
    pending: { label: '待审核', color: 'text-amber-500 bg-amber-50', icon: Clock },
    approved: { label: '已通过', color: 'text-emerald-500 bg-emerald-50', icon: CheckCircle2 },
    rejected: { label: '已驳回', color: 'text-rose-500 bg-rose-50', icon: XCircle },
    returned: { label: '退回修改', color: 'text-indigo-500 bg-indigo-50', icon: RotateCcw },
  };

  const status = statusMap[reimbursement.status];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">报销详情</h2>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all"
        >
          <Printer size={18} /> 打印
        </button>
      </div>

      {/* Status Card */}
      <div className={cn("p-6 rounded-3xl flex items-center justify-between", status.color)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center">
            <status.icon size={28} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">当前状态</p>
            <p className="text-xl font-bold">{status.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium opacity-80">报销总额</p>
          <p className="text-2xl font-black">¥ {reimbursement.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoItem icon={FileText} label="报销单号" value={reimbursement.id} />
          <InfoItem icon={User} label="报销人" value={reimbursement.userName} />
          <InfoItem icon={Building2} label="所属部门" value={reimbursement.department} />
        </div>
        <div className="space-y-4">
          <InfoItem icon={Calendar} label="申请日期" value={format(new Date(reimbursement.createdAt), 'yyyy-MM-dd HH:mm')} />
          <InfoItem icon={Tag} label="费用类别" value={reimbursement.category} />
          <InfoItem icon={MessageSquare} label="报销事由" value={reimbursement.reason || '无'} />
        </div>
      </div>

      {/* Audit Opinion */}
      {reimbursement.auditOpinion && (
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
          <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
            <MessageSquare size={18} /> 审核意见
          </h3>
          <p className="text-amber-800 text-sm">{reimbursement.auditOpinion}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-600">
            <span>审核人: {reimbursement.auditorName}</span>
            <span>•</span>
            <span>时间: {format(new Date(reimbursement.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 px-2">票据明细 ({items.length})</h3>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm flex flex-col sm:flex-row">
              <div className="w-full sm:w-40 h-40 bg-slate-100 relative group">
                <img src={item.image} alt="Receipt" className="w-full h-full object-cover" />
                <button 
                  onClick={() => window.open(item.image)}
                  className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <ExternalLink size={24} />
                </button>
              </div>
              <div className="flex-1 p-5 grid grid-cols-2 gap-y-3 gap-x-6">
                <div className="col-span-2 flex justify-between items-start">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">#{idx + 1} {item.type}</span>
                  <span className="text-lg font-black text-slate-900">¥ {item.total.toFixed(2)}</span>
                </div>
                <DetailItem label="日期" value={item.date} />
                <DetailItem label="商户" value={item.merchant} />
                <DetailItem label="类别" value={item.category} />
                <DetailItem label="税额" value={`¥ ${item.tax.toFixed(2)}`} />
                {item.invoiceNumber && <div className="col-span-2"><DetailItem label="发票号码" value={item.invoiceNumber} /></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PrintView reimbursement={reimbursement} items={items} />
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
      <Icon size={16} />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 uppercase font-bold">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }: any) => (
  <div>
    <p className="text-[10px] text-slate-400 uppercase font-bold">{label}</p>
    <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
  </div>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default ReimbursementDetail;
