export type UserRole = 'employee' | 'finance' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string;
}

export type ReimbursementStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'returned';

export interface Reimbursement {
  id: string;
  userId: string;
  userName: string;
  department: string;
  reason: string;
  category: string;
  totalAmount: number;
  status: ReimbursementStatus;
  createdAt: string;
  updatedAt: string;
  auditOpinion?: string;
  auditorId?: string;
  auditorName?: string;
}

export interface ReimbursementItem {
  id: string;
  reimbursementId: string;
  type: string;
  date: string;
  merchant: string;
  amount: number;
  tax: number;
  total: number;
  category: string;
  ocrStatus: 'success' | 'failed' | 'processing';
  image: string;
  remark?: string;
  invoiceNumber?: string;
}
