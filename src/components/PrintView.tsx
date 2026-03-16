import React from 'react';
import { Reimbursement, ReimbursementItem } from '../types';
import { format } from 'date-fns';

interface PrintViewProps {
  reimbursement: Reimbursement;
  items: ReimbursementItem[];
}

const PrintView: React.FC<PrintViewProps> = ({ reimbursement, items }) => {
  return (
    <div className="print-container p-8 bg-white text-black text-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold border-b-2 border-black pb-2 inline-block">费用报销单</h1>
        <div className="flex justify-between mt-4">
          <span>报销单号：{reimbursement.id}</span>
          <span>申请日期：{format(new Date(reimbursement.createdAt), 'yyyy年MM月dd日')}</span>
        </div>
      </div>

      <table className="w-full border-collapse border border-black mb-6">
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold w-24">报销人</td>
            <td className="border border-black p-2 w-40">{reimbursement.userName}</td>
            <td className="border border-black p-2 font-bold w-24">所属部门</td>
            <td className="border border-black p-2">{reimbursement.department}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold">报销事由</td>
            <td className="border border-black p-2" colSpan={3}>{reimbursement.reason}</td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold">费用类别</td>
            <td className="border border-black p-2">{reimbursement.category}</td>
            <td className="border border-black p-2 font-bold">单据张数</td>
            <td className="border border-black p-2">{items.length} 张</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-black mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-12 text-center">序号</th>
            <th className="border border-black p-2 text-center">日期</th>
            <th className="border border-black p-2 text-center">费用项目/商户</th>
            <th className="border border-black p-2 text-center">金额 (元)</th>
            <th className="border border-black p-2 text-center">备注</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="border border-black p-2 text-center">{index + 1}</td>
              <td className="border border-black p-2 text-center">{item.date}</td>
              <td className="border border-black p-2">{item.merchant} ({item.type})</td>
              <td className="border border-black p-2 text-right">{item.total.toFixed(2)}</td>
              <td className="border border-black p-2">{item.remark || ''}</td>
            </tr>
          ))}
          <tr>
            <td className="border border-black p-2 font-bold text-center" colSpan={3}>合计金额 (大写)</td>
            <td className="border border-black p-2 font-bold text-right" colSpan={2}>
              ¥ {reimbursement.totalAmount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-4 mt-12">
        <div className="border-t border-black pt-2">部门主管签字：</div>
        <div className="border-t border-black pt-2">财务审核签字：</div>
        <div className="border-t border-black pt-2">报销人签字：</div>
      </div>

      <div className="mt-20 page-break-before">
        <h3 className="font-bold mb-4">原始票据附件</h3>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, idx) => (
            <div key={item.id} className="border border-gray-200 p-2 text-center">
              <img src={item.image} alt={`Receipt ${idx + 1}`} className="max-h-64 mx-auto mb-2" />
              <p className="text-xs text-gray-500">附件 {idx + 1}: {item.merchant} - ¥{item.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintView;
