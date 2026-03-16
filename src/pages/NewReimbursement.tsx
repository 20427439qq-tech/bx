import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Reimbursement, ReimbursementItem } from '../types';
import { 
  Camera, 
  Upload, 
  X, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const NewReimbursement: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('差旅费');
  const [items, setItems] = useState<Partial<ReimbursementItem>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['差旅费', '交通费', '住宿费', '餐饮费', '办公费', '采购费', '招待费', '通讯费', '其他费用'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // Simulate OCR for each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const imageData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData })
        });
        
        const ocrResult = await response.json();
        
        setItems(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          image: imageData,
          type: ocrResult.type,
          date: ocrResult.date,
          merchant: ocrResult.merchant,
          amount: parseFloat(ocrResult.amount),
          tax: parseFloat(ocrResult.tax),
          total: parseFloat(ocrResult.total),
          category: ocrResult.category,
          ocrStatus: 'success',
          invoiceNumber: ocrResult.invoiceNumber
        }]);
      } catch (error) {
        console.error('OCR failed:', error);
        setItems(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          image: imageData,
          ocrStatus: 'failed',
          amount: 0,
          total: 0
        }]);
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ReimbursementItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (status: 'draft' | 'pending') => {
    if (!profile) return;
    if (items.length === 0) {
      alert('请至少上传一张票据');
      return;
    }

    setIsSubmitting(true);
    try {
      const reimbursementData: Omit<Reimbursement, 'id'> = {
        userId: profile.uid,
        userName: profile.name,
        department: profile.department,
        reason,
        category,
        totalAmount,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'reimbursements'), reimbursementData);
      
      // Add items
      for (const item of items) {
        await addDoc(collection(db, `reimbursements/${docRef.id}/items`), {
          ...item,
          reimbursementId: docRef.id
        });
      }

      navigate('/');
    } catch (error) {
      console.error('Submit failed:', error);
      alert('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">新建报销单</h2>
      </div>

      {/* Main Info */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">报销事由</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="例如：3月北京出差"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">主费用类别</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">票据明细 ({items.length})</h3>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-indigo-600 font-medium flex items-center gap-1 text-sm"
          >
            <Plus size={18} /> 添加票据
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*"
          className="hidden"
        />

        {items.length === 0 && !isUploading && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <Camera className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">点击上传或拍照</p>
            <p className="text-slate-400 text-xs mt-1">支持发票、收据、小票等</p>
          </div>
        )}

        {isUploading && (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-600 font-medium">正在识别票据内容...</p>
          </div>
        )}

        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image Preview */}
                <div className="w-full sm:w-32 h-32 bg-slate-100 relative">
                  <img src={item.image} alt="Receipt" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white">
                    #{index + 1}
                  </div>
                </div>

                {/* Edit Form */}
                <div className="flex-1 p-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      item.ocrStatus === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {item.ocrStatus === 'success' ? "识别成功" : "识别失败"}
                    </span>
                    <button onClick={() => removeItem(item.id!)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold">金额</label>
                    <input
                      type="number"
                      value={item.total}
                      onChange={(e) => updateItem(item.id!, 'total', parseFloat(e.target.value))}
                      className="w-full text-sm font-bold text-slate-900 border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold">日期</label>
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => updateItem(item.id!, 'date', e.target.value)}
                      className="w-full text-sm text-slate-600 border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-bold">商户</label>
                    <input
                      type="text"
                      value={item.merchant}
                      onChange={(e) => updateItem(item.id!, 'merchant', e.target.value)}
                      className="w-full text-sm text-slate-600 border-b border-slate-100 focus:border-indigo-500 outline-none py-1"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary & Actions */}
      <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 sticky bottom-20 md:bottom-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-500">报销总金额</p>
            <p className="text-3xl font-black text-indigo-600">¥ {totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">单据数量</p>
            <p className="text-xl font-bold text-slate-900">{items.length} 张</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="py-4 px-6 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            保存草稿
          </button>
          <button
            disabled={isSubmitting || items.length === 0}
            onClick={() => handleSubmit('pending')}
            className="py-4 px-6 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            提交审核
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewReimbursement;
